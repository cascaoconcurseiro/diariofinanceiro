#!/usr/bin/env node

/**
 * Script de deploy para Netlify + Neon.tech
 * Prepara o projeto para deploy completo
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Preparando deploy para Netlify + Neon.tech...\n');

try {
  // 1. Verificar se o Neon.tech está configurado
  console.log('1. Verificando configuração do Neon.tech...');
  const envPath = path.join(__dirname, 'backend', '.env');
  if (!fs.existsSync(envPath)) {
    throw new Error('Arquivo .env não encontrado no backend');
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  if (!envContent.includes('neon.tech')) {
    throw new Error('Neon.tech não configurado no .env');
  }
  console.log('✅ Neon.tech configurado');

  // 2. Instalar dependências do frontend
  console.log('2. Instalando dependências do frontend...');
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Dependências do frontend instaladas');

  // 3. Instalar dependências do backend
  console.log('3. Instalando dependências do backend...');
  execSync('npm install', { cwd: 'backend', stdio: 'inherit' });
  console.log('✅ Dependências do backend instaladas');

  // 4. Instalar dependências das functions
  console.log('4. Instalando dependências das Netlify Functions...');
  execSync('npm install', { cwd: 'netlify/functions', stdio: 'inherit' });
  console.log('✅ Dependências das functions instaladas');

  // 5. Gerar Prisma Client
  console.log('5. Gerando Prisma Client...');
  execSync('npx prisma generate', { cwd: 'backend', stdio: 'inherit' });
  console.log('✅ Prisma Client gerado');

  // 6. Testar conexão com Neon.tech
  console.log('6. Testando conexão com Neon.tech...');
  execSync('node testar-neon.js', { cwd: 'backend', stdio: 'inherit' });
  console.log('✅ Conexão com Neon.tech testada');

  // 7. Build do frontend
  console.log('7. Fazendo build do frontend...');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build do frontend concluído');

  console.log('\n🎉 DEPLOY PREPARADO COM SUCESSO!');
  console.log('\n📋 Próximos passos:');
  console.log('1. Faça commit das mudanças: git add . && git commit -m "Deploy: Netlify + Neon.tech"');
  console.log('2. Faça push: git push origin main');
  console.log('3. Configure as variáveis de ambiente no Netlify');
  console.log('4. Deploy automático será executado');

} catch (error) {
  console.log('\n❌ ERRO durante a preparação:');
  console.log('Mensagem:', error.message);
  console.log('\n🔧 Verifique os logs acima e tente novamente');
  process.exit(1);
}