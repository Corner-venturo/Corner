import { useState } from 'react'
import { ExchangeRates, defaultExchangeRates } from './currencyData'

/**
 * 匯率轉換邏輯 Hook
 */
export const useCurrency = () => {
  const [amount, setAmount] = useState('')
  const [fromCurrency, setFromCurrency] = useState('USD')
  const [toCurrency, setToCurrency] = useState('TWD')
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>(defaultExchangeRates)
  const [isEditing, setIsEditing] = useState(false)
  const [editRate, setEditRate] = useState('')

  /**
   * 交換貨幣
   */
  const swapCurrencies = () => {
    setFromCurrency(toCurrency)
    setToCurrency(fromCurrency)
  }

  /**
   * 開始編輯匯率
   */
  const startEditRate = (currentRate: number) => {
    setIsEditing(true)
    setEditRate(currentRate.toString())
  }

  /**
   * 更新匯率
   */
  const updateRate = () => {
    const newRate = parseFloat(editRate)
    if (isNaN(newRate) || newRate <= 0) return

    setExchangeRates(prev => ({
      ...prev,
      [fromCurrency]: {
        ...prev[fromCurrency],
        [toCurrency]: newRate,
      },
    }))
    setIsEditing(false)
    setEditRate('')
  }

  /**
   * 取消編輯匯率
   */
  const cancelEditRate = () => {
    setIsEditing(false)
    setEditRate('')
  }

  return {
    amount,
    setAmount,
    fromCurrency,
    setFromCurrency,
    toCurrency,
    setToCurrency,
    exchangeRates,
    isEditing,
    editRate,
    setEditRate,
    swapCurrencies,
    startEditRate,
    updateRate,
    cancelEditRate,
  }
}
