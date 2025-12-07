import * as React from 'react'

import { cn } from '@/lib/utils'
import { toHalfWidth } from '@/lib/utils/text'

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, onChange, onKeyDown, onCompositionStart, onCompositionEnd, style, ...props }, ref) => {
    const isComposingRef = React.useRef(false)
    const justFinishedComposingRef = React.useRef(false)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!onChange) return

      // 如果正在使用輸入法，直接傳遞，不轉換
      if (isComposingRef.current) {
        onChange(e)
        return
      }

      // ⚠️ 如果剛結束輸入法，跳過這次 onChange（避免重複）
      if (justFinishedComposingRef.current) {
        justFinishedComposingRef.current = false
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
      justFinishedComposingRef.current = true

      // 轉換全形到半形並立即觸發 onChange
      const convertedValue = toHalfWidth(e.currentTarget.value)
      if (onChange) {
        const syntheticEvent = {
          target: { value: convertedValue },
          currentTarget: { value: convertedValue },
        } as React.ChangeEvent<HTMLInputElement>
        onChange(syntheticEvent)
      }

      // 重置標記（延遲一點，確保下一次 input 事件被跳過）
      setTimeout(() => {
        justFinishedComposingRef.current = false
      }, 0)
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
          'flex h-10 w-full rounded-md border border-input bg-white pr-3 pl-3 py-2 text-base file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-morandi-gold disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition-colors',
          className
        )}
        style={style}
        ref={ref}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onCompositionStart={(e) => {
          isComposingRef.current = true
          // 調用外部的 onCompositionStart
          if (onCompositionStart) {
            onCompositionStart(e)
          }
        }}
        onCompositionEnd={(e) => {
          handleCompositionEnd(e)
          // 調用外部的 onCompositionEnd
          if (onCompositionEnd) {
            onCompositionEnd(e)
          }
        }}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

// 保留舊的 _Input 以防有其他地方使用
const _Input = Input

export { Input, _Input }
