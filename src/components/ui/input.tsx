import * as React from 'react'

import { cn } from '@/lib/utils'
import { toHalfWidth } from '@/lib/utils/text'

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, onChange, onKeyDown, style, ...props }, ref) => {
    const isComposingRef = React.useRef(false)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!onChange) return

      // 如果正在使用輸入法，直接傳遞，不轉換
      if (isComposingRef.current) {
        onChange(e)
        return
      }

      // 非輸入法狀態，進行全形轉半形
      const convertedValue = toHalfWidth(e.target.value)
      if (convertedValue !== e.target.value) {
        const newEvent = {
          ...e,
          target: { ...e.target, value: convertedValue },
        } as React.ChangeEvent<HTMLInputElement>
        onChange(newEvent)
      } else {
        onChange(e)
      }
    }

    const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
      isComposingRef.current = false

      // 輸入法結束後，立即轉換全形到半形
      if (onChange) {
        const convertedValue = toHalfWidth(e.currentTarget.value)
        if (convertedValue !== e.currentTarget.value) {
          const syntheticEvent = {
            target: { value: convertedValue },
            currentTarget: { value: convertedValue },
          } as React.ChangeEvent<HTMLInputElement>
          onChange(syntheticEvent)
        }
      }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // 先調用外部的 onKeyDown
      if (onKeyDown) {
        onKeyDown(e)
      }

      // 只在非中文輸入狀態下處理 Enter
      if (e.key === 'Enter' && !isComposingRef.current && !e.defaultPrevented) {
        e.preventDefault()
        e.currentTarget.blur()
      }
    }

    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background pr-3 pl-3 py-2 text-base file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-morandi-gold disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition-colors',
          className
        )}
        style={style}
        ref={ref}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onCompositionStart={() => { isComposingRef.current = true }}
        onCompositionEnd={handleCompositionEnd}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

// 保留舊的 _Input 以防有其他地方使用
const _Input = Input

export { Input, _Input }
