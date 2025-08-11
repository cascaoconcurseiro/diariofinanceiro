# Requirements Document - Página de Login Obrigatória

## Introduction

Este documento define os requisitos para implementar uma página de login obrigatória que aparece antes do usuário acessar qualquer funcionalidade do sistema. O objetivo é garantir que apenas usuários autenticados possam usar o Diário Financeiro.

## Requirements

### Requirement 1 - Redirecionamento Automático para Login

**User Story:** Como um usuário não autenticado, eu quero ser automaticamente redirecionado para a página de login quando tentar acessar qualquer página do sistema, para que eu precise fazer login antes de usar as funcionalidades.

#### Acceptance Criteria

1. WHEN um usuário acessa qualquer URL do sistema sem estar logado THEN o sistema SHALL redirecionar automaticamente para /login
2. WHEN um usuário acessa a URL raiz (/) sem estar logado THEN o sistema SHALL mostrar a página de login
3. WHEN um usuário tenta acessar /quick-entry sem estar logado THEN o sistema SHALL redirecionar para /login
4. WHEN um usuário acessa /login diretamente THEN o sistema SHALL mostrar a página de login sem redirecionamento

### Requirement 2 - Verificação de Autenticação

**User Story:** Como desenvolvedor, eu quero que o sistema verifique automaticamente se o usuário está autenticado em todas as rotas, para que apenas usuários logados possam acessar o conteúdo.

#### Acceptance Criteria

1. WHEN o sistema carrega THEN ele SHALL verificar se existe um token válido no localStorage
2. WHEN existe um token válido THEN o sistema SHALL permitir acesso às páginas protegidas
3. WHEN não existe token ou o token é inválido THEN o sistema SHALL redirecionar para /login
4. WHEN o token expira durante o uso THEN o sistema SHALL redirecionar automaticamente para /login

### Requirement 3 - Página de Login com Usuários de Teste

**User Story:** Como um usuário, eu quero ver uma página de login com botões para usuários de teste, para que eu possa facilmente testar o sistema com dados pré-definidos.

#### Acceptance Criteria

1. WHEN um usuário acessa /login THEN o sistema SHALL mostrar um formulário de login com campos email e senha
2. WHEN um usuário está na página de login THEN o sistema SHALL mostrar botões para preencher automaticamente com dados de usuários de teste
3. WHEN um usuário clica em um botão de usuário de teste THEN o sistema SHALL preencher os campos email e senha automaticamente
4. WHEN um usuário faz login com sucesso THEN o sistema SHALL redirecionar para a página principal (/)

### Requirement 4 - Persistência de Sessão

**User Story:** Como um usuário logado, eu quero que minha sessão seja mantida quando eu recarrego a página ou fecho e abro o navegador, para que eu não precise fazer login constantemente.

#### Acceptance Criteria

1. WHEN um usuário faz login com sucesso THEN o sistema SHALL salvar o token no localStorage
2. WHEN um usuário recarrega a página THEN o sistema SHALL verificar o token salvo e manter o usuário logado
3. WHEN um usuário fecha e abre o navegador THEN o sistema SHALL verificar o token e manter a sessão se ainda válida
4. WHEN um usuário faz logout THEN o sistema SHALL remover o token do localStorage e redirecionar para /login

### Requirement 5 - Feedback Visual de Autenticação

**User Story:** Como um usuário, eu quero ver feedback visual claro sobre o status do meu login, para que eu saiba se o processo foi bem-sucedido ou se houve algum erro.

#### Acceptance Criteria

1. WHEN um usuário está fazendo login THEN o sistema SHALL mostrar um indicador de carregamento
2. WHEN o login é bem-sucedido THEN o sistema SHALL mostrar uma mensagem de sucesso antes de redirecionar
3. WHEN o login falha THEN o sistema SHALL mostrar uma mensagem de erro clara
4. WHEN há erro de conexão com o backend THEN o sistema SHALL mostrar uma mensagem informando sobre o problema de conexão

### Requirement 6 - Rotas Protegidas

**User Story:** Como desenvolvedor, eu quero que todas as rotas principais sejam protegidas por autenticação, para que usuários não autenticados não possam acessar funcionalidades restritas.

#### Acceptance Criteria

1. WHEN um usuário não autenticado tenta acessar / THEN o sistema SHALL redirecionar para /login
2. WHEN um usuário não autenticado tenta acessar /quick-entry THEN o sistema SHALL redirecionar para /login
3. WHEN um usuário autenticado acessa qualquer rota protegida THEN o sistema SHALL permitir o acesso
4. WHEN um usuário autenticado acessa /login THEN o sistema SHALL redirecionar para / (página principal)

### Requirement 7 - Usuários de Teste Pré-definidos

**User Story:** Como um testador, eu quero ter acesso fácil a usuários de teste pré-definidos na página de login, para que eu possa rapidamente testar diferentes cenários sem precisar lembrar credenciais.

#### Acceptance Criteria

1. WHEN um usuário está na página de login THEN o sistema SHALL mostrar botões para 3 usuários de teste
2. WHEN um usuário clica no botão "João Silva" THEN o sistema SHALL preencher email: joao@teste.com e senha: MinhaSenh@123
3. WHEN um usuário clica no botão "Maria Santos" THEN o sistema SHALL preencher email: maria@teste.com e senha: OutraSenh@456
4. WHEN um usuário clica no botão "Pedro Costa" THEN o sistema SHALL preencher email: pedro@teste.com e senha: Pedro@789