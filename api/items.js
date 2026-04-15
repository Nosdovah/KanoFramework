const { createClient } = require('@libsql/client');

function getClient() {
    // Use https:// instead of libsql:// to force HTTP mode — required for Vercel serverless
    const url = (process.env.TURSO_URL || '').replace('libsql://', 'https://');
    return createClient({
        url,
        authToken: process.env.TURSO_AUTH_TOKEN,
    });
}

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const client = getClient();

    if (req.method === 'GET') {
        try {
            await client.execute(`
                CREATE TABLE IF NOT EXISTS kano_items (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    problem TEXT, solution TEXT,
                    kano_f TEXT, kano_d TEXT, kano_category TEXT, relations TEXT
                )
            `);
            const result = await client.execute("SELECT * FROM kano_items ORDER BY id ASC");
            return res.json(result.rows);
        } catch (e) {
            console.error('GET /api/items error:', e);
            return res.status(500).json({ error: e.message });
        }
    }

    if (req.method === 'POST') {
        const { problem, solution, relations } = req.body;
        try {
            const result = await client.execute({
                sql: "INSERT INTO kano_items (problem, solution, kano_f, kano_d, kano_category, relations) VALUES (?, ?, ?, ?, ?, ?) RETURNING id",
                args: [problem, solution, "", "", "", relations]
            });
            return res.json({ id: result.rows[0].id });
        } catch (e) {
            console.error('POST /api/items error:', e);
            return res.status(500).json({ error: e.message });
        }
    }

    return res.status(405).json({ error: "Method not allowed" });
};
