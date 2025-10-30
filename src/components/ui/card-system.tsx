/**
 * Card System - 統一的卡片組件系統
 * 替代重複的 card-morandi, card-morandi-elevated 等類別
 */

'use client'

import React, { ReactNode } from 'react'
import { cn } from '@/lib/utils'

// ============================================
// Card Variants
// ============================================

export type CardVariant = 'default' | 'elevated' | 'outline' | 'ghost'

const CARD_VARIANTS = {
  default:
    'bg-card rounded-xl p-6 border border-morandi-container/20 hover:border-morandi-gold/20 transition-colors',
  elevated: 'bg-card rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow',
  outline:
    'bg-transparent rounded-xl p-6 border-2 border-morandi-gold/20 hover:border-morandi-gold transition-colors',
  ghost: 'bg-morandi-container/5 rounded-xl p-6 hover:bg-morandi-container/10 transition-colors',
}

// ============================================
// Base Card Component
// ============================================

export interface CardProps {
  variant?: CardVariant
  className?: string
  children: ReactNode
  onClick?: () => void
  hoverable?: boolean
}

export function Card({
  variant = 'default',
  className,
  children,
  onClick,
  hoverable = false,
}: CardProps) {
  return (
    <div
      className={cn(
        CARD_VARIANTS[variant],
        onClick && 'cursor-pointer',
        hoverable && 'hover:scale-[1.02] transition-transform',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

// ============================================
// Card Header
// ============================================

export interface CardHeaderProps {
  icon?: ReactNode
  title: string
  subtitle?: string
  action?: ReactNode
  className?: string
}

export function CardHeader({ icon, title, subtitle, action, className }: CardHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between mb-4', className)}>
      <div className="flex items-center gap-3 flex-1">
        {icon && <div className="flex-shrink-0 text-morandi-gold">{icon}</div>}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-morandi-primary truncate">{title}</h3>
          {subtitle && <p className="text-sm text-morandi-secondary mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="flex-shrink-0 ml-4">{action}</div>}
    </div>
  )
}

// ============================================
// Card Content
// ============================================

export interface CardContentProps {
  children: ReactNode
  className?: string
}

export function CardContent({ children, className }: CardContentProps) {
  return <div className={cn('text-morandi-primary', className)}>{children}</div>
}

// ============================================
// Card Actions (Footer)
// ============================================

export interface CardActionsProps {
  children: ReactNode
  className?: string
  align?: 'left' | 'center' | 'right' | 'between'
}

export function CardActions({ children, className, align = 'right' }: CardActionsProps) {
  const alignClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    between: 'justify-between',
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 mt-4 pt-4 border-t border-morandi-container/20',
        alignClasses[align],
        className
      )}
    >
      {children}
    </div>
  )
}

// ============================================
// Card Divider
// ============================================

export function CardDivider({ className }: { className?: string }) {
  return <hr className={cn('border-t border-morandi-container/20 my-4', className)} />
}

// ============================================
// Card Grid - For card layouts
// ============================================

export interface CardGridProps {
  children: ReactNode
  cols?: 1 | 2 | 3 | 4
  gap?: 2 | 3 | 4 | 6 | 8
  className?: string
}

export function CardGrid({ children, cols = 3, gap = 4, className }: CardGridProps) {
  const colsClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  }

  const gapClasses = {
    2: 'gap-2',
    3: 'gap-3',
    4: 'gap-4',
    6: 'gap-6',
    8: 'gap-8',
  }

  return <div className={cn('grid', colsClasses[cols], gapClasses[gap], className)}>{children}</div>
}

// ============================================
// 使用範例
// ============================================

/*
// 基本使用
<Card variant="elevated">
  <CardHeader
    icon={<MapPin />}
    title="景點資訊"
    subtitle="共 10 個景點"
    action={<Button size="sm">編輯</Button>}
  />
  <CardContent>
    <p>景點內容...</p>
  </CardContent>
  <CardActions>
    <Button variant="outline">取消</Button>
    <Button>確認</Button>
  </CardActions>
</Card>

// 卡片網格
<CardGrid cols={3} gap={4}>
  <Card>...</Card>
  <Card>...</Card>
  <Card>...</Card>
</CardGrid>
*/
