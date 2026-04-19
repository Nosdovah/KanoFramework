const { tursoQuery, authenticate } = require('./_utils/db');
const crypto = require('crypto');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method === 'POST') {
        try {
            const user_id = await authenticate(req);
            const { permission } = req.body;
            
            if (permission !== 'viewer') {
                return res.status(400).json({ error: "Only viewer permission is supported" });
            }

            const token = crypto.randomBytes(16).toString('hex');
            await tursoQuery(
                "INSERT INTO shared_projects (owner_id, share_token, permission) VALUES (?, ?, ?)",
                [user_id, token, permission]
            );

            return res.status(200).json({ token, permission });
        } catch (e) {
            return res.status(401).json({ error: e.message });
        }
    }

    if (req.method === 'GET') {
        const { token } = req.query;
        if (!token) return res.status(400).json({ error: "Token required" });

        try {
            const { rows } = await tursoQuery(
                "SELECT owner_id, permission FROM shared_projects WHERE share_token = ?",
                [token]
            );

            if (rows.length === 0) {
                return res.status(404).json({ error: "Invalid or expired share link" });
            }

            return res.status(200).json(rows[0]);
        } catch (e) {
            return res.status(500).json({ error: e.message });
        }
    }

    // Optional: Delete share link
    if (req.method === 'DELETE') {
        try {
            const user_id = await authenticate(req);
            const { token } = req.query;
            await tursoQuery("DELETE FROM shared_projects WHERE share_token = ? AND owner_id = ?", [token, user_id]);
            return res.status(200).json({ success: true });
        } catch (e) {
            return res.status(401).json({ error: e.message });
        }
    }

    return res.status(405).json({ error: "Method not allowed" });
};
