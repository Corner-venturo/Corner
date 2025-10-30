import { useState } from 'react'
import { EXCHANGE_RATES } from './constants'

export function useCurrency() {
  const [amount, setAmount] = useState('')
  const [fromCurrency, setFromCurrency] = useState('USD')
  const [toCurrency, setToCurrency] = useState('TWD')
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null)

  const convert = () => {
    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) return

    if (fromCurrency === toCurrency) {
      setConvertedAmount(amountNum)
      return
    }

    const rate = EXCHANGE_RATES[fromCurrency]?.[toCurrency]
    if (rate) {
      setConvertedAmount(amountNum * rate)
    }
  }

  return {
    amount,
    setAmount,
    fromCurrency,
    setFromCurrency,
    toCurrency,
    setToCurrency,
    convertedAmount,
    convert,
  }
}
