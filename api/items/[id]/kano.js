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
    return result.response.result;
}

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const { id } = req.query;

    if (req.method === 'PUT') {
        const { f, d, category } = req.body;
        try {
            await tursoQuery(
                "UPDATE kano_items SET kano_f = ?, kano_d = ?, kano_category = ? WHERE id = ?",
                [f, d, category, Number(id)]
            );
            return res.json({ success: true });
        } catch (e) {
            console.error('PUT kano error:', e.message);
            return res.status(500).json({ error: e.message });
        }
    }

    return res.status(405).json({ error: "Method not allowed" });
};
