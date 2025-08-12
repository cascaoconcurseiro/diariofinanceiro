import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { AlertTriangle, Calendar, Trash2, Settings } from 'lucide-react';
import { TransactionEntry } from '../types/transactions';
import { formatCurrency } from '../utils/currencyUtils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RecurringInstanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: TransactionEntry;
  onDeleteInstance: (transactionId: string) => void;
  onManageRecurring: () => void;
}

const RecurringInstanceModal: React.FC<RecurringInstanceModalProps> = ({
  isOpen,
  onClose,
  transaction,
  onDeleteInstance,
  onManageRecurring
}) => {
  const transactionDate = new Date(transaction.date);

  const handleDeleteInstance = () => {
    const confirmMessage = `🗑️ EXCLUIR APENAS ESTE LANÇAMENTO?\n\n` +
      `Data: ${format(transactionDate, "dd/MM/yyyy")}\n` +
      `Descrição: "${transaction.description}"\n` +
      `Valor: ${formatCurrency(transaction.amount)}\n\n` +
      `✅ CONFIRME O QUE VAI ACONTECER:\n` +
      `• Remove APENAS este lançamento de ${format(transactionDate, "dd/MM/yyyy")}\n` +
      `• Outros meses do recorrente PERMANECEM\n` +
      `• O lançamento recorrente continua ATIVO\n` +
      `• Próximos meses continuarão sendo gerados\n\n` +
      `⚠️ Se quiser excluir TUDO (recorrente + todos os lançamentos),\n` +
      `cancele e use "Gerenciar Lançamento Recorrente".\n\n` +
      `Confirma a exclusão APENAS deste lançamento?`;

    if (window.confirm(confirmMessage)) {
      console.log('🗑️ User confirmed: Delete ONLY this instance');
      onDeleteInstance(transaction.id);
      onClose();
    } else {
      console.log('❌ User cancelled deletion');
    }
  };

  const handleManageRecurring = () => {
    onClose();
    onManageRecurring();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-orange-600" />
            Lançamento Recorrente
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Info da transação */}
          <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">
                🔄 RECORRENTE
              </span>
            </div>
            <h3 className="font-semibold text-gray-900">{transaction.description}</h3>
            <p className="text-sm text-gray-600">
              {format(transactionDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
            <p className="text-lg font-bold text-gray-900 mt-1">
              {formatCurrency(transaction.amount)}
            </p>
          </div>

          {/* Aviso */}
          <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">Este é um lançamento recorrente</p>
              <p>Você pode excluir apenas esta instância ou gerenciar o lançamento recorrente completo.</p>
            </div>
          </div>

          {/* Opções */}
          <div className="space-y-3">
            <Button
              onClick={handleDeleteInstance}
              variant="outline"
              className="w-full flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
              Excluir Apenas Este Lançamento
            </Button>

            <Button
              onClick={handleManageRecurring}
              className="w-full flex items-center gap-2 bg-orange-600 hover:bg-orange-700"
            >
              <Settings className="w-4 h-4" />
              Gerenciar Lançamento Recorrente
            </Button>

            <Button
              onClick={onClose}
              variant="ghost"
              className="w-full"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RecurringInstanceModal;