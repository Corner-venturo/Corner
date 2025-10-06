'use client';

import { Input } from '@/components/ui/input';
import { DollarSign } from 'lucide-react';
import { useCurrency } from './currency/useCurrency';
import { currencies } from './currency/currencyData';
import { getCurrencyInfo, getCurrentRate, convertAmount } from './currency/currencyUtils';
import { CurrencySelector } from './currency/CurrencySelector';
import { ExchangeRateDisplay } from './currency/ExchangeRateDisplay';

/**
 * 匯率轉換小工具
 * - 支援多種貨幣轉換
 * - 可自訂匯率
 * - 即時顯示轉換結果
 */
export function CurrencyWidget() {
  const currency = useCurrency();

  // 計算相關數值
  const currentRate = getCurrentRate(currency.exchangeRates, currency.fromCurrency, currency.toCurrency);
  const convertedAmount = convertAmount(currency.amount, currency.exchangeRates, currency.fromCurrency, currency.toCurrency);
  const fromCurrencyInfo = getCurrencyInfo(currencies, currency.fromCurrency);
  const toCurrencyInfo = getCurrencyInfo(currencies, currency.toCurrency);

  return (
    <div className="p-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all border border-border/50">
      {/* 標題列 */}
      <div className="flex items-center gap-2 mb-3">
        <DollarSign className="w-4 h-4 text-morandi-gold" />
        <h3 className="text-sm font-semibold text-morandi-primary">匯率轉換</h3>
      </div>

      <div className="space-y-3">
        {/* 金額輸入 */}
        <div>
          <label className="block text-xs font-medium text-morandi-secondary mb-1">
            金額
          </label>
          <Input
            type="number"
            value={currency.amount}
            onChange={(e) => currency.setAmount(e.target.value)}
            placeholder="請輸入金額"
            className="w-full h-9 text-sm rounded-lg"
          />
        </div>

        {/* 貨幣選擇器 */}
        <CurrencySelector
          currencies={currencies}
          fromCurrency={currency.fromCurrency}
          toCurrency={currency.toCurrency}
          onFromChange={currency.setFromCurrency}
          onToChange={currency.setToCurrency}
          onSwap={currency.swapCurrencies}
        />

        {/* 匯率顯示與結果 */}
        <ExchangeRateDisplay
          currentRate={currentRate}
          fromCurrency={currency.fromCurrency}
          toCurrency={currency.toCurrency}
          isEditing={currency.isEditing}
          editRate={currency.editRate}
          onEditRate={currency.setEditRate}
          onStartEdit={() => currency.startEditRate(currentRate)}
          onUpdateRate={currency.updateRate}
          onCancelEdit={currency.cancelEditRate}
          convertedAmount={convertedAmount}
          amount={currency.amount}
          fromCurrencyInfo={fromCurrencyInfo}
          toCurrencyInfo={toCurrencyInfo}
        />
      </div>
    </div>
  );
}
