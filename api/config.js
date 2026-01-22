import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    const { method } = req;
    const passcode = req.headers['x-admin-passcode'];

    if (!passcode) {
        return res.status(401).json({ error: 'Unauthorized: Missing Admin Passcode' });
    }

    // Initialize Service Role Client
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        return res.status(500).json({ error: 'Server configuration error' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify Passcode against DB Logic
    // We fetch the stored passcode using the service role client
    const { data: passcodeData, error: passcodeError } = await supabase
        .from('app_config')
        .select('config_value')
        .eq('config_key', 'ADMIN_PASSCODE')
        .single();

    if (passcodeError || !passcodeData || passcodeData.config_value !== passcode) {
        return res.status(401).json({ error: 'Unauthorized: Invalid Passcode' });
    }

    try {
        if (method === 'GET') {
            // List all configs
            const { data, error } = await supabase
                .from('app_config')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return res.status(200).json(data);
        }

        if (method === 'POST') {
            // Add or Update Config
            const { config_key, config_value } = req.body;
            if (!config_key || config_value === undefined) {
                return res.status(400).json({ error: 'Missing key or value' });
            }

            // Upsert
            const { data, error } = await supabase
                .from('app_config')
                .upsert({ config_key, config_value }, { onConflict: 'config_key' })
                .select();

            if (error) throw error;
            return res.status(200).json(data);
        }

        if (method === 'DELETE') {
            const { id, config_key } = req.body; // Can delete by ID or Key

            let query = supabase.from('app_config').delete();
            if (id) query = query.eq('id', id);
            else if (config_key) query = query.eq('config_key', config_key);
            else return res.status(400).json({ error: 'Missing id or config_key' });

            const { error } = await query;
            if (error) throw error;
            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: 'Method not allowed' });

    } catch (error) {
        console.error('Config API Error:', error);
        res.status(500).json({ error: error.message });
    }
}
