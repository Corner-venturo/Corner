import { Currency, ExchangeRates } from './currencyData'

/**
 * 取得貨幣資訊
 */
export const getCurrencyInfo = (currencies: Currency[], code: string): Currency => {
  return currencies.find(c => c.code === code) || currencies[0]
}

/**
 * 取得當前匯率
 */
export const getCurrentRate = (
  exchangeRates: ExchangeRates,
  fromCurrency: string,
  toCurrency: string
): number => {
  if (fromCurrency === toCurrency) return 1
  return exchangeRates[fromCurrency]?.[toCurrency] || 0
}

/**
 * 計算轉換金額
 */
export const convertAmount = (
  amount: string,
  exchangeRates: ExchangeRates,
  fromCurrency: string,
  toCurrency: string
): number | null => {
  const inputAmount = parseFloat(amount)
  if (isNaN(inputAmount) || inputAmount <= 0) {
    return null
  }

  if (fromCurrency === toCurrency) {
    return inputAmount
  }

  const rate = exchangeRates[fromCurrency]?.[toCurrency]
  if (rate) {
    return inputAmount * rate
  }
  return null
}
