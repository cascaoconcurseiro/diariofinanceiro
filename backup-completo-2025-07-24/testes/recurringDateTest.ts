/**
 * TESTE PARA CORREÇÃO DE DATAS DE LANÇAMENTOS RECORRENTES
 * 
 * Verifica se lançamentos recorrentes são criados apenas para datas futuras
 */

import { calculateNextRecurringDate, isValidRecurringDate, calculateUpcomingRecurringDates } from '../utils/recurringDateCalculator';

export function testRecurringDateCorrection() {
  console.log('🧪 TESTE: Correção de datas de lançamentos recorrentes');
  
  const today = new Date();
  const currentDay = today.getDate();
  
  // Teste 1: Dia que já passou no mês atual
  console.log('\n📅 Teste 1: Dia que já passou');
  const pastDay = Math.max(1, currentDay - 5); // 5 dias atrás
  const nextDateForPastDay = calculateNextRecurringDate({ dayOfMonth: pastDay });
  
  console.log(`Hoje: ${today.toLocaleDateString()}`);
  console.log(`Dia solicitado: ${pastDay}`);
  console.log(`Próxima execução: ${nextDateForPastDay.toLocaleDateString()}`);
  console.log(`É válida (futura): ${isValidRecurringDate(nextDateForPastDay)}`);
  
  // Teste 2: Dia que ainda não chegou no mês atual
  console.log('\n📅 Teste 2: Dia que ainda não chegou');
  const futureDay = Math.min(31, currentDay + 5); // 5 dias à frente
  const nextDateForFutureDay = calculateNextRecurringDate({ dayOfMonth: futureDay });
  
  console.log(`Hoje: ${today.toLocaleDateString()}`);
  console.log(`Dia solicitado: ${futureDay}`);
  console.log(`Próxima execução: ${nextDateForFutureDay.toLocaleDateString()}`);
  console.log(`É válida (futura): ${isValidRecurringDate(nextDateForFutureDay)}`);
  
  // Teste 3: Dia 31 em mês que não tem 31 dias
  console.log('\n📅 Teste 3: Dia 31 (ajuste automático)');
  const nextDateFor31 = calculateNextRecurringDate({ dayOfMonth: 31 });
  
  console.log(`Dia solicitado: 31`);
  console.log(`Próxima execução: ${nextDateFor31.toLocaleDateString()}`);
  console.log(`Dia ajustado: ${nextDateFor31.getDate()}`);
  console.log(`É válida (futura): ${isValidRecurringDate(nextDateFor31)}`);
  
  // Teste 4: Próximas 6 execuções
  console.log('\n📅 Teste 4: Próximas 6 execuções para dia 15');
  const upcomingDates = calculateUpcomingRecurringDates({ dayOfMonth: 15 }, 6);
  
  upcomingDates.forEach((date, index) => {
    console.log(`${index + 1}ª execução: ${date.toLocaleDateString()}`);
  });
  
  // Teste 5: Validação de datas
  console.log('\n📅 Teste 5: Validação de datas');
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  console.log(`Ontem é válida: ${isValidRecurringDate(yesterday)}`);
  console.log(`Hoje é válida: ${isValidRecurringDate(today)}`);
  console.log(`Amanhã é válida: ${isValidRecurringDate(tomorrow)}`);
  
  console.log('\n✅ TESTE CONCLUÍDO: Verificação de datas de lançamentos recorrentes');
  
  return {
    pastDayTest: isValidRecurringDate(nextDateForPastDay),
    futureDayTest: isValidRecurringDate(nextDateForFutureDay),
    day31Test: isValidRecurringDate(nextDateFor31),
    allUpcomingValid: upcomingDates.every(date => isValidRecurringDate(date))
  };
}

// Executar teste automaticamente em desenvolvimento
if (process.env.NODE_ENV === 'development') {
  // Executar após um pequeno delay para não interferir com o carregamento
  setTimeout(() => {
    try {
      const results = testRecurringDateCorrection();
      console.log('\n📊 RESULTADOS DOS TESTES:', results);
      
      if (Object.values(results).every(Boolean)) {
        console.log('✅ TODOS OS TESTES PASSARAM!');
      } else {
        console.log('❌ ALGUNS TESTES FALHARAM!');
      }
    } catch (error) {
      console.error('❌ ERRO NO TESTE:', error);
    }
  }, 2000);
}