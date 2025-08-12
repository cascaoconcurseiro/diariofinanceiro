import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

document.title = 'Diário Financeiro - Sistema Multiusuário';

createRoot(document.getElementById("root")!).render(<App />);