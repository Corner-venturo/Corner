'use client'

import React, { useState, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface CalculableInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number | null | undefined
  onChange: (value: number | null) => void
  /** 是否允許小數，預設 false */
  allowDecimal?: boolean
  /** 小數位數，預設 0 */
  decimalPlaces?: number
}

/**
 * 安全地計算數學表達式
 * 支援 +, -, *, /, 括號
 */
function safeCalculate(expression: string): number | null {
  // 移除空白
  const cleaned = expression.replace(/\s/g, '')

  // 只允許數字、運算符、小數點、括號
  if (!/^[\d+\-*/().]+$/.test(cleaned)) {
    return null
  }

  // 檢查括號是否配對
  let parenCount = 0
  for (const char of cleaned) {
    if (char === '(') parenCount++
    if (char === ')') parenCount--
    if (parenCount < 0) return null
  }
  if (parenCount !== 0) return null

  // 防止危險的模式（如連續運算符）
  if (/[+\-*/]{2,}/.test(cleaned.replace(/\(-/g, '(0-'))) {
    return null
  }

  try {
    // 使用 Function 而非 eval，更安全
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const result = new Function(`return (${cleaned})`)()

    if (typeof result !== 'number' || !isFinite(result)) {
      return null
    }

    return result
  } catch {
    return null
  }
}

/**
 * 可計算的輸入框
 * 支援輸入數學表達式，按 Enter 計算結果
 * 例如：132+10 → 142
 */
export const CalculableInput: React.FC<CalculableInputProps> = ({
  value,
  onChange,
  allowDecimal = false,
  decimalPlaces = 0,
  className,
  onKeyDown,
  onBlur,
  ...props
}) => {
  // 顯示的文字（可能是表達式或數字）
  const [displayValue, setDisplayValue] = useState<string>(
    value != null ? String(value) : ''
  )
  // 是否正在編輯表達式
  const [isExpression, setIsExpression] = useState(false)

  // 當外部 value 改變時更新顯示
  React.useEffect(() => {
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
    const hasOperator = /[+\-*/]/.test(trimmed.replace(/^-/, '')) // 排除開頭的負號

    if (hasOperator) {
      // 嘗試計算
      const result = safeCalculate(trimmed)
      if (result !== null) {
        // 處理小數
        const finalValue = allowDecimal
          ? Math.round(result * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces)
          : Math.round(result)

        onChange(finalValue)
        setDisplayValue(String(finalValue))
      }
      // 如果計算失敗，保持原本的表達式
    } else {
      // 純數字
      const num = parseFloat(trimmed)
      if (!isNaN(num)) {
        const finalValue = allowDecimal
          ? Math.round(num * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces)
          : Math.round(num)

        onChange(finalValue)
        setDisplayValue(String(finalValue))
      }
    }

    setIsExpression(false)
  }, [displayValue, onChange, allowDecimal, decimalPlaces])

  // 處理輸入變更
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setDisplayValue(newValue)

    // 檢查是否為表達式
    const hasOperator = /[+\-*/]/.test(newValue.replace(/^-/, ''))
    setIsExpression(hasOperator)

    // 如果是純數字，即時更新
    if (!hasOperator) {
      const num = parseFloat(newValue)
      if (!isNaN(num)) {
        onChange(num)
      } else if (newValue === '' || newValue === '-') {
        // 允許空值或正在輸入負數
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
    <Input
      {...props}
      type="text"
      inputMode="decimal"
      value={displayValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      className={cn(
        isExpression && 'bg-amber-50 border-amber-300',
        className
      )}
    />
  )
}
