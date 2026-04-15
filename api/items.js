// ─── Turso HTTP API helper (no @libsql/client, works in any serverless env) ───
async function tursoQuery(sql, args = []) {
    const baseUrl = (process.env.TURSO_URL || '').replace('libsql://', 'https://');
    const res = await fetch(`${baseUrl}/v2/pipeline`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.TURSO_AUTH_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            requests: [
                {
                    type: 'execute',
                    stmt: {
                        sql,
                        args: args.map(a => {
                            if (a === null || a === undefined) return { type: 'null' };
                            if (typeof a === 'number') return { type: 'integer', value: String(a) };
                            return { type: 'text', value: String(a) };
                        })
                    }
                },
                { type: 'close' }
            ]
        })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(data));

    const result = data.results[0];
    if (result.type === 'error') throw new Error(result.error.message);

    const { cols, rows, last_insert_rowid } = result.response.result;
    const mappedRows = rows.map(row => {
        const obj = {};
        cols.forEach((col, i) => { obj[col.name] = row[i]?.value ?? null; });
        return obj;
    });

    return { rows: mappedRows, lastInsertRowid: last_insert_rowid };
}

// ─── Handler ───
module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method === 'GET') {
        try {
            await tursoQuery(`CREATE TABLE IF NOT EXISTS kano_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                problem TEXT, solution TEXT,
                kano_f TEXT, kano_d TEXT, kano_category TEXT, relations TEXT
            )`);
            const { rows } = await tursoQuery("SELECT * FROM kano_items ORDER BY id ASC");
            return res.json(rows);
        } catch (e) {
            console.error('GET error:', e.message);
            return res.status(500).json({ error: e.message });
        }
    }

    if (req.method === 'POST') {
        const { problem, solution, relations } = req.body;
        try {
            const { lastInsertRowid } = await tursoQuery(
                "INSERT INTO kano_items (problem, solution, kano_f, kano_d, kano_category, relations) VALUES (?, ?, '', '', '', ?)",
                [problem, solution, relations]
            );
            return res.json({ id: lastInsertRowid });
        } catch (e) {
            console.error('POST error:', e.message);
            return res.status(500).json({ error: e.message });
        }
    }

    return res.status(405).json({ error: "Method not allowed" });
};
