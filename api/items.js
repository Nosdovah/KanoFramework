const { tursoQuery, authenticate } = require('./_utils/db');

const EXAMPLE_ITEMS = [
    {
        id: "ex1",
        problem: "Information Overload: Terlalu banyak pesan atau notifikasi yang tidak relevan sehingga mengganggu fokus.",
        solution: "Sistem AI Filter untuk mengelompokkan notifikasi berdasarkan tingkat relevansi bagi tiap pengguna.",
        story_context: "Professional Network v1",
        kano_f: "Suka",
        kano_d: "Tidak Suka",
        kano_category: "O",
        relations: JSON.stringify(["strong", "medium", "strong", "none", "none", "strong", "none"])
    },
    {
        id: "ex2",
        problem: "Fear of Ghosting: Ketakutan bahwa pertanyaan atau pendapat yang dilempar tidak akan mendapat respon.",
        solution: "Fitur 'Reciprocity Tracker' yang memberikan reward bagi anggota yang sering menanggapi pertanyaan baru.",
        story_context: "Professional Network v1",
        kano_f: "Suka",
        kano_d: "Netral",
        kano_category: "A",
        relations: JSON.stringify(["none", "none", "medium", "strong", "none", "medium", "none"])
    },
    {
        id: "ex3",
        problem: "Entry Barrier: Tidak tahu harus mulai dari mana saat pertama kali bergabung.",
        solution: "Modul Onboarding Interaktif yang memandu user mengisi profil dan merekomendasikan 3 diskusi pertama.",
        story_context: "Professional Network v1",
        kano_f: "Harus Ada",
        kano_d: "Tidak Suka",
        kano_category: "M",
        relations: JSON.stringify(["none", "none", "none", "medium", "none", "strong", "none"])
    }
];

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();

    let user_id;
    let isGuest = false;

    try {
        user_id = await authenticate(req);
    } catch (e) {
        if (req.method === 'GET') {
            isGuest = true;
        } else {
            return res.status(401).json({ error: e.message });
        }
    }

    if (req.method === 'GET') {
        if (isGuest) {
            return res.status(200).json(EXAMPLE_ITEMS);
        }
        try {
            const { rows } = await tursoQuery("SELECT * FROM kano_items WHERE user_id = ? ORDER BY id ASC", [user_id]);
            return res.status(200).json(rows);
        } catch (e) {
            console.error('GET error:', e.message);
            return res.status(500).json({ error: e.message });
        }
    }

    if (req.method === 'POST') {
        if (isGuest) return res.status(401).json({ error: "Please log in to add data" });
        
        const { problem, solution, relations, story_context } = req.body;
        try {
            const { lastInsertRowid } = await tursoQuery(
                "INSERT INTO kano_items (user_id, problem, solution, story_context, kano_f, kano_d, kano_category, relations) VALUES (?, ?, ?, ?, '', '', '', ?)",
                [user_id, problem, solution, story_context || '', relations]
            );
            return res.status(200).json({ id: lastInsertRowid });
        } catch (e) {
            console.error('POST error:', e.message);
            return res.status(500).json({ error: e.message });
        }
    }

    return res.status(405).json({ error: "Method not allowed" });
};
