const { tursoQuery, authenticate } = require('./_utils/db');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();

    let user_id;
    try {
        user_id = await authenticate(req);
    } catch (e) {
        if (req.method === 'GET') {
            // Guest mode: Fallback to raihanhaniffirdaus@gmail.com for example data
            const { rows } = await tursoQuery("SELECT id FROM users WHERE username = ?", ["raihanhaniffirdaus@gmail.com"]);
            if (rows.length > 0) {
                user_id = rows[0].id;
            } else {
                return res.status(401).json({ error: "Please log in" });
            }
        } else {
            return res.status(401).json({ error: e.message });
        }
    }

    if (req.method === 'GET') {
        try {
            const { rows } = await tursoQuery("SELECT * FROM kano_items WHERE user_id = ? ORDER BY id ASC", [user_id]);
            return res.status(200).json(rows);
        } catch (e) {
            console.error('GET error:', e.message);
            return res.status(500).json({ error: e.message });
        }
    }

    if (req.method === 'POST') {
        const { problem, solution, relations } = req.body;
        try {
            const { lastInsertRowid } = await tursoQuery(
                "INSERT INTO kano_items (user_id, problem, solution, kano_f, kano_d, kano_category, relations) VALUES (?, ?, ?, '', '', '', ?)",
                [user_id, problem, solution, relations]
            );
            return res.status(200).json({ id: lastInsertRowid });
        } catch (e) {
            console.error('POST error:', e.message);
            return res.status(500).json({ error: e.message });
        }
    }

    return res.status(405).json({ error: "Method not allowed" });
};
