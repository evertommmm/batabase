# 🚀 Guia de Instalação com PM2

## O que é PM2?

**PM2** é um gerenciador de processos Node.js que permite que sua API rode em background, mesmo com o CMD fechado. Ele também reinicia automaticamente a aplicação se ela cair.

## 📋 Pré-requisitos

- Node.js instalado
- npm instalado
- API Nexus Alt extraída

## 🔧 Instalação

### 1. Instalar PM2 globalmente

```bash
npm install -g pm2
```

### 2. Instalar dependências do projeto

```bash
cd nexus_alt_api
npm install
```

## 🚀 Iniciar a API com PM2

### Opção 1: Usando npm script

```bash
npm run pm2-start
```

### Opção 2: Comando direto

```bash
pm2 start server.js --name nexus-alt-api
```

## 📊 Comandos Úteis

### Ver status da API

```bash
pm2 status
```

### Ver logs em tempo real

```bash
npm run pm2-logs
```

Ou:

```bash
pm2 logs nexus-alt-api
```

### Parar a API

```bash
npm run pm2-stop
```

Ou:

```bash
pm2 stop nexus-alt-api
```

### Reiniciar a API

```bash
npm run pm2-restart
```

Ou:

```bash
pm2 restart nexus-alt-api
```

### Deletar a API do PM2

```bash
pm2 delete nexus-alt-api
```

## 🔄 Iniciar automaticamente ao ligar o PC

### Windows

```bash
pm2 startup windows
pm2 save
```

### Linux/Mac

```bash
pm2 startup
pm2 save
```

## 📝 Arquivo de Configuração (Opcional)

Você pode criar um arquivo `ecosystem.config.js` para configurações avançadas:

```javascript
module.exports = {
  apps: [{
    name: 'nexus-alt-api',
    script: './server.js',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
```

Depois execute:

```bash
pm2 start ecosystem.config.js
```

## 🔑 Formato de Chaves

Todas as chaves criadas seguem o formato:

```
NEXUS-XXXX-XXXX-XXXX-XXXX
```

Exemplo:
```
NEXUS-A1B2-C3D4-E5F6-G7H8
```

## 🌐 Acessar a API

Com PM2 rodando, acesse:

```
http://localhost:3000
```

## ⚠️ Troubleshooting

### API não inicia

1. Verifique se a porta 3000 está disponível
2. Verifique os logs: `pm2 logs nexus-alt-api`
3. Tente reiniciar: `pm2 restart nexus-alt-api`

### Porta já em uso

Mude a porta no arquivo `.env`:

```
PORT=3001
```

Depois reinicie:

```bash
pm2 restart nexus-alt-api
```

### Banco de dados não encontrado

O banco é criado automaticamente na primeira execução. Se houver erro:

1. Delete a pasta `banco_dados`
2. Reinicie a API: `pm2 restart nexus-alt-api`

## 📞 Suporte

Se tiver problemas, verifique:

1. Logs: `pm2 logs nexus-alt-api`
2. Status: `pm2 status`
3. Arquivo `.env` configurado corretamente

**Pronto! Sua API está rodando 24/7! 🎉**
