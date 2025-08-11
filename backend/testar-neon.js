#!/usr/bin/env node

/**
 * Script simples para testar conexão com Neon.tech
 */

const { PrismaClient } = require('@prisma/client');

async function testarConexao() {
  console.log('🔍 Testando conexão com Neon.tech...\n');
  
  const prisma = new PrismaClient();
  
  try {
    // Testar conexão básica
    console.log('1. Conectando ao banco...');
    await prisma.$connect();
    console.log('✅ Conexão estabelecida!');
    
    // Testar query simples
    console.log('2. Testando query...');
    const result = await prisma.$queryRaw`SELECT NOW() as server_time, version() as version`;
    console.log('✅ Query executada com sucesso!');
    console.log('📊 Servidor:', result[0].server_time);
    console.log('🗄️  Versão:', result[0].version.substring(0, 50) + '...');
    
    // Verificar se é Neon
    const isNeon = process.env.DATABASE_URL?.includes('neon.tech') || false;
    console.log('🌐 Usando Neon.tech:', isNeon ? '✅ SIM' : '❌ NÃO');
    
    console.log('\n🎉 SUCESSO! Neon.tech configurado corretamente!');
    
  } catch (error) {
    console.log('\n❌ ERRO na conexão:');
    console.log('Mensagem:', error.message);
    console.log('\n🔧 Possíveis soluções:');
    console.log('1. Verifique se a string de conexão está correta');
    console.log('2. Confirme se o projeto Neon.tech está ativo');
    console.log('3. Teste sua conexão com a internet');
    
  } finally {
    await prisma.$disconnect();
  }
}

testarConexao();