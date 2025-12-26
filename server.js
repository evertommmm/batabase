require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const { dbPromise } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Middleware de registro
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`);
    next();
});

// Rota raiz
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function gerarChaveNexus() {
    const partes = [];
    for (let i = 0; i < 4; i++) {
        let parte = '';
        for (let j = 0; j < 4; j++) {
            parte += Math.floor(Math.random() * 16).toString(16).toUpperCase();
        }
        partes.push(parte);
    }
    return `NEXUS-${partes.join('-')}`;
}

// ============================================
// ROTAS DE AUTENTICAÇÃO
// ============================================

// Autenticar com chave
app.post('/api/autenticar', async (req, res) => {
    try {
        const { chave } = req.body;
        const ip = req.ip;

        if (!chave) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Chave não fornecida'
            });
        }

        const chaveBuscada = await dbPromise.obter(
            'SELECT * FROM chaves WHERE chave = ?',
            [chave]
        );

        if (!chaveBuscada) {
            await dbPromise.executar(
                `INSERT INTO registros (acao, chave, status, endereco_ip)
                 VALUES (?, ?, ?, ?)`,
                ['Autenticação', chave, 'erro', ip]
            );

            return res.status(401).json({
                sucesso: false,
                mensagem: 'Chave inválida'
            });
        }

        // Verificar status
        if (chaveBuscada.status === 'banida') {
            return res.status(403).json({
                sucesso: false,
                mensagem: 'Chave banida'
            });
        }

        if (chaveBuscada.status === 'inativa') {
            return res.status(403).json({
                sucesso: false,
                mensagem: 'Chave inativa'
            });
        }

        // Verificar expiração
        if (chaveBuscada.expira_em) {
            const agora = new Date();
            const expiracao = new Date(chaveBuscada.expira_em);
            if (agora > expiracao) {
                return res.status(403).json({
                    sucesso: false,
                    mensagem: 'Chave expirada'
                });
            }
        }

        // Verificar limite de usos
        if (chaveBuscada.max_usos !== -1 && chaveBuscada.usos >= chaveBuscada.max_usos) {
            return res.status(403).json({
                sucesso: false,
                mensagem: 'Limite de usos atingido'
            });
        }

        // Atualizar uso
        await dbPromise.executar(
            'UPDATE chaves SET usos = usos + 1 WHERE chave = ?',
            [chave]
        );

        // Registrar sucesso
        await dbPromise.executar(
            `INSERT INTO registros (acao, chave, status, endereco_ip)
             VALUES (?, ?, ?, ?)`,
            ['Autenticação', chave, 'sucesso', ip]
        );

        res.json({
            sucesso: true,
            mensagem: 'Autenticação bem-sucedida!',
            chave: chave,
            usuario: chaveBuscada.id_usuario
        });

    } catch (error) {
        console.error('Erro na autenticação:', error);
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao autenticar'
        });
    }
});

// ============================================
// ROTAS DE CHAVES
// ============================================

// Criar chave
app.post('/api/chaves/criar', async (req, res) => {
    try {
        const { senha_admin, id_usuario, max_usos, expira_em_dias, descricao } = req.body;

        // Verificar senha
        if (senha_admin !== process.env.ADMIN_PASSWORD) {
            return res.status(401).json({
                sucesso: false,
                mensagem: 'Senha de admin inválida'
            });
        }

        // Gerar chave no formato NEXUS-xxxx-xxxx-xxxx-xxxx
        const chave = gerarChaveNexus();

        // Calcular data de expiração
        let expiraEm = null;
        if (expira_em_dias) {
            const dataExpiracao = new Date();
            dataExpiracao.setDate(dataExpiracao.getDate() + parseInt(expira_em_dias));
            expiraEm = dataExpiracao.toISOString();
        }

        // Inserir no banco
        await dbPromise.executar(
            `INSERT INTO chaves (chave, status, id_usuario, max_usos, expira_em, descricao)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [chave, 'ativa', id_usuario || null, parseInt(max_usos) || -1, expiraEm, descricao || null]
        );

        // Registrar ação
        await dbPromise.executar(
            `INSERT INTO registros (acao, chave, status, detalhes)
             VALUES (?, ?, ?, ?)`,
            ['Chave criada', chave, 'sucesso', `Usuário: ${id_usuario || 'N/A'}`]
        );

        res.json({
            sucesso: true,
            mensagem: 'Chave criada com sucesso!',
            chave: chave,
            formato: 'NEXUS-xxxx-xxxx-xxxx-xxxx'
        });

    } catch (error) {
        console.error('Erro ao criar chave:', error);
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao criar chave'
        });
    }
});

// Listar chaves
app.get('/api/chaves/listar', async (req, res) => {
    try {
        const { senha_admin } = req.query;

        // Verificar senha
        if (senha_admin !== process.env.ADMIN_PASSWORD) {
            return res.status(401).json({
                sucesso: false,
                mensagem: 'Senha de admin inválida'
            });
        }

        const chaves = await dbPromise.obterTodos('SELECT * FROM chaves');

        res.json({
            sucesso: true,
            chaves: chaves
        });

    } catch (error) {
        console.error('Erro ao listar chaves:', error);
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao listar chaves'
        });
    }
});

// Deletar chave
app.post('/api/chaves/deletar', async (req, res) => {
    try {
        const { senha_admin, chave } = req.body;

        // Verificar senha
        if (senha_admin !== process.env.ADMIN_PASSWORD) {
            return res.status(401).json({
                sucesso: false,
                mensagem: 'Senha de admin inválida'
            });
        }

        await dbPromise.executar('DELETE FROM chaves WHERE chave = ?', [chave]);

        // Registrar ação
        await dbPromise.executar(
            `INSERT INTO registros (acao, chave, status)
             VALUES (?, ?, ?)`,
            ['Chave deletada', chave, 'sucesso']
        );

        res.json({
            sucesso: true,
            mensagem: 'Chave deletada com sucesso!'
        });

    } catch (error) {
        console.error('Erro ao deletar chave:', error);
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao deletar chave'
        });
    }
});

// Atualizar status
app.post('/api/chaves/atualizar-status', async (req, res) => {
    try {
        const { senha_admin, chave, novo_status } = req.body;

        // Verificar senha
        if (senha_admin !== process.env.ADMIN_PASSWORD) {
            return res.status(401).json({
                sucesso: false,
                mensagem: 'Senha de admin inválida'
            });
        }

        await dbPromise.executar('UPDATE chaves SET status = ? WHERE chave = ?', [novo_status, chave]);

        // Registrar ação
        await dbPromise.executar(
            `INSERT INTO registros (acao, chave, status, detalhes)
             VALUES (?, ?, ?, ?)`,
            ['Status atualizado', chave, 'sucesso', `Novo status: ${novo_status}`]
        );

        res.json({
            sucesso: true,
            mensagem: 'Status atualizado com sucesso!'
        });

    } catch (error) {
        console.error('Erro ao atualizar status:', error);
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao atualizar status'
        });
    }
});

// ============================================
// ROTAS DE REGISTROS
// ============================================

// Listar registros
app.get('/api/registros', async (req, res) => {
    try {
        const { senha_admin, limite } = req.query;

        // Verificar senha
        if (senha_admin !== process.env.ADMIN_PASSWORD) {
            return res.status(401).json({
                sucesso: false,
                mensagem: 'Senha de admin inválida'
            });
        }

        const registros = await dbPromise.obterTodos(
            `SELECT * FROM registros ORDER BY criada_em DESC LIMIT ?`,
            [parseInt(limite) || 50]
        );

        res.json({
            sucesso: true,
            registros: registros
        });

    } catch (error) {
        console.error('Erro ao listar registros:', error);
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao listar registros'
        });
    }
});

// ============================================
// ROTAS DE STATUS
// ============================================

// Status da API
app.get('/api/status', async (req, res) => {
    res.json({
        sucesso: true,
        mensagem: 'API Nexus Alt rodando!',
        versao: '1.0.0',
        ambiente: process.env.NODE_ENV || 'development',
        formato_chave: 'NEXUS-xxxx-xxxx-xxxx-xxxx'
    });
});

// ============================================
// INICIAR SERVIDOR
// ============================================

app.listen(PORT, () => {
    console.log(`\n╔════════════════════════════════════╗`);
    console.log(`║     NEXUS ALT API - v1.0.0        ║`);
    console.log(`╚════════════════════════════════════╝\n`);
    console.log(`✓ Servidor rodando em: http://localhost:${PORT}`);
    console.log(`✓ Ambiente: ${process.env.NODE_ENV || 'development'}`);
    console.log(`✓ Formato de chaves: NEXUS-xxxx-xxxx-xxxx-xxxx\n`);
});
