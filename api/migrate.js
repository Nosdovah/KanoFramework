const { tursoQuery } = require('./_utils/db');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method !== 'GET') return res.status(405).end();
    
    try {
        const username = "raihanhaniffirdaus@gmail.com";
        
        // Find the user
        const { rows } = await tursoQuery("SELECT id FROM users WHERE username = ?", [username]);
        if (rows.length === 0) {
            return res.status(404).json({ 
                error: 'Account not found.', 
                hint: 'Please ensure you have created an account with username "raihanhaniffirdaus@gmail.com" first.' 
            });
        }
        
        const user_id = rows[0].id;
        
        // Update all unassigned global items to this user_id
        await tursoQuery("UPDATE kano_items SET user_id = ? WHERE user_id IS NULL OR user_id = 0", [user_id]);
        
        return res.json({ 
            success: true, 
            message: `Global data successfully migrated to ${username}. You can now see the data when you log in!` 
        });
    } catch(e) {
        console.error('Migration error:', e.message);
        return res.status(500).json({ error: e.message });
    }
};
