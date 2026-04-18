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

            // Check if username already exists
            const { rows } = await tursoQuery("SELECT id FROM users WHERE username = ?", [username]);
            if (rows.length > 0) {
                return res.status(400).json({ error: 'Username already exists' });
            }

            // Hash password
            const password_hash = crypto.createHash('sha256').update(password).digest('hex');
            
            // Generate token
            const token = crypto.randomBytes(32).toString('hex');

            // Insert user
            const result = await tursoQuery(
                "INSERT INTO users (username, password_hash, token) VALUES (?, ?, ?)",
                [username, password_hash, token]
            );

            return res.status(201).json({ 
                success: true, 
                token, 
                user_id: result.lastInsertRowid,
                username
            });
        } catch (e) {
            console.error('Register error:', e.message);
            return res.status(500).json({ error: e.message });
        }
    }

    return res.status(405).json({ error: "Method not allowed" });
};
