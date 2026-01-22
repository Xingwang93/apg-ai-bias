import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    // 1. Method check
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { prompt, model, provider } = req.body;

    // 2. Input validation
    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }

    try {
        // 3. Initialize secure Supabase client (Service Role)
        const supabaseUrl = process.env.VITE_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error('Missing server-side configuration');
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // 4. Check Global Kill Switch (GENERATION_ENABLED)
        const { data: genConfig, error: genError } = await supabase
            .from('app_config')
            .select('config_value')
            .eq('config_key', 'GENERATION_ENABLED')
            .single();

        if (genError && genError.code !== 'PGRST116') { // Ignore not found, default to true/false logic below
            console.error('Error checking generation status:', genError);
        }

        // Default to enabled if not found, but if explicitly false, block it.
        // Actually, if we are security hardening, maybe default to disabled if config missing?
        // Let's assume default true if missing, or strictly follow config.
        const isEnabled = genConfig ? genConfig.config_value === 'true' : true;

        if (!isEnabled) {
            return res.status(403).json({ error: 'Generation is currently disabled by the administrator.' });
        }

        // 5. Fetch API Key for provider
        let configKey = '';
        if (provider === 'openai') configKey = 'OPENAI_API_KEY';
        else if (provider === 'replicate') configKey = 'REPLICATE_API_TOKEN';
        else if (provider === 'huggingface') configKey = 'HF_TOKEN';
        else if (provider === 'google') configKey = 'GOOGLE_API_KEY';
        else {
            return res.status(400).json({ error: 'Unknown provider' });
        }

        const { data: keyConfig, error: keyError } = await supabase
            .from('app_config')
            .select('config_value')
            .eq('config_key', configKey)
            .single();

        if (keyError || !keyConfig || !keyConfig.config_value) {
            // Fallback: check process.env for local dev or backup
            // But strictly speaking, we want to rely on DB. 
            // However, if DB fails, maybe we don't want to fallback to env if RLS is strict. 
            // Let's fallback to process.env[configKey] just in case config isn't in DB yet.
            if (!process.env[configKey]) {
                throw new Error(`API key for ${provider} not configured in system.`);
            }
        }

        const apiKey = (keyConfig && keyConfig.config_value) || process.env[configKey];

        // 6. Call Provider API
        let imageUrl = '';

        if (provider === 'openai') {
            const response = await fetch('https://api.openai.com/v1/images/generations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'dall-e-3',
                    prompt: prompt,
                    n: 1,
                    size: '1024x1024'
                })
            });
            const data = await response.json();
            if (data.error) throw new Error(data.error.message);
            imageUrl = data.data[0].url;
        }

        else if (provider === 'replicate') {
            const response = await fetch('https://api.replicate.com/v1/predictions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${apiKey}`
                },
                body: JSON.stringify({
                    version: model || 'black-forest-labs/flux-dev',
                    input: { prompt: prompt }
                })
            });
            let prediction = await response.json();

            if (prediction.error) throw new Error(prediction.error);

            // Poll for completion
            const maxAttempts = 60;
            let attempts = 0;
            while (prediction.status !== 'succeeded' && prediction.status !== 'failed' && attempts < maxAttempts) {
                await new Promise(r => setTimeout(r, 1000));
                attempts++;
                const resPoll = await fetch(prediction.urls.get, {
                    headers: { 'Authorization': `Token ${apiKey}` }
                });
                prediction = await resPoll.json();
            }

            if (prediction.status === 'failed') throw new Error('Replicate generation failed');
            if (prediction.status !== 'succeeded') throw new Error('Generation timed out');

            imageUrl = prediction.output[0];
        }

        else if (provider === 'huggingface') {
            const response = await fetch('https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-dev', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ inputs: prompt })
            });

            if (!response.ok) {
                const err = await response.text();
                throw new Error(`HF Error: ${err}`);
            }

            // HF returns a blob (image/jpeg)
            // We need to convert it to base64 or a URL. 
            // Since we can't easily return a blob URL that works on client from server function without hosting,
            // we will return base64 data URI.
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const base64 = buffer.toString('base64');
            imageUrl = `data:image/jpeg;base64,${base64}`;
        }

        else if (provider === 'google') {
            // Using Google Generative AI API for Imagen 3
            const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:generateImages?key=${apiKey}`;

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    prompt: { text: prompt },
                    number_of_images: 1
                })
            });

            const data = await response.json();
            if (!response.ok || data.error) {
                throw new Error(data.error?.message || `Google API Error: ${JSON.stringify(data)}`);
            }

            // Google returns base64 in data.images[0].imageBytes
            const base64 = data.images[0].imageBytes;
            imageUrl = `data:image/png;base64,${base64}`;
        }

        res.status(200).json({ imageUrl });

    } catch (error) {
        console.error('Generation Error:', error);
        res.status(500).json({ error: error.message });
    }
}
