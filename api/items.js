const { tursoQuery, authenticate } = require('./_utils/db');

const EXAMPLE_ITEMS = [
    {
        id: "ex1",
        problem: "Konten dan interaksi dalam komunitas belum cukup relevan dan aplikatif untuk mendukung pertumbuhan profesional pengguna.",
        solution: "Menyediakan kurasi konten dan program berbasis kebutuhan karier pengguna, misalnya mentoring dan diskusi berbasis bidang profesi.",
        story_context: "Community Platform v1",
        kano_f: "Tidak Suka",
        kano_d: "Tidak Suka",
        kano_category: "M",
        relations: JSON.stringify(["medium", "weak", "strong", "strong", "medium", "medium", "weak"])
    },
    {
        id: "ex2",
        problem: "Pengguna mengalami kesulitan menyaring informasi sehingga membutuhkan waktu yang lama untuk mendapatkan insight yang relevan.",
        solution: "Mengembangkan sistem ringkasan dan personalisasi konten agar pengguna dapat memperoleh informasi penting secara cepat dan efisien.",
        story_context: "Community Platform v1",
        kano_f: "Suka",
        kano_d: "Netral",
        kano_category: "A",
        relations: JSON.stringify(["medium", "weak", "strong", "weak", "strong", "strong", "strong"])
    },
    {
        id: "ex3",
        problem: "Tingkat partisipasi anggota rendah sehingga interaksi dalam komunitas tidak konsisten dan kurang hidup.",
        solution: "Menerapkan mekanisme peningkatan engagement seperti aktivasi diskusi dan peran moderator yang proaktif.",
        story_context: "Community Platform v1",
        kano_f: "Tidak Suka",
        kano_d: "Tidak Suka",
        kano_category: "M",
        relations: JSON.stringify(["strong", "strong", "strong", "strong", "strong", "strong", "strong"])
    },
    {
        id: "ex4",
        problem: "Pengguna merasa ragu untuk berpendapat karena takut tidak mendapat respon atau dinilai negatif.",
        solution: "Menciptakan lingkungan yang suportif dengan mekanisme respon yang lebih inklusif dan cepat.",
        story_context: "Community Platform v1",
        kano_f: "Tidak Suka",
        kano_d: "Tidak Suka",
        kano_category: "M",
        relations: JSON.stringify(["strong", "strong", "strong", "strong", "strong", "strong", "weak"])
    },
    {
        id: "ex5",
        problem: "Pengguna tidak memiliki motivasi yang cukup kuat untuk berpartisipasi aktif dalam komunitas.",
        solution: "Menyediakan insentif dan sistem partisipasi yang mudah serta memberikan manfaat nyata bagi pengguna.",
        story_context: "Community Platform v1",
        kano_f: "Tidak Suka",
        kano_d: "Tidak Suka",
        kano_category: "M",
        relations: JSON.stringify(["weak", "weak", "medium", "strong", "medium", "strong", "weak"])
    }
];

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();

    let user_id;
    let isGuest = false;
    let sharePermission = null;

    try {
        user_id = await authenticate(req);
    } catch (e) {
        // If not authenticated, check for share token
        const { share_token } = req.query;
        if (share_token) {
            try {
                const { rows } = await tursoQuery(
                    "SELECT owner_id, permission FROM shared_projects WHERE share_token = ?",
                    [share_token]
                );
                if (rows.length > 0) {
                    user_id = rows[0].owner_id;
                    sharePermission = rows[0].permission;
                } else {
                    isGuest = true;
                }
            } catch (err) {
                isGuest = true;
            }
        } else if (req.method === 'GET') {
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
        if (isGuest && sharePermission !== 'editor') {
            return res.status(401).json({ error: "Please log in or use an editor link to add data" });
        }
        
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
