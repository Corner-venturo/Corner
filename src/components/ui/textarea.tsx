import * as React from 'react'

import { cn } from '@/lib/utils'
import { toHalfWidth } from '@/lib/utils/text'

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(
  ({ className, onChange, onKeyDown, onCompositionStart, onCompositionEnd, ...props }, ref) => {
    const isComposingRef = React.useRef(false)
    const justFinishedComposingRef = React.useRef(false)

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (!onChange) return

      // 如果正在使用輸入法，直接傳遞，不轉換
      if (isComposingRef.current) {
        onChange(e)
        return
      }

      // 如果剛結束輸入法，跳過這次 onChange
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
        } as React.ChangeEvent<HTMLTextAreaElement>
        onChange(newEvent)
      } else {
        onChange(e)
      }
    }

    const handleCompositionEnd = (e: React.CompositionEvent<HTMLTextAreaElement>) => {
      isComposingRef.current = false
      justFinishedComposingRef.current = true

      // 轉換全形到半形並立即觸發 onChange
      const convertedValue = toHalfWidth(e.currentTarget.value)
      if (onChange) {
        const syntheticEvent = {
          target: { value: convertedValue },
          currentTarget: { value: convertedValue },
        } as React.ChangeEvent<HTMLTextAreaElement>
        onChange(syntheticEvent)
      }

      // 重置標記
      setTimeout(() => {
        justFinishedComposingRef.current = false
      }, 0)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // 🔥 輸入法組合中按 Enter 時，阻止事件冒泡（但允許換行）
      // 注意：Textarea 中 Enter 通常是換行，不是提交
      // 這裡只阻止 composing 狀態的 Enter 事件傳播
      if (e.key === 'Enter' && isComposingRef.current) {
        e.stopPropagation()
        // 不 preventDefault，允許換行
        return
      }

      if (onKeyDown) {
        onKeyDown(e)
      }
    }

    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-md border border-input bg-white px-3 py-2 text-base placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          className
        )}
        ref={ref}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onCompositionStart={(e) => {
          isComposingRef.current = true
          if (onCompositionStart) {
            onCompositionStart(e)
          }
        }}
        onCompositionEnd={(e) => {
          handleCompositionEnd(e)
          if (onCompositionEnd) {
            onCompositionEnd(e)
          }
        }}
        {...props}
      />
    )
  }
)
Textarea.displayName = 'Textarea'

export { Textarea }
