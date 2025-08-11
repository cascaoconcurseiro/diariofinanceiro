#!/usr/bin/env node

/**
 * Script de configuração para Neon.tech
 * Configura automaticamente a conexão com o banco PostgreSQL
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Configurando Neon.tech Database...\n');

// Verificar se a string de conexão foi fornecida
const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('❌ Erro: String de conexão não fornecida');
  console.log('\n📋 Como usar:');
  console.log('node setup-neon.js "postgresql://username:password@ep-xxx.neon.tech/neondb?sslmode=require"');
  console.log('\n💡 Obtenha sua string de conexão em: https://console.neon.tech');
  process.exit(1);
}

const connectionString = args[0];

// Validar formato da string de conexão
if (!connectionString.startsWith('postgresql://') || !connectionString.includes('neon.tech')) {
  console.log('❌ Erro: String de conexão inválida');
  console.log('✅ Formato esperado: postgresql://username:password@ep-xxx.neon.tech/neondb?sslmode=require');
  process.exit(1);
}

try {
  // Atualizar arquivo .env.local
  const envPath = path.join(__dirname, '.env.local');
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Substituir a DATABASE_URL
  envContent = envContent.replace(
    /DATABASE_URL="[^"]*"/,
    `DATABASE_URL="${connectionString}"`
  );
  
  // Adicionar DIRECT_URL se não existir
  if (!envContent.includes('DIRECT_URL=')) {
    envContent = envContent.replace(
      `DATABASE_URL="${connectionString}"`,
      `DATABASE_URL="${connectionString}"\nDIRECT_URL="${connectionString}"`
    );
  } else {
    envContent = envContent.replace(
      /DIRECT_URL="[^"]*"/,
      `DIRECT_URL="${connectionString}"`
    );
  }
  
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Arquivo .env.local atualizado');

  // Testar conexão
  console.log('🔍 Testando conexão com Neon.tech...');
  
  // Gerar cliente Prisma
  console.log('📦 Gerando cliente Prisma...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  // Executar migrações
  console.log('🗄️  Executando migrações...');
  execSync('npx prisma db push', { stdio: 'inherit' });
  
  console.log('\n🎉 Configuração concluída com sucesso!');
  console.log('\n📋 Próximos passos:');
  console.log('1. Execute: npm run dev');
  console.log('2. Teste a conexão acessando a API');
  console.log('3. Execute o seed se necessário: npx prisma db seed');
  
} catch (error) {
  console.log('\n❌ Erro durante a configuração:');
  console.log(error.message);
  console.log('\n🔧 Possíveis soluções:');
  console.log('1. Verifique se a string de conexão está correta');
  console.log('2. Confirme se o projeto Neon.tech está ativo');
  console.log('3. Verifique sua conexão com a internet');
  process.exit(1);
}