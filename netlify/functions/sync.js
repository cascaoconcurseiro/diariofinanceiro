// Função de sincronização para Netlify
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
    const path = event.path.replace('/.netlify/functions/sync', '');
    const authHeader = event.headers.authorization;
    
    // Verificação básica de token (em produção, validar JWT)
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Token de autorização necessário' })
      };
    }

    // GET /sync/:key - Carregar dados
    if (event.httpMethod === 'GET' && path.startsWith('/')) {
      const key = path.substring(1);
      
      // Em produção, buscar do banco de dados
      // Por enquanto, retornar dados mock
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          data: [],
          lastModified: new Date().toISOString(),
          deviceId: 'server'
        })
      };
    }
    
    // POST /sync/:key - Salvar dados
    if (event.httpMethod === 'POST' && path.startsWith('/')) {
      const key = path.substring(1);
      const body = JSON.parse(event.body || '{}');
      
      // Em produção, salvar no banco de dados
      console.log(`Saving sync data for key: ${key}`, body);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Dados sincronizados com sucesso'
        })
      };
    }
    
    // GET /sync/devices - Listar dispositivos
    if (event.httpMethod === 'GET' && path === '/devices') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          devices: [
            { deviceId: 'device_1', lastModified: new Date().toISOString() },
            { deviceId: 'device_2', lastModified: new Date().toISOString() }
          ]
        })
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