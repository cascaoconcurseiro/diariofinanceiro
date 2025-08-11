
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// SISTEMA DE TESTES OCULTO - Inicialização automática e transparente
import './internal/integration/HiddenTestIntegration'

// Update document title
document.title = 'Diário Financeiro - Coach Inteligente com IA Preditiva';

// TODOS OS TESTES DESABILITADOS - FOCO NA CORREÇÃO
// import './tests/FinalTestValidator'

createRoot(document.getElementById("root")!).render(<App />);
