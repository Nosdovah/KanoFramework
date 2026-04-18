const { tursoQuery, authenticate } = require('../_utils/db');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method === 'GET') {
        try {
            const user_id = await authenticate(req);
            const { rows } = await tursoQuery("SELECT username FROM users WHERE id = ?", [user_id]);
            
            if (rows.length === 0) {
                return res.status(401).json({ error: 'User not found' });
            }

            return res.status(200).json({ 
                success: true, 
                user_id,
                username: rows[0].username 
            });
        } catch (e) {
            console.error('Verify error:', e.message);
            return res.status(401).json({ error: 'Unauthorized' });
        }
    }

    return res.status(405).json({ error: "Method not allowed" });
};
