import { Button } from '@/components/ui/button';
import { ArrowUpDown } from 'lucide-react';
import { Currency } from './currencyData';

interface CurrencySelectorProps {
  currencies: Currency[];
  fromCurrency: string;
  toCurrency: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  onSwap: () => void;
}

/**
 * 貨幣選擇器元件
 */
export const CurrencySelector = ({
  currencies,
  fromCurrency,
  toCurrency,
  onFromChange,
  onToChange,
  onSwap,
}: CurrencySelectorProps) => {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1">
        <label className="block text-xs font-medium text-morandi-secondary mb-1">
          從
        </label>
        <select
          value={fromCurrency}
          onChange={(e) => onFromChange(e.target.value)}
          className="w-full px-2.5 py-1.5 border border-border rounded-lg text-xs"
        >
          {currencies.map(currency => (
            <option key={currency.code} value={currency.code}>
              {currency.code} - {currency.name}
            </option>
          ))}
        </select>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={onSwap}
        className="mt-5 h-8 w-8 rounded-lg"
        title="交換貨幣"
      >
        <ArrowUpDown className="h-3 w-3" />
      </Button>

      <div className="flex-1">
        <label className="block text-xs font-medium text-morandi-secondary mb-1">
          到
        </label>
        <select
          value={toCurrency}
          onChange={(e) => onToChange(e.target.value)}
          className="w-full px-2.5 py-1.5 border border-border rounded-lg text-xs"
        >
          {currencies.map(currency => (
            <option key={currency.code} value={currency.code}>
              {currency.code} - {currency.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
