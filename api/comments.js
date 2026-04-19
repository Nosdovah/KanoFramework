const { tursoQuery } = require('./_utils/db');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { item_id } = req.query;

    if (req.method === 'GET') {
        if (!item_id) return res.status(400).json({ error: "item_id required" });
        try {
            const { rows } = await tursoQuery(
                "SELECT * FROM item_comments WHERE item_id = ? ORDER BY created_at ASC",
                [item_id]
            );
            return res.status(200).json(rows);
        } catch (e) {
            return res.status(500).json({ error: e.message });
        }
    }

    if (req.method === 'POST') {
        const { author_name, content } = req.body;
        if (!item_id || !content) return res.status(400).json({ error: "Missing fields" });

        try {
            await tursoQuery(
                "INSERT INTO item_comments (item_id, author_name, content) VALUES (?, ?, ?)",
                [item_id, author_name || 'Anonymous', content]
            );
            return res.status(200).json({ success: true });
        } catch (e) {
            return res.status(500).json({ error: e.message });
        }
    }

    return res.status(405).json({ error: "Method not allowed" });
};
