# Plano de Testes - Diário Financeiro

## Introdução

Este documento define os testes sistemáticos para validar todas as funcionalidades, segurança e performance do sistema Diário Financeiro após as correções implementadas.

## Requisitos de Teste

### Requisito 1: Testes de Lógica Financeira

**User Story:** Como usuário, quero que os cálculos financeiros sejam precisos e consistentes, para que eu possa confiar nos dados do sistema.

#### Acceptance Criteria

1. WHEN eu adiciono uma entrada de R$ 1000,00 THEN o saldo deve aumentar em R$ 1000,00
2. WHEN eu adiciono uma saída de R$ 500,00 THEN o saldo deve diminuir em R$ 500,00
3. WHEN eu adiciono um gasto diário de R$ 50,00 THEN o saldo deve diminuir em R$ 50,00
4. WHEN eu modifico uma transação THEN todos os saldos futuros devem ser recalculados automaticamente
5. WHEN eu excluo uma transação THEN o impacto deve ser removido de todos os saldos futuros

### Requisito 2: Testes de Segurança

**User Story:** Como usuário, quero que o sistema seja seguro contra ataques e dados corrompidos, para proteger minhas informações financeiras.

#### Acceptance Criteria

1. WHEN eu insiro valores extremos (R$ 999 milhões) THEN o sistema deve aceitar e processar corretamente
2. WHEN eu insiro valores inválidos (texto, símbolos) THEN o sistema deve sanitizar e rejeitar
3. WHEN eu insiro mais de 100 transações por dia THEN o sistema deve aplicar rate limiting
4. WHEN eu insiro descrições com scripts maliciosos THEN o sistema deve sanitizar o conteúdo
5. WHEN o localStorage está cheio THEN o sistema deve fazer limpeza automática

### Requisito 3: Testes de Performance

**User Story:** Como usuário, quero que o sistema seja rápido e responsivo mesmo com grandes volumes de dados, para ter uma experiência fluida.

#### Acceptance Criteria

1. WHEN eu tenho 1000+ transações THEN o sistema deve permanecer responsivo
2. WHEN eu faço múltiplas edições rápidas THEN não deve haver race conditions
3. WHEN eu navego entre anos/meses THEN a transição deve ser suave
4. WHEN o sistema recalcula saldos THEN deve usar debounce para otimizar
5. WHEN eu carrego a página THEN os dados devem aparecer em menos de 2 segundos

### Requisito 4: Testes de Interface

**User Story:** Como usuário, quero uma interface intuitiva e funcional, para gerenciar minhas finanças facilmente.

#### Acceptance Criteria

1. WHEN eu clico em "Lançamento Rápido" THEN devo ser redirecionado para a página correta
2. WHEN eu edito uma transação THEN o formulário deve pré-preencher com os dados existentes
3. WHEN eu cancelo uma edição THEN o formulário deve limpar e voltar ao estado inicial
4. WHEN eu excluo uma transação THEN deve aparecer confirmação de sucesso
5. WHEN ocorre um erro THEN deve mostrar mensagem clara e específica

### Requisito 5: Testes de Persistência

**User Story:** Como usuário, quero que meus dados sejam salvos automaticamente e recuperados corretamente, para não perder informações.

#### Acceptance Criteria

1. WHEN eu adiciono uma transação THEN ela deve ser salva automaticamente no localStorage
2. WHEN eu recarrego a página THEN todos os dados devem ser restaurados
3. WHEN os dados estão corrompidos THEN o sistema deve recuperar automaticamente
4. WHEN o hash de integridade falha THEN o sistema deve resetar os dados com segurança
5. WHEN eu atinjo o limite de storage THEN deve fazer limpeza automática

### Requisito 6: Testes de Edge Cases

**User Story:** Como usuário, quero que o sistema funcione corretamente em situações extremas e incomuns, para ter confiabilidade total.

#### Acceptance Criteria

1. WHEN é ano bissexto THEN os cálculos de dias devem estar corretos
2. WHEN eu mudo o fuso horário THEN as datas devem permanecer consistentes
3. WHEN eu uso valores negativos THEN o sistema deve processar corretamente
4. WHEN eu navego para anos futuros THEN o sistema deve funcionar normalmente
5. WHEN eu uso caracteres especiais em descrições THEN devem ser tratados adequadamente

### Requisito 7: Testes de Lançamentos Recorrentes

**User Story:** Como usuário, quero que os lançamentos recorrentes funcionem automaticamente e corretamente, para automatizar meu controle financeiro.

#### Acceptance Criteria

1. WHEN eu crio um lançamento recorrente mensal THEN ele deve aparecer automaticamente todo mês
2. WHEN eu edito um lançamento recorrente THEN as alterações devem se aplicar aos próximos lançamentos
3. WHEN eu desativo um lançamento recorrente THEN ele deve parar de ser processado
4. WHEN eu excluo um lançamento recorrente THEN ele deve ser removido de todos os meses futuros
5. WHEN um lançamento recorrente tem duração limitada THEN deve parar automaticamente no prazo

### Requisito 8: Testes de Sincronização

**User Story:** Como usuário, quero que as transações individuais e os dados financeiros estejam sempre sincronizados, para ter consistência total.

#### Acceptance Criteria

1. WHEN eu adiciono uma transação no lançamento rápido THEN ela deve aparecer na tabela principal
2. WHEN eu edito uma transação THEN os saldos devem ser recalculados imediatamente
3. WHEN eu excluo uma transação THEN ela deve sumir da lista e dos cálculos
4. WHEN eu navego entre meses THEN as transações devem aparecer nos meses corretos
5. WHEN eu recarrego a página THEN transações e saldos devem estar sincronizados

### Requisito 9: Testes de Validação de Entrada

**User Story:** Como usuário, quero que o sistema aceite diferentes formatos de entrada numérica, para ter flexibilidade na digitação.

#### Acceptance Criteria

1. WHEN eu digito "1000" THEN deve ser aceito como R$ 1.000,00
2. WHEN eu digito "1000,50" THEN deve ser aceito como R$ 1.000,50
3. WHEN eu digito "1.000,50" THEN deve ser aceito como R$ 1.000,50
4. WHEN eu digito "1000.50" THEN deve ser aceito como R$ 1.000,50
5. WHEN eu digito valores inválidos THEN deve mostrar erro claro

### Requisito 10: Testes de Propagação de Saldos

**User Story:** Como usuário, quero que alterações em qualquer data afetem todos os saldos futuros automaticamente, para manter a consistência temporal.

#### Acceptance Criteria

1. WHEN eu altero uma entrada em janeiro THEN todos os meses do ano devem ser recalculados
2. WHEN eu altero uma transação em 2025 THEN os saldos de 2026, 2027, etc. devem ser atualizados
3. WHEN eu faço múltiplas alterações rápidas THEN o sistema deve processar todas corretamente
4. WHEN eu altero o primeiro dia do mês THEN o saldo deve propagar para o mês inteiro
5. WHEN eu altero o último dia do ano THEN deve propagar para o próximo ano