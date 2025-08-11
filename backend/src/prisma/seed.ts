import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../utils/password';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Criando usuários de teste...');

  // Usuário 1: João Silva
  const joaoPassword = await hashPassword('MinhaSenh@123');
  const joao = await prisma.user.upsert({
    where: { email: 'joao@teste.com' },
    update: {},
    create: {
      name: 'João Silva',
      email: 'joao@teste.com',
      password: joaoPassword,
      isActive: true,
    },
  });

  // Usuário 2: Maria Santos
  const mariaPassword = await hashPassword('OutraSenh@456');
  const maria = await prisma.user.upsert({
    where: { email: 'maria@teste.com' },
    update: {},
    create: {
      name: 'Maria Santos',
      email: 'maria@teste.com',
      password: mariaPassword,
      isActive: true,
    },
  });

  // Usuário 3: Pedro Costa
  const pedroPassword = await hashPassword('Pedro@789');
  const pedro = await prisma.user.upsert({
    where: { email: 'pedro@teste.com' },
    update: {},
    create: {
      name: 'Pedro Costa',
      email: 'pedro@teste.com',
      password: pedroPassword,
      isActive: true,
    },
  });

  // Criar algumas transações de exemplo para João
  await prisma.transaction.createMany({
    data: [
      {
        userId: joao.id,
        date: new Date('2024-01-15'),
        description: 'Salário Janeiro',
        amount: 5000.00,
        type: 'ENTRADA',
        category: 'Trabalho',
        source: 'MANUAL'
      },
      {
        userId: joao.id,
        date: new Date('2024-01-16'),
        description: 'Supermercado',
        amount: 250.50,
        type: 'SAIDA',
        category: 'Alimentação',
        source: 'MANUAL'
      },
      {
        userId: joao.id,
        date: new Date('2024-01-17'),
        description: 'Combustível',
        amount: 120.00,
        type: 'SAIDA',
        category: 'Transporte',
        source: 'MANUAL'
      }
    ]
  });

  // Criar algumas transações de exemplo para Maria
  await prisma.transaction.createMany({
    data: [
      {
        userId: maria.id,
        date: new Date('2024-01-15'),
        description: 'Freelance Design',
        amount: 1500.00,
        type: 'ENTRADA',
        category: 'Trabalho',
        source: 'MANUAL'
      },
      {
        userId: maria.id,
        date: new Date('2024-01-16'),
        description: 'Aluguel',
        amount: 800.00,
        type: 'SAIDA',
        category: 'Moradia',
        source: 'MANUAL'
      }
    ]
  });

  // Criar algumas transações de exemplo para Pedro
  await prisma.transaction.createMany({
    data: [
      {
        userId: pedro.id,
        date: new Date('2024-01-15'),
        description: 'Consultoria TI',
        amount: 3000.00,
        type: 'ENTRADA',
        category: 'Trabalho',
        source: 'MANUAL'
      },
      {
        userId: pedro.id,
        date: new Date('2024-01-16'),
        description: 'Curso Online',
        amount: 199.90,
        type: 'SAIDA',
        category: 'Educação',
        source: 'MANUAL'
      }
    ]
  });

  console.log('✅ Usuários de teste criados:');
  console.log(`👤 João Silva: ${joao.email}`);
  console.log(`👤 Maria Santos: ${maria.email}`);
  console.log(`👤 Pedro Costa: ${pedro.email}`);
  console.log('');
  console.log('🔑 Senhas:');
  console.log('João: MinhaSenh@123');
  console.log('Maria: OutraSenh@456');
  console.log('Pedro: Pedro@789');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });