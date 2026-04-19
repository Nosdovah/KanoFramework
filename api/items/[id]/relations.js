const { tursoQuery, authenticate } = require('../../_utils/db');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();

    let user_id;
    let sharePermission = null;

    try {
        user_id = await authenticate(req);
    } catch (e) {
        const { share_token } = req.query;
        if (share_token) {
            const { rows } = await tursoQuery("SELECT owner_id, permission FROM shared_projects WHERE share_token = ?", [share_token]);
            if (rows.length > 0) {
                user_id = rows[0].owner_id;
                sharePermission = rows[0].permission;
                if (sharePermission === 'viewer' || sharePermission === 'commenter') return res.status(403).json({ error: "No permission to edit" });
            } else {
                return res.status(401).json({ error: e.message });
            }
        } else {
            return res.status(401).json({ error: e.message });
        }
    }

    const { id } = req.query;

    if (req.method === 'PUT') {
        const { relations } = req.body;
        try {
            await tursoQuery(
                "UPDATE kano_items SET relations = ? WHERE id = ? AND user_id = ?",
                [relations, Number(id), user_id]
            );
            return res.status(200).json({ success: true });
        } catch (e) {
            console.error('PUT relations error:', e.message);
            return res.status(500).json({ error: e.message });
        }
    }

    return res.status(405).json({ error: "Method not allowed" });
};
