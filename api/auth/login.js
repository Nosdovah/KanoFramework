const { tursoQuery } = require('../_utils/db');
const crypto = require('crypto');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method === 'POST') {
        try {
            const { username, password } = req.body;
            if (!username || !password) {
                return res.status(400).json({ error: 'Username and password are required' });
            }

            // Find user
            const { rows } = await tursoQuery("SELECT id, password_hash, token FROM users WHERE username = ?", [username]);
            
            if (rows.length === 0) {
                return res.status(401).json({ error: 'Invalid username or password' });
            }

            const user = rows[0];
            const password_hash = crypto.createHash('sha256').update(password).digest('hex');

            if (user.password_hash !== password_hash) {
                return res.status(401).json({ error: 'Invalid username or password' });
            }

            // Generate new token or update token (rotating for security)
            const newToken = crypto.randomBytes(32).toString('hex');
            
            await tursoQuery("UPDATE users SET token = ? WHERE id = ?", [newToken, user.id]);

            return res.status(200).json({ 
                success: true, 
                token: newToken, 
                user_id: user.id,
                username 
            });
        } catch (e) {
            console.error('Login error:', e.message);
            return res.status(500).json({ error: e.message });
        }
    }

    return res.status(405).json({ error: "Method not allowed" });
};
