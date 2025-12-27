const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Configuração do Banco de Dados PostgreSQL (Railway)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123456';

// ==========================================
// API PARA ROBLOX (RAILWAY POSTGRES)
// ==========================================

app.post('/api/authenticate', async (req, res) => {
    const { key, hwid } = req.body;
    
    try {
        const result = await pool.query('SELECT * FROM keys WHERE key = $1', [key]);
        const data = result.rows[0];

        if (!data) return res.status(404).json({ success: false, message: "Chave inválida" });
        if (data.status !== 'active') return res.status(403).json({ success: false, message: "Chave inativa" });

        // Verificar Expiração
        if (data.expires_at && new Date(data.expires_at) < new Date()) {
            return res.status(403).json({ success: false, message: "Chave expirada" });
        }

        // Verificar HWID
        if (data.hwid && data.hwid !== hwid) {
            return res.status(403).json({ success: false, message: "HWID incorreto" });
        }

        // Atualizar HWID se necessário
        if (!data.hwid) {
            await pool.query('UPDATE keys SET hwid = $1, uses = uses + 1 WHERE key = $2', [hwid, key]);
        } else {
            await pool.query('UPDATE keys SET uses = uses + 1 WHERE key = $1', [key]);
        }

        res.json({ success: true, expira: data.expires_at || "Vitalícia" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Erro no servidor" });
    }
});

// ==========================================
// PAINEL ADMIN (RAILWAY POSTGRES)
// ==========================================

app.get('/api/admin/keys', async (req, res) => {
    if (req.headers['admin-password'] !== ADMIN_PASSWORD) return res.status(401).send();
    try {
        const result = await pool.query('SELECT * FROM keys ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/admin/keys', async (req, res) => {
    const { key, duration, description, password } = req.body;
    if (password !== ADMIN_PASSWORD) return res.status(401).send();

    let expiresAt = null;
    if (duration !== 'lifetime') {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + parseInt(duration));
    }

    try {
        await pool.query('INSERT INTO keys (key, expires_at, description) VALUES ($1, $2, $3)', [key, expiresAt, description]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Chave já existe ou erro no banco" });
    }
});

app.delete('/api/admin/keys/:key', async (req, res) => {
    if (req.headers['admin-password'] !== ADMIN_PASSWORD) return res.status(401).send();
    try {
        await pool.query('DELETE FROM keys WHERE key = $1', [req.params.key]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => console.log(`Servidor Railway rodando na porta ${PORT}`));
