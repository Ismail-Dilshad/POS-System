import { useTranslation } from 'react-i18next';
import { ReceiptBarcode } from './ReceiptBarcode';
import { formatCurrency } from '@/lib/currency';
import { type Transaction } from '@/services/business/transactionService';
import { type User } from '@/types';

interface ReceiptProps {
  transaction: Transaction;
  user: User;
  className?: string;
}

export function Receipt({ transaction, user, className = '' }: ReceiptProps) {
  const { t } = useTranslation();

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ku-Arab-IQ', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  const getUserRole = (role: string) => {
    switch (role) {
      case 'admin':
        return t('receipt.admin');
      case 'cashier':
        return t('receipt.cashier');
      case 'dataentry':
        return t('receipt.data_entry');
      default:
        return role;
    }
  };

  const storeName = t('receipt.store_name');

  return (
    <div className={`receipt-container w-full max-w-sm mx-auto p-4 bg-white text-black font-sans text-base leading-relaxed sm:max-w-xs ${className}`}>
      {/* Store Header */}
      <div className="receipt-header text-center font-bold text-xl mb-4 border-b border-black pb-2">
        {storeName}
      </div>

      {/* Transaction Info */}
      <div className="receipt-info mb-4 text-sm">
        <div className="flex justify-between items-center mb-1">
          <span className="font-bold">{getUserRole(user.role)}:</span>
          <span>{user.full_name}</span>
        </div>
        <div className="flex justify-between items-center mb-1">
          <span className="font-bold">{t('receipt.date')}:</span>
          <span>{formatDateTime(transaction.created_at)}</span>
        </div>
        <div className="flex justify-between items-center mb-1">
          <span className="font-bold">{t('receipt.receipt_number')}:</span>
          <span>{transaction.transaction_number}</span>
        </div>
      </div>

      <div className="border-t border-dashed border-black my-4"></div>

      {/* Items Table */}
      <div className="border border-black mb-4">
        {/* Items Header */}
        <div className="receipt-items-header grid grid-cols-4 gap-0 font-bold text-sm border-b-2 border-black bg-gray-100">
          <div className="text-right p-2">{t('receipt.items_header.name')}</div>
          <div className="text-center p-2">{t('receipt.items_header.qty')}</div>
          <div className="text-right p-2">{t('receipt.items_header.price')}</div>
          <div className="text-right p-2">{t('receipt.items_header.total')}</div>
        </div>

        {/* Items */}
        {transaction.items.map((item, index) => {
          const price = Number(item.price) || 0;
          const qty = Number(item.quantity || item.weight || 1);
          const total = price * qty;
          
          return (
            <div key={index} className={`receipt-item grid grid-cols-4 gap-0 text-sm ${index < transaction.items.length - 1 ? 'border-b border-gray-300' : ''}`}>
              <div className="text-right break-words p-2">{item.name}</div>
              <div className="text-center p-2">{qty}</div>
              <div className="text-right p-2">{new Intl.NumberFormat('ku-Arab-IQ', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price)}</div>
              <div className="text-right font-bold p-2">{new Intl.NumberFormat('ku-Arab-IQ', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(total)}</div>
            </div>
          );
        })}
      </div>

      {/* Totals */}
      <div className="receipt-totals mt-4 border-t border-black pt-2">
        {(() => {
          // Calculate subtotal from price * qty for each item
          const subtotal = transaction.items.reduce((sum, item) => {
            const price = Number(item.price) || 0;
            const qty = Number(item.quantity || item.weight || 1);
            return sum + (price * qty);
          }, 0);
          const discount = Number(transaction.discount) || 0;
          const grandTotal = Number(transaction.total_amount) || 0;
          
          return (
            <>
              <div className="flex justify-between mb-1 text-sm">
                <span>{t('receipt.totals.subtotal')}:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between mb-1 text-sm">
                  <span>{t('receipt.totals.discount')}:</span>
                  <span>-{formatCurrency(discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg border-t-2 border-black pt-2 mt-2">
                <span>{t('receipt.totals.grand_total')}:</span>
                <span>{formatCurrency(grandTotal)}</span>
              </div>
            </>
          );
        })()}
      </div>

      <div className="border-t border-dashed border-black my-4"></div>

      {/* Barcode */}
      <ReceiptBarcode receiptId={transaction.transaction_number} />

      <div className="border-t border-dashed border-black my-4"></div>

      {/* Footer */}
      <div className="receipt-footer text-center text-xs">
        <div className="font-bold mb-2">{t('receipt.footer.thank_you')}</div>
      </div>
    </div>
  );
}
