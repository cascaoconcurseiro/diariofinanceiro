# API de Gerenciamento de Usuários

Esta documentação descreve os endpoints da API para gerenciamento de usuários do sistema financeiro.

## Endpoints Disponíveis

### 1. Obter Perfil do Usuário
```http
GET /api/users/profile
Authorization: Bearer {token}
```

**Resposta:**
```json
{
  "id": "user_id",
  "name": "Nome do Usuário",
  "email": "email@exemplo.com",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "lastLoginAt": "2024-01-01T00:00:00.000Z",
  "isActive": true
}
```

### 2. Atualizar Perfil
```http
PUT /api/users/profile
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Novo Nome",
  "email": "novoemail@exemplo.com"
}
```

**Validações:**
- Nome: 2-100 caracteres, apenas letras e espaços
- Email: formato válido, máximo 255 caracteres

### 3. Alterar Senha
```http
PUT /api/users/password
Authorization: Bearer {token}
Content-Type: application/json

{
  "currentPassword": "senhaAtual",
  "newPassword": "novaSenha123"
}
```

**Validações:**
- Senha atual deve estar correta
- Nova senha deve ter pelo menos 8 caracteres
- Nova senha deve ser diferente da atual

### 4. Solicitar Recuperação de Senha
```http
POST /api/users/password/reset-request
Content-Type: application/json

{
  "email": "email@exemplo.com"
}
```

**Nota:** Por segurança, sempre retorna sucesso, mesmo se o email não existir.

### 5. Redefinir Senha com Token
```http
POST /api/users/password/reset
Content-Type: application/json

{
  "token": "token_de_recuperacao",
  "newPassword": "novaSenha123"
}
```

### 6. Obter Estatísticas do Usuário
```http
GET /api/users/stats
Authorization: Bearer {token}
```

**Resposta:**
```json
{
  "totalTransactions": 150,
  "totalRecurringTransactions": 5,
  "firstTransactionDate": "2024-01-01T00:00:00.000Z",
  "lastTransactionDate": "2024-12-01T00:00:00.000Z",
  "accountAge": 365
}
```

### 7. Logout
```http
POST /api/users/logout
Authorization: Bearer {token}
```

Invalida apenas o token atual.

### 8. Logout de Todos os Dispositivos
```http
POST /api/users/logout-all
Authorization: Bearer {token}
```

Invalida todas as sessões do usuário.

### 9. Excluir Conta
```http
DELETE /api/users/account
Authorization: Bearer {token}
Content-Type: application/json

{
  "password": "senhaAtual"
}
```

**⚠️ ATENÇÃO:** Esta operação é irreversível e remove todos os dados do usuário.

## Rate Limiting

### Operações Sensíveis
- **Limite:** 5 tentativas por 15 minutos
- **Aplicado em:** Recuperação de senha, exclusão de conta, logout de todos os dispositivos

### Alteração de Senha
- **Limite:** 3 tentativas por 1 hora
- **Aplicado em:** Mudança de senha

## Códigos de Erro

| Código | Descrição |
|--------|-----------|
| 400 | Dados inválidos |
| 401 | Não autenticado |
| 403 | Acesso negado |
| 409 | Conflito (ex: email já em uso) |
| 429 | Rate limit excedido |
| 500 | Erro interno do servidor |

## Segurança

### Autenticação
- Todos os endpoints (exceto recuperação de senha) requerem token JWT válido
- Tokens são verificados contra blacklist para logout
- Sessões são validadas no Redis

### Validação de Dados
- Sanitização de entrada
- Validação de tipos e formatos
- Prevenção contra ataques de injeção

### Logs de Segurança
- Tentativas de acesso não autorizado
- Alterações de dados sensíveis
- Uso de tokens inválidos

## Exemplos de Uso

### Fluxo Completo de Atualização de Perfil
```javascript
// 1. Obter perfil atual
const profile = await fetch('/api/users/profile', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// 2. Atualizar dados
const updated = await fetch('/api/users/profile', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Novo Nome'
  })
});
```

### Fluxo de Recuperação de Senha
```javascript
// 1. Solicitar recuperação
await fetch('/api/users/password/reset-request', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'user@exemplo.com' })
});

// 2. Usar token recebido por email (em desenvolvimento, veja os logs)
await fetch('/api/users/password/reset', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    token: 'token_do_email',
    newPassword: 'novaSenha123'
  })
});
```

## Desenvolvimento

### Testando a API
Use o arquivo `test-api.http` para testar os endpoints com ferramentas como REST Client do VS Code.

### Logs
Em desenvolvimento, tokens de recuperação de senha são exibidos no console para facilitar testes.

### Banco de Dados
Execute as migrações do Prisma para adicionar os campos necessários:
```bash
npx prisma migrate dev
```