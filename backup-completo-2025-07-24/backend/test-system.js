#!/usr/bin/env node

const axios = require('axios');
const colors = require('colors');

const BASE_URL = 'http://localhost:3000';

// Configurar axios para não falhar em erros HTTP
axios.defaults.validateStatus = () => true;

let testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(name, passed, message = '') {
  const status = passed ? '✅ PASS'.green : '❌ FAIL'.red;
  console.log(`${status} ${name}`);
  if (message) {
    console.log(`   ${message}`);
  }
  
  testResults.tests.push({ name, passed, message });
  if (passed) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
}

async function testHealthCheck() {
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    const passed = response.status === 200 && response.data.status === 'ok';
    logTest('Health Check', passed, passed ? '' : `Status: ${response.status}`);
    return passed;
  } catch (error) {
    logTest('Health Check', false, `Erro: ${error.message}`);
    return false;
  }
}

async function testUserRegistration() {
  try {
    const userData = {
      name: 'Teste User',
      email: `teste${Date.now()}@example.com`,
      password: 'MinhaSenh@123'
    };
    
    const response = await axios.post(`${BASE_URL}/api/auth/register`, userData);
    const passed = response.status === 201 && response.data.success;
    
    logTest('User Registration', passed, passed ? '' : `Status: ${response.status}, Data: ${JSON.stringify(response.data)}`);
    
    if (passed) {
      return {
        user: userData,
        tokens: response.data.data.tokens
      };
    }
    return null;
  } catch (error) {
    logTest('User Registration', false, `Erro: ${error.message}`);
    return null;
  }
}

async function testUserLogin(userData) {
  try {
    const loginData = {
      email: userData.email,
      password: userData.password
    };
    
    const response = await axios.post(`${BASE_URL}/api/auth/login`, loginData);
    const passed = response.status === 200 && response.data.success;
    
    logTest('User Login', passed, passed ? '' : `Status: ${response.status}, Data: ${JSON.stringify(response.data)}`);
    
    if (passed) {
      return response.data.data.tokens;
    }
    return null;
  } catch (error) {
    logTest('User Login', false, `Erro: ${error.message}`);
    return null;
  }
}

async function testProtectedRoute(token) {
  try {
    const response = await axios.get(`${BASE_URL}/api/users/profile`, {
      headers: {
        'Authorization': `Bearer ${token.accessToken}`
      }
    });
    
    const passed = response.status === 200;
    logTest('Protected Route (Profile)', passed, passed ? '' : `Status: ${response.status}, Data: ${JSON.stringify(response.data)}`);
    return passed;
  } catch (error) {
    logTest('Protected Route (Profile)', false, `Erro: ${error.message}`);
    return false;
  }
}

async function testCreateTransaction(token) {
  try {
    const transactionData = {
      date: new Date().toISOString().split('T')[0],
      description: 'Teste de transação',
      amount: 100.50,
      type: 'ENTRADA',
      category: 'Teste'
    };
    
    const response = await axios.post(`${BASE_URL}/api/transactions`, transactionData, {
      headers: {
        'Authorization': `Bearer ${token.accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const passed = response.status === 201;
    logTest('Create Transaction', passed, passed ? '' : `Status: ${response.status}, Data: ${JSON.stringify(response.data)}`);
    return passed;
  } catch (error) {
    logTest('Create Transaction', false, `Erro: ${error.message}`);
    return false;
  }
}

async function testListTransactions(token) {
  try {
    const response = await axios.get(`${BASE_URL}/api/transactions`, {
      headers: {
        'Authorization': `Bearer ${token.accessToken}`
      }
    });
    
    const passed = response.status === 200;
    logTest('List Transactions', passed, passed ? '' : `Status: ${response.status}, Data: ${JSON.stringify(response.data)}`);
    return passed;
  } catch (error) {
    logTest('List Transactions', false, `Erro: ${error.message}`);
    return false;
  }
}

async function testDataIsolation() {
  try {
    // Criar dois usuários
    const user1Data = {
      name: 'User 1',
      email: `user1${Date.now()}@example.com`,
      password: 'MinhaSenh@123'
    };
    
    const user2Data = {
      name: 'User 2',
      email: `user2${Date.now()}@example.com`,
      password: 'MinhaSenh@123'
    };
    
    // Registrar usuários
    const reg1 = await axios.post(`${BASE_URL}/api/auth/register`, user1Data);
    const reg2 = await axios.post(`${BASE_URL}/api/auth/register`, user2Data);
    
    if (reg1.status !== 201 || reg2.status !== 201) {
      logTest('Data Isolation', false, 'Falha ao registrar usuários para teste');
      return false;
    }
    
    const token1 = reg1.data.data.tokens;
    const token2 = reg2.data.data.tokens;
    
    // Criar transação para usuário 1
    const transaction1 = {
      date: new Date().toISOString().split('T')[0],
      description: 'Transação User 1',
      amount: 100,
      type: 'ENTRADA',
      category: 'Teste'
    };
    
    await axios.post(`${BASE_URL}/api/transactions`, transaction1, {
      headers: {
        'Authorization': `Bearer ${token1.accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Verificar se usuário 2 não vê transações do usuário 1
    const user2Transactions = await axios.get(`${BASE_URL}/api/transactions`, {
      headers: {
        'Authorization': `Bearer ${token2.accessToken}`
      }
    });
    
    const passed = user2Transactions.status === 200 && 
                   (!user2Transactions.data.data || user2Transactions.data.data.length === 0);
    
    logTest('Data Isolation', passed, passed ? 'Usuários não veem dados uns dos outros' : 'Falha no isolamento de dados');
    return passed;
    
  } catch (error) {
    logTest('Data Isolation', false, `Erro: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🧪 Iniciando testes do sistema...'.cyan.bold);
  console.log('');
  
  // Teste 1: Health Check
  const healthOk = await testHealthCheck();
  if (!healthOk) {
    console.log('❌ Servidor não está respondendo. Verifique se está rodando na porta 3000'.red);
    return;
  }
  
  // Teste 2: Registro de usuário
  const registrationResult = await testUserRegistration();
  if (!registrationResult) {
    console.log('❌ Falha no registro. Testes subsequentes podem falhar'.red);
  }
  
  // Teste 3: Login
  let tokens = null;
  if (registrationResult) {
    tokens = await testUserLogin(registrationResult.user);
  }
  
  // Teste 4: Rota protegida
  if (tokens) {
    await testProtectedRoute(tokens);
  }
  
  // Teste 5: Criar transação
  if (tokens) {
    await testCreateTransaction(tokens);
  }
  
  // Teste 6: Listar transações
  if (tokens) {
    await testListTransactions(tokens);
  }
  
  // Teste 7: Isolamento de dados
  await testDataIsolation();
  
  // Resumo
  console.log('');
  console.log('📊 Resumo dos testes:'.cyan.bold);
  console.log(`✅ Passou: ${testResults.passed}`.green);
  console.log(`❌ Falhou: ${testResults.failed}`.red);
  console.log(`📈 Total: ${testResults.passed + testResults.failed}`);
  
  if (testResults.failed === 0) {
    console.log('');
    console.log('🎉 Todos os testes passaram! Sistema funcionando corretamente.'.green.bold);
  } else {
    console.log('');
    console.log('⚠️  Alguns testes falharam. Verifique os logs acima.'.yellow.bold);
  }
}

// Executar testes
runTests().catch(error => {
  console.error('Erro ao executar testes:', error);
  process.exit(1);
});