const express = require('express');
const cors = require('cors');
const path = require('path');
const { createClient } = require('@supabase/supabase-client');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123456';

// ==========================================
// API PARA ROBLOX (SUPABASE)
// ==========================================

app.post('/api/authenticate', async (req, res) => {
    const { key, hwid } = req.body;
    
    const { data, error } = await supabase
        .from('keys')
        .select('*')
        .eq('key', key)
        .single();

    if (error || !data) return res.status(404).json({ success: false, message: "Chave inválida" });
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
        await supabase.from('keys').update({ hwid: hwid }).eq('key', key);
    }

    res.json({ success: true, expira: data.expires_at || "Vitalícia" });
});

// ==========================================
// PAINEL ADMIN (SUPABASE)
// ==========================================

app.get('/api/admin/keys', async (req, res) => {
    if (req.headers['admin-password'] !== ADMIN_PASSWORD) return res.status(401).send();
    const { data } = await supabase.from('keys').select('*').order('created_at', { ascending: false });
    res.json(data);
});

app.post('/api/admin/keys', async (req, res) => {
    const { key, duration, description, password } = req.body;
    if (password !== ADMIN_PASSWORD) return res.status(401).send();

    let expiresAt = null;
    if (duration !== 'lifetime') {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + parseInt(duration));
    }

    const { error } = await supabase.from('keys').insert([{ key, expires_at: expiresAt, description }]);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
});

app.listen(PORT, () => console.log(`Servidor Supabase rodando na porta ${PORT}`));
