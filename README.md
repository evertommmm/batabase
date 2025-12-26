# Nexus Alt API - Sistema de Autenticação KeyAuth

API completa de autenticação com Node.js e SQLite para gerenciar chaves de acesso.

## 🚀 Instalação

### Pré-requisitos
- Node.js 14+
- npm ou yarn

### Passos

1. **Clone ou copie os arquivos**
```bash
cd nexus_alt_api
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure o arquivo .env**
```bash
# Edite o arquivo .env com suas configurações
PORT=3000
NODE_ENV=development
API_SECRET=nexus_alt_secret_key_2025
ADMIN_PASSWORD=admin123456
```

4. **Inicie o servidor**
```bash
npm start
```

Para desenvolvimento com auto-reload:
```bash
npm run dev
```

## 📚 Endpoints da API

### 1. Autenticação

**POST** `/api/authenticate`

Verifica se uma chave é válida.

**Request:**
```json
{
  "key": "sua-chave-aqui"
}
```

**Response (Sucesso):**
```json
{
  "success": true,
  "message": "Autenticação bem-sucedida",
  "key_info": {
    "user_id": "user123",
    "uses": 1,
    "created_at": "2025-01-01T00:00:00.000Z"
  }
}
```

**Response (Erro):**
```json
{
  "success": false,
  "message": "Chave inválida"
}
```

---

### 2. Criar Chave

**POST** `/api/keys/create`

Cria uma nova chave de acesso.

**Request:**
```json
{
  "admin_password": "admin123456",
  "user_id": "user123",
  "max_uses": 100,
  "expires_in_days": 30,
  "description": "Chave para teste"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Chave criada com sucesso",
  "key": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

### 3. Listar Chaves

**GET** `/api/keys/list?admin_password=admin123456`

Lista todas as chaves cadastradas.

**Response:**
```json
{
  "success": true,
  "total": 5,
  "keys": [
    {
      "id": 1,
      "key": "550e8400-e29b-41d4-a716-446655440000",
      "status": "active",
      "created_at": "2025-01-01T00:00:00.000Z",
      "expires_at": null,
      "uses": 10,
      "max_uses": 100,
      "user_id": "user123",
      "description": "Chave para teste"
    }
  ]
}
```

---

### 4. Deletar Chave

**POST** `/api/keys/delete`

Deleta uma chave específica.

**Request:**
```json
{
  "admin_password": "admin123456",
  "key": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Chave deletada com sucesso"
}
```

---

### 5. Atualizar Status da Chave

**POST** `/api/keys/update-status`

Altera o status de uma chave (active, inactive, banned).

**Request:**
```json
{
  "admin_password": "admin123456",
  "key": "550e8400-e29b-41d4-a716-446655440000",
  "status": "inactive"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Status da chave atualizado"
}
```

---

### 6. Obter Logs

**GET** `/api/logs?admin_password=admin123456&limit=100`

Obtém os logs de ações da API.

**Response:**
```json
{
  "success": true,
  "total": 50,
  "logs": [
    {
      "id": 1,
      "action": "authenticate",
      "key": "550e8400-e29b-41d4-a716-446655440000",
      "user_id": "user123",
      "ip_address": "192.168.1.1",
      "status": "success",
      "details": "Autenticação bem-sucedida",
      "created_at": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### 7. Status da API

**GET** `/api/status`

Verifica se a API está funcionando.

**Response:**
```json
{
  "success": true,
  "message": "API Nexus Alt funcionando",
  "version": "1.0.0",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

## 🔐 Segurança

- Todas as operações de admin requerem a senha definida em `.env`
- As chaves são armazenadas em texto plano (considere usar hash em produção)
- Todos os acessos são registrados em logs
- CORS habilitado para requisições de diferentes origens

## 📊 Estrutura do Banco de Dados

### Tabela: keys
- `id` - ID único
- `key` - Chave de acesso (UUID)
- `status` - Status (active, inactive, banned)
- `created_at` - Data de criação
- `expires_at` - Data de expiração (opcional)
- `uses` - Número de usos
- `max_uses` - Máximo de usos (-1 = ilimitado)
- `user_id` - ID do usuário
- `description` - Descrição da chave

### Tabela: logs
- `id` - ID único
- `action` - Ação realizada
- `key` - Chave afetada
- `user_id` - ID do usuário
- `ip_address` - IP da requisição
- `status` - Status (success, failed)
- `details` - Detalhes da ação
- `created_at` - Data/hora

## 🛠️ Exemplos de Uso

### Criar uma chave com curl
```bash
curl -X POST http://localhost:3000/api/keys/create \
  -H "Content-Type: application/json" \
  -d '{
    "admin_password": "admin123456",
    "user_id": "user123",
    "max_uses": 50,
    "expires_in_days": 7,
    "description": "Chave de teste"
  }'
```

### Autenticar com curl
```bash
curl -X POST http://localhost:3000/api/authenticate \
  -H "Content-Type: application/json" \
  -d '{"key": "sua-chave-aqui"}'
```

### Listar chaves com curl
```bash
curl "http://localhost:3000/api/keys/list?admin_password=admin123456"
```

## 📝 Licença

MIT

## 👨‍💻 Autor

Nexus Developer

---

**Desenvolvido com ❤️ para Nexus Alt**
