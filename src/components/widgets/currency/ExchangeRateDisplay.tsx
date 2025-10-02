import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RefreshCw } from 'lucide-react';
import { Currency } from './currencyData';

interface ExchangeRateDisplayProps {
  currentRate: number;
  fromCurrency: string;
  toCurrency: string;
  isEditing: boolean;
  editRate: string;
  onEditRate: (rate: string) => void;
  onStartEdit: () => void;
  onUpdateRate: () => void;
  onCancelEdit: () => void;
  convertedAmount: number | null;
  amount: string;
  fromCurrencyInfo: Currency;
  toCurrencyInfo: Currency;
}

/**
 * 匯率顯示區元件
 */
export const ExchangeRateDisplay = ({
  currentRate,
  fromCurrency,
  toCurrency,
  isEditing,
  editRate,
  onEditRate,
  onStartEdit,
  onUpdateRate,
  onCancelEdit,
  convertedAmount,
  amount,
  fromCurrencyInfo,
  toCurrencyInfo,
}: ExchangeRateDisplayProps) => {
  return (
    <>
      {/* 目前匯率顯示與編輯 */}
      <div className="p-2.5 bg-morandi-container/20 rounded-xl">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-morandi-secondary">目前匯率</span>
          {!isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onStartEdit}
              className="h-6 text-xs rounded-md"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              更新
            </Button>
          )}
        </div>

        {isEditing ? (
          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              step="0.0001"
              value={editRate}
              onChange={(e) => onEditRate(e.target.value)}
              className="flex-1 h-8 text-xs rounded-lg"
              placeholder="輸入新匯率"
            />
            <Button
              size="sm"
              onClick={onUpdateRate}
              className="h-8 text-xs bg-morandi-gold hover:bg-morandi-gold/80 text-white rounded-lg"
            >
              確定
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onCancelEdit}
              className="h-8 text-xs rounded-lg"
            >
              取消
            </Button>
          </div>
        ) : (
          <div className="text-center">
            <span className="text-sm font-semibold text-morandi-primary">
              1 {fromCurrency} = {currentRate.toFixed(4)} {toCurrency}
            </span>
          </div>
        )}
      </div>

      {/* 即時結果顯示 */}
      {amount && parseFloat(amount) > 0 && convertedAmount !== null && (
        <div className="p-2.5 bg-morandi-gold/10 rounded-xl border border-morandi-gold/20">
          <div className="text-center">
            <div className="text-xs text-morandi-secondary mb-0.5">
              {fromCurrencyInfo.symbol} {parseFloat(amount).toLocaleString()} {fromCurrency}
            </div>
            <div className="text-lg font-bold text-morandi-gold">
              {toCurrencyInfo.symbol} {convertedAmount.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })} {toCurrency}
            </div>
          </div>
        </div>
      )}

      {/* 匯率提示 */}
      <div className="text-[10px] text-morandi-secondary/70 text-center">
        ※ 匯率僅供參考，實際匯率以銀行公告為準
      </div>
    </>
  );
};
