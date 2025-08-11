# 👥 Usuários de Teste

## 🔑 Credenciais para Login

### Usuário 1: João Silva
- **Email:** `joao@teste.com`
- **Senha:** `MinhaSenh@123`
- **Perfil:** Funcionário com salário fixo
- **Dados:** Tem transações de salário, supermercado e combustível

### Usuário 2: Maria Santos
- **Email:** `maria@teste.com`
- **Senha:** `OutraSenh@456`
- **Perfil:** Freelancer de design
- **Dados:** Tem transações de freelance e aluguel

### Usuário 3: Pedro Costa
- **Email:** `pedro@teste.com`
- **Senha:** `Pedro@789`
- **Perfil:** Consultor de TI
- **Dados:** Tem transações de consultoria e curso online

## 🧪 Como usar para teste:

1. **Acesse o site:** http://localhost:5173
2. **Faça login** com qualquer um dos usuários acima
3. **Explore as funcionalidades:**
   - Ver transações existentes
   - Adicionar novas transações
   - Ver resumo financeiro
   - Testar isolamento de dados (cada usuário vê apenas seus dados)

## 🔄 Recriar usuários:

Se precisar recriar os usuários de teste:

```bash
cd backend
npm run db:seed
```

## 🎯 Teste de Isolamento:

1. Faça login com João e veja suas transações
2. Faça logout
3. Faça login com Maria e veja que ela só vê suas transações
4. Confirme que os dados estão isolados entre usuários

## 📊 Dados de Exemplo:

### João Silva:
- ✅ Salário: R$ 5.000,00 (Entrada)
- ❌ Supermercado: R$ 250,50 (Saída)
- ❌ Combustível: R$ 120,00 (Saída)
- **Saldo:** R$ 4.629,50

### Maria Santos:
- ✅ Freelance: R$ 1.500,00 (Entrada)
- ❌ Aluguel: R$ 800,00 (Saída)
- **Saldo:** R$ 700,00

### Pedro Costa:
- ✅ Consultoria: R$ 3.000,00 (Entrada)
- ❌ Curso Online: R$ 199,90 (Saída)
- **Saldo:** R$ 2.800,10

## 🚀 Pronto para demonstração!

Estes usuários estão prontos para demonstrar todas as funcionalidades do sistema multiusuário.