const { createClient } = require('@libsql/client');

function getClient() {
    const url = (process.env.TURSO_URL || '').replace('libsql://', 'https://');
    return createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
}

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const { id } = req.query;

    if (req.method === 'DELETE') {
        try {
            const client = getClient();
            await client.execute({ sql: "DELETE FROM kano_items WHERE id = ?", args: [id] });
            return res.json({ success: true });
        } catch (e) {
            console.error('DELETE /api/items/[id] error:', e);
            return res.status(500).json({ error: e.message });
        }
    }

    return res.status(405).json({ error: "Method not allowed" });
};
