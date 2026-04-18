const { tursoQuery } = require('../_utils/db');
const crypto = require('crypto');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method === 'POST') {
        const { username, newPassword } = req.body;
        if (!username || !newPassword) {
            return res.status(400).json({ error: 'Username and new password are required' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }
        try {
            const { rows } = await tursoQuery("SELECT id FROM users WHERE username = ?", [username]);
            if (rows.length === 0) {
                return res.status(404).json({ error: 'Account not found. Check your username.' });
            }

            const password_hash = crypto.createHash('sha256').update(newPassword).digest('hex');
            const newToken = crypto.randomBytes(32).toString('hex');

            await tursoQuery(
                "UPDATE users SET password_hash = ?, token = ? WHERE id = ?",
                [password_hash, newToken, rows[0].id]
            );

            return res.status(200).json({ success: true, message: 'Password reset successfully.' });
        } catch (e) {
            console.error('Reset error:', e.message);
            return res.status(500).json({ error: e.message });
        }
    }

    return res.status(405).json({ error: "Method not allowed" });
};
