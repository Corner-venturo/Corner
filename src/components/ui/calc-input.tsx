'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { calculateExpression } from '@/hooks/useCalculableInput'

interface CalcInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number | null | undefined
  onChange: (value: number | null) => void
}

/**
 * 可計算的輸入框（簡單版）
 * 支援輸入數學表達式，按 Enter 或失焦時計算結果
 * 例如：132+10 → 142、100*1.1 → 110
 */
export const CalcInput: React.FC<CalcInputProps> = ({
  value,
  onChange,
  className,
  onKeyDown,
  onBlur,
  ...props
}) => {
  const [displayValue, setDisplayValue] = useState<string>(
    value != null ? String(value) : ''
  )
  const [isExpression, setIsExpression] = useState(false)

  // 當外部 value 改變且不在編輯表達式時，更新顯示
  useEffect(() => {
    if (!isExpression) {
      setDisplayValue(value != null ? String(value) : '')
    }
  }, [value, isExpression])

  // 計算並更新值
  const calculate = useCallback(() => {
    const trimmed = displayValue.trim()

    // 空值
    if (!trimmed) {
      onChange(null)
      setIsExpression(false)
      return
    }

    // 檢查是否包含運算符（是表達式）
    const hasOperator = /[+\-*/]/.test(trimmed.slice(1))

    if (hasOperator) {
      const result = calculateExpression(trimmed)
      if (result !== null) {
        const finalValue = Math.round(result)
        onChange(finalValue)
        setDisplayValue(String(finalValue))
      }
    } else {
      const num = parseFloat(trimmed)
      if (!isNaN(num)) {
        const finalValue = Math.round(num)
        onChange(finalValue)
        setDisplayValue(String(finalValue))
      }
    }

    setIsExpression(false)
  }, [displayValue, onChange])

  // 處理輸入變更
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setDisplayValue(newValue)

    const hasOperator = /[+\-*/]/.test(newValue.slice(1))
    setIsExpression(hasOperator)

    // 純數字即時更新
    if (!hasOperator) {
      const num = parseFloat(newValue)
      if (!isNaN(num)) {
        onChange(Math.round(num))
      }
    }
  }

  // 處理按鍵
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      calculate()
    }
    onKeyDown?.(e)
  }

  // 處理失焦
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    calculate()
    onBlur?.(e)
  }

  return (
    <input
      {...props}
      type="text"
      inputMode="decimal"
      value={displayValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      className={`${className || ''} ${isExpression ? '!bg-amber-50' : ''}`}
    />
  )
}
