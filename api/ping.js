module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');

    const tursoUrl = process.env.TURSO_URL || 'NOT SET';
    const hasToken = !!process.env.TURSO_AUTH_TOKEN;

    // Try a live Turso HTTP request
    try {
        const baseUrl = tursoUrl.replace('libsql://', 'https://');
        const r = await fetch(`${baseUrl}/v2/pipeline`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.TURSO_AUTH_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                requests: [
                    { type: 'execute', stmt: { sql: 'SELECT 1', args: [] } },
                    { type: 'close' }
                ]
            })
        });
        const data = await r.json();
        return res.json({ ok: true, tursoUrl, hasToken, status: r.status, data });
    } catch (e) {
        return res.json({ ok: false, tursoUrl, hasToken, error: e.message });
    }
};
