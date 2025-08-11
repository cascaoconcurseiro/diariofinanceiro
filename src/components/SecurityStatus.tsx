import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Shield, CheckCircle, AlertTriangle } from 'lucide-react';

const SecurityStatus: React.FC = () => {
  const securityFeatures = [
    {
      name: 'Validação de Entrada',
      status: 'active',
      description: 'Todos os valores são sanitizados e validados'
    },
    {
      name: 'Integridade de Dados',
      status: 'active', 
      description: 'Hash de verificação para detectar corrupção'
    },
    {
      name: 'Rate Limiting',
      status: 'active',
      description: 'Limite de transações por dia para prevenir spam'
    },
    {
      name: 'Lógica Financeira Corrigida',
      status: 'active',
      description: 'Cálculo correto: Saldo = Entrada - Saída'
    },
    {
      name: 'Proteção XSS',
      status: 'active',
      description: 'Sanitização de strings e caracteres especiais'
    }
  ];

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-green-600" />
          Status de Segurança
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {securityFeatures.map((feature, index) => (
            <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-green-50">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
              <div>
                <div className="font-medium text-sm">{feature.name}</div>
                <div className="text-xs text-gray-600">{feature.description}</div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-blue-800">Melhorias Implementadas</span>
          </div>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Correção da lógica financeira (diário não afeta saldo)</li>
            <li>• Validação robusta de todos os inputs</li>
            <li>• Proteção contra valores extremos</li>
            <li>• Verificação de integridade dos dados</li>
            <li>• Rate limiting para prevenir abuso</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default SecurityStatus;