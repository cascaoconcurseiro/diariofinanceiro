import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { AlertTriangle, Clock, Trash2 } from 'lucide-react';

interface RecurringDeleteConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  transactionName: string;
  onCancel: () => void;
  onDeleteComplete: () => void;
}

const RecurringDeleteConfirmation: React.FC<RecurringDeleteConfirmationProps> = ({
  isOpen,
  onClose,
  transactionName,
  onCancel,
  onDeleteComplete
}) => {
  const [step, setStep] = useState<'choice' | 'security'>('choice');
  const [securityWord, setSecurityWord] = useState('');

  const handleClose = () => {
    setStep('choice');
    setSecurityWord('');
    onClose();
  };

  const handleCancelChoice = () => {
    onCancel();
    handleClose();
  };

  const handleDeleteChoice = () => {
    setStep('security');
  };

  const handleSecurityConfirm = () => {
    if (securityWord === 'EXCLUIR') {
      onDeleteComplete();
      handleClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        {step === 'choice' ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                Gerenciar Recorrência
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="font-medium text-gray-800 mb-2">
                  "{transactionName}"
                </p>
                <p className="text-sm text-gray-600">
                  Como deseja proceder com esta recorrência?
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleCancelChoice}
                  className="w-full justify-start bg-green-500 hover:bg-green-600 text-white"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  <div className="text-left">
                    <div className="font-medium">Cancelar Recorrência</div>
                    <div className="text-xs opacity-90">
                      Mantém lançamentos anteriores, para futuros
                    </div>
                  </div>
                </Button>

                <Button
                  onClick={handleDeleteChoice}
                  variant="outline"
                  className="w-full justify-start border-red-200 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2 text-red-500" />
                  <div className="text-left">
                    <div className="font-medium text-red-700">Excluir Tudo</div>
                    <div className="text-xs text-red-600">
                      Remove recorrência + todos os lançamentos
                    </div>
                  </div>
                </Button>
              </div>

              <div className="bg-yellow-50 p-3 rounded text-xs text-yellow-800">
                💡 <strong>Recomendado:</strong> Cancelar mantém o histórico financeiro correto
              </div>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg text-red-700">
                <AlertTriangle className="w-5 h-5" />
                Confirmação de Segurança
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <p className="font-medium text-red-800 mb-2">
                  ⚠️ EXCLUSÃO PERMANENTE
                </p>
                <p className="text-sm text-red-700 mb-3">
                  Isso removerá PERMANENTEMENTE:
                </p>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• A recorrência "{transactionName}"</li>
                  <li>• TODOS os lançamentos já gerados</li>
                  <li>• Afetará o saldo histórico</li>
                </ul>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Digite "EXCLUIR" para confirmar:
                </label>
                <Input
                  value={securityWord}
                  onChange={(e) => setSecurityWord(e.target.value)}
                  placeholder="Digite EXCLUIR"
                  className="text-center font-mono"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => setStep('choice')}
                  variant="outline"
                  className="flex-1"
                >
                  Voltar
                </Button>
                <Button
                  onClick={handleSecurityConfirm}
                  disabled={securityWord !== 'EXCLUIR'}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  Confirmar Exclusão
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RecurringDeleteConfirmation;