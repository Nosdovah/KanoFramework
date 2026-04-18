const crypto = require('crypto');

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

async function authenticate(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('Unauthorized: No token provided');
    }
    const token = authHeader.split(' ')[1];
    const { rows } = await tursoQuery("SELECT id FROM users WHERE token = ?", [token]);
    if (rows.length === 0) {
        throw new Error('Unauthorized: Invalid token');
    }
    return rows[0].id;
}

// Ensure the tables exists
async function initDb() {
    try {
        await tursoQuery(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password_hash TEXT,
            token TEXT
        )`);
        await tursoQuery(`CREATE TABLE IF NOT EXISTS kano_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            problem TEXT, solution TEXT,
            kano_f TEXT, kano_d TEXT, kano_category TEXT, relations TEXT
        )`);
        
        // Add user_id column if it doesn't exist (for existing tables)
        try {
            await tursoQuery(`ALTER TABLE kano_items ADD COLUMN user_id INTEGER`);
        } catch (e) {
            // Ignore error if column already exists
        }
    } catch (e) {
        console.error("Failed to initialize DB:", e.message);
    }
}

// Call initDb asynchronously to ensure tables are ready
initDb();

module.exports = {
    tursoQuery,
    authenticate
};
