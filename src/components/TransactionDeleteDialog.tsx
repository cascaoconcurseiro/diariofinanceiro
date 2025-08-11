import React from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Button } from './ui/button';
import { Trash2, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../utils/currencyUtils';

interface TransactionDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  transactionDescription: string;
  transactionAmount: number;
  transactionType: 'entrada' | 'saida' | 'diario';
  transactionDate: string;
}

const TransactionDeleteDialog: React.FC<TransactionDeleteDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  transactionDescription,
  transactionAmount,
  transactionType,
  transactionDate
}) => {
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'entrada': return 'Entrada';
      case 'saida': return 'Saída';
      case 'diario': return 'Diário';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'entrada': return 'text-green-600 bg-green-50 border-green-200';
      case 'saida': return 'text-red-600 bg-red-50 border-red-200';
      case 'diario': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <AlertDialogTitle className="text-lg font-semibold text-gray-900">
                Confirmar Exclusão
              </AlertDialogTitle>
            </div>
          </div>
        </AlertDialogHeader>
        
        <AlertDialogDescription className="space-y-4">
          <p className="text-gray-600">
            Tem certeza que deseja excluir este lançamento? Esta ação não pode ser desfeita.
          </p>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getTypeColor(transactionType)}`}>
                {getTypeLabel(transactionType)}
              </span>
              <span className="font-semibold text-lg">{formatCurrency(transactionAmount)}</span>
            </div>
            <div className="text-sm text-gray-700 space-y-1">
              {transactionDescription && (
                <p><strong>Descrição:</strong> {transactionDescription}</p>
              )}
              <p><strong>Data:</strong> {formatDate(transactionDate)}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex-shrink-0 w-5 h-5 bg-yellow-100 rounded-full flex items-center justify-center mt-0.5">
              <span className="text-yellow-600 text-xs">⚠️</span>
            </div>
            <div>
              <p className="text-sm text-yellow-800">
                <strong>Atenção:</strong> Esta exclusão afetará os totais e saldos do dia. 
                Os saldos dos dias seguintes serão recalculados automaticamente.
              </p>
            </div>
          </div>
        </AlertDialogDescription>

        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="outline">
              Cancelar
            </Button>
          </AlertDialogCancel>
          
          <AlertDialogAction asChild>
            <Button
              onClick={onConfirm}
              className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Excluir Lançamento
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default TransactionDeleteDialog;