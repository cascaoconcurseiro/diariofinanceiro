import React from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Button } from './ui/button';
import { AlertTriangle, Settings, Trash2 } from 'lucide-react';
import { formatCurrency } from '../utils/currencyUtils';

interface RecurringTransactionWarningProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: () => void;
  onNavigateToRecurring: () => void;
  transactionDescription: string;
  transactionAmount: number;
  transactionDate: string;
}

const RecurringTransactionWarning: React.FC<RecurringTransactionWarningProps> = ({
  isOpen,
  onClose,
  onConfirmDelete,
  onNavigateToRecurring,
  transactionDescription,
  transactionAmount,
  transactionDate
}) => {
  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <AlertDialogTitle className="text-lg font-semibold text-gray-900">
                Transação Recorrente
              </AlertDialogTitle>
            </div>
          </div>
        </AlertDialogHeader>
        
        <AlertDialogDescription className="space-y-4">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-orange-700 font-medium">🔄 Lançamento Recorrente</span>
            </div>
            <div className="text-sm text-gray-700">
              <p><strong>Descrição:</strong> {transactionDescription}</p>
              <p><strong>Valor:</strong> {formatCurrency(transactionAmount)}</p>
              <p><strong>Data:</strong> {formatDate(transactionDate)}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center mt-0.5">
                <span className="text-yellow-600 text-sm">⚠️</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Exclusão Pontual</p>
                <p className="text-sm text-gray-600">
                  Esta ação removerá apenas o lançamento desta data específica ({formatDate(transactionDate)}). 
                  A transação recorrente continuará ativa para as próximas datas.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                <Settings className="w-3 h-3 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Exclusão Permanente</p>
                <p className="text-sm text-gray-600">
                  Para excluir permanentemente esta transação recorrente, acesse o gerenciamento 
                  de lançamentos recorrentes.
                </p>
              </div>
            </div>
          </div>
        </AlertDialogDescription>

        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex gap-2 w-full sm:w-auto">
            <AlertDialogCancel asChild>
              <Button variant="outline" className="flex-1 sm:flex-none">
                Cancelar
              </Button>
            </AlertDialogCancel>
            
            <Button
              variant="outline"
              onClick={() => {
                onClose();
                onNavigateToRecurring();
              }}
              className="flex items-center gap-2 flex-1 sm:flex-none"
            >
              <Settings className="w-4 h-4" />
              Gerenciar
            </Button>
          </div>
          
          <AlertDialogAction asChild>
            <Button
              onClick={onConfirmDelete}
              className="bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-2 w-full sm:w-auto"
            >
              <Trash2 className="w-4 h-4" />
              Excluir Apenas Hoje
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default RecurringTransactionWarning;