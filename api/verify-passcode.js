import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { passcode } = req.body;

    if (!passcode) {
        return res.status(400).json({ error: 'Passcode is required' });
    }

    try {
        const supabaseUrl = process.env.VITE_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
            return res.status(500).json({ error: 'Server configuration error' });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Fetch the stored passcode
        const { data, error } = await supabase
            .from('app_config')
            .select('config_value')
            .eq('config_key', 'ADMIN_PASSCODE')
            .single();

        if (error) {
            console.error('Database error fetching passcode:', error);
            // Default fallback if DB fails or not set? 
            // Better to fail secure.
            return res.status(500).json({ error: 'Verification service unavailable' });
        }

        const storedPasscode = data?.config_value;

        if (passcode === storedPasscode) {
            return res.status(200).json({ success: true });
        } else {
            return res.status(401).json({ error: 'Invalid passcode' });
        }

    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
