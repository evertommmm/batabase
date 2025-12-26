const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const caminhoDb = path.join(__dirname, 'banco_dados', 'nexus_alt.db');

// Criar pasta banco_dados se não existir
if (!fs.existsSync(path.join(__dirname, 'banco_dados'))) {
    fs.mkdirSync(path.join(__dirname, 'banco_dados'));
}

const db = new sqlite3.Database(caminhoDb, (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err);
    } else {
        console.log('✓ Conectado ao banco de dados SQLite');
        inicializarBancoDados();
    }
});

function inicializarBancoDados() {
    db.serialize(() => {
        // Tabela de chaves
        db.run(`
            CREATE TABLE IF NOT EXISTS chaves (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                chave TEXT UNIQUE NOT NULL,
                status TEXT DEFAULT 'ativa',
                criada_em DATETIME DEFAULT CURRENT_TIMESTAMP,
                expira_em DATETIME,
                usos INTEGER DEFAULT 0,
                max_usos INTEGER DEFAULT -1,
                id_usuario TEXT,
                descricao TEXT
            )
        `);

        // Tabela de usuários
        db.run(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                id_usuario TEXT UNIQUE NOT NULL,
                nome_usuario TEXT UNIQUE NOT NULL,
                senha TEXT NOT NULL,
                email TEXT,
                criada_em DATETIME DEFAULT CURRENT_TIMESTAMP,
                ultimo_acesso DATETIME,
                eh_admin BOOLEAN DEFAULT 0
            )
        `);

        // Tabela de registros
        db.run(`
            CREATE TABLE IF NOT EXISTS registros (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                acao TEXT NOT NULL,
                chave TEXT,
                id_usuario TEXT,
                endereco_ip TEXT,
                status TEXT,
                detalhes TEXT,
                criada_em DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('✓ Tabelas do banco de dados criadas/verificadas');
    });
}

// Funções auxiliares
const promiseDb = {
    executar: (sql, params = []) => {
        return new Promise((resolve, reject) => {
            db.run(sql, params, function(err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, changes: this.changes });
            });
        });
    },
    
    obter: (sql, params = []) => {
        return new Promise((resolve, reject) => {
            db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    },
    
    obterTodos: (sql, params = []) => {
        return new Promise((resolve, reject) => {
            db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
};

// Manter compatibilidade com nome antigo
const dbPromise = promiseDb;

module.exports = { db, dbPromise, promiseDb };
