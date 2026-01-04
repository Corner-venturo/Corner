'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { FileX, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface NotFoundStateProps {
  /** 顯示的標題訊息 */
  title?: string
  /** 顯示的描述訊息 */
  description?: string
  /** 返回按鈕的文字 */
  backButtonLabel?: string
  /** 返回的路徑，如果不提供則使用 router.back() */
  backHref?: string
  /** 是否顯示返回按鈕 */
  showBackButton?: boolean
  /** 自定義圖示 */
  icon?: React.ReactNode
  /** 額外的 CSS 類名 */
  className?: string
}

/**
 * NotFoundState 組件
 * 當資料不存在時顯示的友好 404 狀態頁面
 */
export function NotFoundState({
  title = '找不到該資料',
  description = '您要找的資料可能已被刪除或不存在',
  backButtonLabel = '返回列表',
  backHref,
  showBackButton = true,
  icon,
  className,
}: NotFoundStateProps) {
  const router = useRouter()

  const handleBack = () => {
    if (backHref) {
      router.push(backHref)
    } else {
      router.back()
    }
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center min-h-[400px] p-8',
        className
      )}
    >
      {/* 404 圖示 */}
      <div className="flex items-center justify-center w-20 h-20 rounded-full bg-morandi-container/50 mb-6">
        {icon || <FileX className="w-10 h-10 text-morandi-secondary" />}
      </div>

      {/* 標題 */}
      <h2 className="text-xl font-semibold text-morandi-primary mb-2">
        {title}
      </h2>

      {/* 描述 */}
      <p className="text-morandi-secondary text-center max-w-md mb-6">
        {description}
      </p>

      {/* 返回按鈕 */}
      {showBackButton && (
        <Button
          variant="outline"
          onClick={handleBack}
          className="gap-2"
        >
          <ArrowLeft size={16} />
          {backButtonLabel}
        </Button>
      )}
    </div>
  )
}
