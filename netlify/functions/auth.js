// Função de autenticação para Netlify
exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const path = event.path.replace('/.netlify/functions/auth', '');
    
    if (event.httpMethod === 'POST' && path === '/login') {
      const body = JSON.parse(event.body || '{}');
      const { email, password } = body;
      
      // Simulação de login (em produção, validar com banco)
      if (email && password) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            token: `mock_token_${Date.now()}`,
            user: { id: '1', email, name: 'Usuário Demo' }
          })
        };
      }
      
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Credenciais inválidas' })
      };
    }
    
    if (event.httpMethod === 'POST' && path === '/register') {
      const body = JSON.parse(event.body || '{}');
      const { email, password, name } = body;
      
      if (email && password && name) {
        return {
          statusCode: 201,
          headers,
          body: JSON.stringify({
            success: true,
            message: 'Usuário criado com sucesso',
            user: { id: '1', email, name }
          })
        };
      }
      
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Dados obrigatórios não fornecidos' })
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Endpoint não encontrado' })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: error.message
      })
    };
  }
};