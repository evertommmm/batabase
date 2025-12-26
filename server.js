const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./database');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000; // Porta padrão do Render
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123456';

// ============================================
// CONFIGURAÇÃO DE CORS (CRÍTICO PARA ROBLOX)
// ============================================
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'admin-password']
}));

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// ============================================
// SCRIPT DE MIGRAÇÃO AUTOMÁTICA (HWID)
// ============================================
db.serialize(() => {
    db.run("ALTER TABLE keys ADD COLUMN hwid TEXT", (err) => {
        if (err) {
            console.log("[NEXUS] Coluna HWID já existe ou banco é novo.");
        } else {
            console.log("[NEXUS] SUCESSO: Coluna HWID adicionada ao banco de dados!");
        }
    });
});

// ============================================
// MIDDLEWARE DE AUTENTICAÇÃO ADMIN
// ============================================
const authAdmin = (req, res, next) => {
    const password = req.headers['admin-password'] || req.query.admin_password;
    if (password === ADMIN_PASSWORD) {
        next();
    } else {
        res.status(401).json({ success: false, message: 'Acesso negado: Senha incorreta' });
    }
};

// ============================================
// ENDPOINTS DA API (CLIENTE ROBLOX)
// ============================================

// Autenticar Chave com HWID
app.post(['/api/authenticate', '/api/autenticar'], (req, res) => {
    const { key, hwid } = req.body;
    
    console.log(`[NEXUS] Tentativa de login: Key=${key} | HWID=${hwid}`);

    if (!key) return res.status(400).json({ success: false, message: 'Chave não fornecida' });

    db.get('SELECT * FROM keys WHERE key = ?', [key], (err, row) => {
        if (err) {
            console.error("[NEXUS DB ERROR]", err);
            return res.status(500).json({ success: false, message: 'Erro no banco de dados' });
        }
        
        if (!row) {
            console.log(`[NEXUS] Chave inválida: ${key}`);
            return res.status(404).json({ success: false, message: 'Chave inválida' });
        }

        if (row.status !== 'active') {
            return res.status(403).json({ success: false, message: 'Chave banida ou inativa' });
        }

        // Verificar Expiração
        if (row.expires_at && new Date(row.expires_at) < new Date()) {
            return res.status(403).json({ success: false, message: 'Chave expirada' });
        }

        // Verificar HWID
        if (row.hwid && hwid && row.hwid !== hwid) {
            console.log(`[NEXUS] HWID Incorreto para a chave ${key}`);
            return res.status(403).json({ success: false, message: 'HWID não condiz com a chave' });
        }

        // Atualizar HWID se for o primeiro uso
        if (!row.hwid && hwid) {
            db.run('UPDATE keys SET hwid = ?, uses = uses + 1 WHERE key = ?', [hwid, key]);
        } else {
            db.run('UPDATE keys SET uses = uses + 1 WHERE key = ?', [key]);
        }

        // Registrar Log
        db.run('INSERT INTO logs (action, key, status, details) VALUES (?, ?, ?, ?)', 
            ['auth', key, 'success', `Autenticado por ${hwid || 'N/A'}`]);

        console.log(`[NEXUS] Login bem-sucedido: ${key}`);
        res.json({
            success: true,
            message: 'Autenticado com sucesso',
            expira: row.expires_at || 'Vitalícia'
        });
    });
});

// ============================================
// ENDPOINTS DO PAINEL ADMIN
// ============================================

app.get('/api/admin/keys', authAdmin, (req, res) => {
    db.all('SELECT * FROM keys ORDER BY created_at DESC', [], (err, rows) => {
        res.json({ success: true, keys: rows });
    });
});

app.post('/api/admin/keys/create', authAdmin, (req, res) => {
    const { days, description } = req.body;
    const key = 'NEXUS-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    const expires_at = days ? new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString() : null;

    db.run('INSERT INTO keys (key, status, expires_at, description) VALUES (?, ?, ?, ?)',
        [key, 'active', expires_at, description || 'Gerada via Painel'], (err) => {
            if (err) return res.status(500).json({ success: false, message: err.message });
            res.json({ success: true, key });
        });
});

app.delete('/api/admin/keys/:key', authAdmin, (req, res) => {
    db.run('DELETE FROM keys WHERE key = ?', [req.params.key], (err) => {
        res.json({ success: true });
    });
});

app.get('/api/admin/stats', authAdmin, (req, res) => {
    db.get('SELECT COUNT(*) as total, SUM(uses) as total_uses FROM keys', (err, row) => {
        res.json({ success: true, stats: row || { total: 0, total_uses: 0 } });
    });
});

app.listen(PORT, () => {
    console.log(`[NEXUS PRO] Painel rodando na porta ${PORT}`);
});
