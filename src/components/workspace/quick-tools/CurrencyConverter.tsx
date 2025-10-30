import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCurrency } from './useCurrency'
import { CURRENCY_OPTIONS } from './constants'

export function CurrencyConverter() {
  const {
    amount,
    setAmount,
    fromCurrency,
    setFromCurrency,
    toCurrency,
    setToCurrency,
    convertedAmount,
    convert,
  } = useCurrency()

  return (
    <div className="max-w-md mx-auto">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">匯率轉換</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">金額</label>
            <Input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="輸入金額"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">從</label>
              <select
                value={fromCurrency}
                onChange={e => setFromCurrency(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md"
              >
                {CURRENCY_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">到</label>
              <select
                value={toCurrency}
                onChange={e => setToCurrency(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md"
              >
                {CURRENCY_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Button onClick={convert} className="w-full">
            轉換
          </Button>

          {convertedAmount !== null && (
            <div className="bg-morandi-container/10 p-4 rounded-lg text-center">
              <div className="text-2xl font-semibold text-morandi-primary">
                {convertedAmount.toFixed(2)} {toCurrency}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
