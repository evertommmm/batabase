# Exemplos de Uso - Nexus Alt API

## 🚀 Iniciando a API

```bash
npm install
npm start
```

A API estará disponível em `http://localhost:3000`

---

## 📋 Exemplos Práticos

### 1️⃣ Criar uma Chave

```bash
curl -X POST http://localhost:3000/api/keys/create \
  -H "Content-Type: application/json" \
  -d '{
    "admin_password": "admin123456",
    "user_id": "player_123",
    "max_uses": 100,
    "expires_in_days": 30,
    "description": "Chave para jogador VIP"
  }'
```

**Resposta:**
```json
{
  "success": true,
  "message": "Chave criada com sucesso",
  "key": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

---

### 2️⃣ Autenticar com uma Chave

```bash
curl -X POST http://localhost:3000/api/authenticate \
  -H "Content-Type: application/json" \
  -d '{"key": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"}'
```

**Resposta (Sucesso):**
```json
{
  "success": true,
  "message": "Autenticação bem-sucedida",
  "key_info": {
    "user_id": "player_123",
    "uses": 1,
    "created_at": "2025-01-01T10:00:00.000Z"
  }
}
```

**Resposta (Erro):**
```json
{
  "success": false,
  "message": "Chave inválida"
}
```

---

### 3️⃣ Listar Todas as Chaves

```bash
curl "http://localhost:3000/api/keys/list?admin_password=admin123456"
```

**Resposta:**
```json
{
  "success": true,
  "total": 3,
  "keys": [
    {
      "id": 1,
      "key": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "status": "active",
      "created_at": "2025-01-01T10:00:00.000Z",
      "expires_at": "2025-01-31T10:00:00.000Z",
      "uses": 5,
      "max_uses": 100,
      "user_id": "player_123",
      "description": "Chave para jogador VIP"
    },
    {
      "id": 2,
      "key": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "status": "active",
      "created_at": "2025-01-02T15:30:00.000Z",
      "expires_at": null,
      "uses": 0,
      "max_uses": -1,
      "user_id": "player_456",
      "description": "Chave ilimitada"
    }
  ]
}
```

---

### 4️⃣ Deletar uma Chave

```bash
curl -X POST http://localhost:3000/api/keys/delete \
  -H "Content-Type: application/json" \
  -d '{
    "admin_password": "admin123456",
    "key": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  }'
```

**Resposta:**
```json
{
  "success": true,
  "message": "Chave deletada com sucesso"
}
```

---

### 5️⃣ Desativar uma Chave

```bash
curl -X POST http://localhost:3000/api/keys/update-status \
  -H "Content-Type: application/json" \
  -d '{
    "admin_password": "admin123456",
    "key": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "status": "inactive"
  }'
```

**Resposta:**
```json
{
  "success": true,
  "message": "Status da chave atualizado"
}
```

---

### 6️⃣ Banir uma Chave

```bash
curl -X POST http://localhost:3000/api/keys/update-status \
  -H "Content-Type: application/json" \
  -d '{
    "admin_password": "admin123456",
    "key": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "status": "banned"
  }'
```

---

### 7️⃣ Obter Logs de Ações

```bash
curl "http://localhost:3000/api/logs?admin_password=admin123456&limit=50"
```

**Resposta:**
```json
{
  "success": true,
  "total": 15,
  "logs": [
    {
      "id": 1,
      "action": "authenticate",
      "key": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "user_id": "player_123",
      "ip_address": "192.168.1.100",
      "status": "success",
      "details": "Autenticação bem-sucedida",
      "created_at": "2025-01-01T10:05:00.000Z"
    },
    {
      "id": 2,
      "action": "create_key",
      "key": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "user_id": "player_456",
      "ip_address": "192.168.1.101",
      "status": "success",
      "details": "Chave criada",
      "created_at": "2025-01-01T11:00:00.000Z"
    }
  ]
}
```

---

### 8️⃣ Verificar Status da API

```bash
curl http://localhost:3000/api/status
```

**Resposta:**
```json
{
  "success": true,
  "message": "API Nexus Alt funcionando",
  "version": "1.0.0",
  "timestamp": "2025-01-01T12:00:00.000Z"
}
```

---

## 🔑 Tipos de Chaves

### Chave com Limite de Usos
```bash
curl -X POST http://localhost:3000/api/keys/create \
  -H "Content-Type: application/json" \
  -d '{
    "admin_password": "admin123456",
    "user_id": "trial_user",
    "max_uses": 10,
    "description": "Chave de trial - 10 usos"
  }'
```

### Chave com Expiração
```bash
curl -X POST http://localhost:3000/api/keys/create \
  -H "Content-Type: application/json" \
  -d '{
    "admin_password": "admin123456",
    "user_id": "temp_user",
    "expires_in_days": 7,
    "description": "Chave válida por 7 dias"
  }'
```

### Chave Ilimitada
```bash
curl -X POST http://localhost:3000/api/keys/create \
  -H "Content-Type: application/json" \
  -d '{
    "admin_password": "admin123456",
    "user_id": "premium_user",
    "max_uses": -1,
    "description": "Chave premium ilimitada"
  }'
```

---

## 🔐 Segurança

⚠️ **IMPORTANTE:**
- Nunca compartilhe a `admin_password`
- Use HTTPS em produção
- Altere a senha padrão no arquivo `.env`
- Guarde as chaves em local seguro

---

## 📱 Integração com Roblox

Para usar com seu script Roblox:

```lua
local API_URL = "http://localhost:3000"

local function authenticateKey(key)
    local success, response = pcall(function()
        return game:HttpGet(API_URL .. "/api/authenticate", {
            Method = "POST",
            Headers = {
                ["Content-Type"] = "application/json"
            },
            Body = game:GetService("HttpService"):JSONEncode({
                key = key
            })
        })
    end)
    
    if success then
        local data = game:GetService("HttpService"):JSONDecode(response)
        if data.success then
            print("✓ Autenticado como: " .. data.key_info.user_id)
            return true
        else
            print("✗ Erro: " .. data.message)
            return false
        end
    end
    return false
end

-- Usar no seu script
if authenticateKey("sua-chave-aqui") then
    -- Carregar o script
end
```

---

**Desenvolvido com ❤️ para Nexus Alt**
