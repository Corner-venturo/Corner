/**
 * Accordion - 統一的展開/收合組件
 * 替代重複的 expanded state 管理
 */

'use client'

import React, { useState, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronUp } from 'lucide-react'

// ============================================
// Single Accordion Item
// ============================================

export interface AccordionItemProps {
  title: string | ReactNode
  children: ReactNode
  defaultOpen?: boolean
  icon?: ReactNode
  badge?: ReactNode
  className?: string
  onToggle?: (isOpen: boolean) => void
}

export function AccordionItem({
  title,
  children,
  defaultOpen = false,
  icon,
  badge,
  className,
  onToggle,
}: AccordionItemProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  const handleToggle = () => {
    const newState = !isOpen
    setIsOpen(newState)
    if (onToggle) {
      onToggle(newState)
    }
  }

  return (
    <div className={cn('border border-morandi-container/20 rounded-lg', className)}>
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-morandi-container/5 transition-colors rounded-t-lg"
      >
        <div className="flex items-center gap-3 flex-1">
          {icon && <div className="flex-shrink-0 text-morandi-gold">{icon}</div>}
          <div className="flex-1 font-medium text-morandi-primary">{title}</div>
          {badge && <div className="flex-shrink-0">{badge}</div>}
        </div>
        <div className="flex-shrink-0 ml-4 text-morandi-secondary">
          {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </button>

      {isOpen && <div className="p-4 border-t border-morandi-container/20">{children}</div>}
    </div>
  )
}

// ============================================
// Accordion Group (Multiple Items)
// ============================================

export interface AccordionProps {
  children: ReactNode
  gap?: number
  className?: string
  type?: 'single' | 'multiple' // single: 一次只能展開一個
}

export function Accordion({ children, gap = 2, className, type = 'multiple' }: AccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const gapClass = `space-y-${gap}`

  // 如果是 single 模式，需要處理展開狀態
  const childrenArray = React.Children.toArray(children)

  if (type === 'single') {
    return (
      <div className={cn(gapClass, className)}>
        {childrenArray.map((child, index) => {
          if (React.isValidElement(child) && child.type === AccordionItem) {
            return React.cloneElement(child as React.ReactElement<AccordionItemProps>, {
              key: index,
              defaultOpen: openIndex === index,
              onToggle: (isOpen: boolean) => {
                if (isOpen) {
                  setOpenIndex(index)
                } else if (openIndex === index) {
                  setOpenIndex(null)
                }
                // 調用原有的 onToggle
                const originalOnToggle = (child as React.ReactElement<AccordionItemProps>).props
                  .onToggle
                if (originalOnToggle) {
                  originalOnToggle(isOpen)
                }
              },
            })
          }
          return child
        })}
      </div>
    )
  }

  return <div className={cn(gapClass, className)}>{children}</div>
}

// ============================================
// 簡化版 - 適用於簡單的展開/收合
// ============================================

export interface SimpleAccordionProps {
  trigger: ReactNode
  children: ReactNode
  defaultOpen?: boolean
  className?: string
}

export function SimpleAccordion({
  trigger,
  children,
  defaultOpen = false,
  className,
}: SimpleAccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className={className}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-morandi-primary hover:text-morandi-gold transition-colors"
      >
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        {trigger}
      </button>
      {isOpen && <div className="mt-2">{children}</div>}
    </div>
  )
}

// ============================================
// 使用範例
// ============================================

/*
// 基本使用
<AccordionItem
  title="景點列表"
  icon={<MapPin />}
  badge={<Badge>10</Badge>}
  defaultOpen={true}
>
  <p>景點內容...</p>
</AccordionItem>

// 多個 Accordion（multiple 模式）
<Accordion gap={3}>
  <AccordionItem title="第一項">內容 1</AccordionItem>
  <AccordionItem title="第二項">內容 2</AccordionItem>
  <AccordionItem title="第三項">內容 3</AccordionItem>
</Accordion>

// 單一展開模式（single 模式）
<Accordion type="single">
  <AccordionItem title="第一項">內容 1</AccordionItem>
  <AccordionItem title="第二項">內容 2</AccordionItem>
  <AccordionItem title="第三項">內容 3</AccordionItem>
</Accordion>

// 簡化版
<SimpleAccordion trigger="點擊展開">
  <p>展開的內容</p>
</SimpleAccordion>
*/
