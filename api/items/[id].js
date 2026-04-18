const { tursoQuery, authenticate } = require('../_utils/db');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') return res.status(200).end();

    let user_id;
    try {
        user_id = await authenticate(req);
    } catch (e) {
        return res.status(401).json({ error: e.message });
    }

    const { id } = req.query;

    if (req.method === 'DELETE') {
        try {
            await tursoQuery("DELETE FROM kano_items WHERE id = ? AND user_id = ?", [Number(id), user_id]);
            return res.status(200).json({ success: true });
        } catch (e) {
            console.error('DELETE error:', e.message);
            return res.status(500).json({ error: e.message });
        }
    }

    return res.status(405).json({ error: "Method not allowed" });
};
