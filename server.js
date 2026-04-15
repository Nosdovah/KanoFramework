const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createClient } = require('@libsql/client');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Serve static files like index.html

const client = createClient({
    url: process.env.TURSO_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

// Initialize Database
async function initDB() {
    try {
        await client.execute(`
            CREATE TABLE IF NOT EXISTS kano_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                problem TEXT,
                solution TEXT,
                kano_f TEXT,
                kano_d TEXT,
                kano_category TEXT,
                relations TEXT
            )
        `);
        console.log("Database initialized.");
    } catch (e) {
        console.error("Error initializing database:", e);
    }
}

initDB();

// Get all items
app.get('/api/items', async (req, res) => {
    try {
        const result = await client.execute("SELECT * FROM kano_items ORDER BY id ASC");
        res.json(result.rows);
    } catch (e) {
        console.error("Error fetching items:", e);
        res.status(500).json({ error: "Failed to fetch items" });
    }
});

// Add new item
app.post('/api/items', async (req, res) => {
    const { problem, solution, relations } = req.body;
    try {
        const result = await client.execute({
            sql: "INSERT INTO kano_items (problem, solution, kano_f, kano_d, kano_category, relations) VALUES (?, ?, ?, ?, ?, ?) RETURNING id",
            args: [problem, solution, "", "", "", relations]
        });
        res.json({ id: result.rows[0].id });
    } catch (e) {
        console.error("Error adding item:", e);
        res.status(500).json({ error: "Failed to add item" });
    }
});

// Update Kano data
app.put('/api/items/:id/kano', async (req, res) => {
    const { id } = req.params;
    const { f, d, category } = req.body;
    try {
        await client.execute({
            sql: "UPDATE kano_items SET kano_f = ?, kano_d = ?, kano_category = ? WHERE id = ?",
            args: [f, d, category, id]
        });
        res.json({ success: true });
    } catch (e) {
        console.error("Error updating kano data:", e);
        res.status(500).json({ error: "Failed to update kano data" });
    }
});

// Update relations
app.put('/api/items/:id/relations', async (req, res) => {
    const { id } = req.params;
    const { relations } = req.body;
    try {
        await client.execute({
            sql: "UPDATE kano_items SET relations = ? WHERE id = ?",
            args: [relations, id]
        });
        res.json({ success: true });
    } catch (e) {
        console.error("Error updating relations:", e);
        res.status(500).json({ error: "Failed to update relations" });
    }
});

// Delete item
app.delete('/api/items/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await client.execute({
            sql: "DELETE FROM kano_items WHERE id = ?",
            args: [id]
        });
        res.json({ success: true });
    } catch (e) {
        console.error("Error deleting item:", e);
        res.status(500).json({ error: "Failed to delete item" });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
