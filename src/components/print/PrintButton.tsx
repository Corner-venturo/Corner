'use client'

import React, { useRef, useCallback } from 'react'
import { useReactToPrint } from 'react-to-print'
import { Button } from '@/components/ui/button'
import { Printer, Loader2 } from 'lucide-react'

interface PrintButtonProps {
  /** 要列印的內容的 ref */
  contentRef: React.RefObject<HTMLDivElement | null>
  /** 文件標題（用於檔名） */
  documentTitle?: string
  /** 按鈕文字 */
  label?: string
  /** 按鈕大小 */
  size?: 'default' | 'sm' | 'lg' | 'icon'
  /** 按鈕樣式 */
  variant?: 'default' | 'outline' | 'ghost'
  /** 列印前的回調 */
  onBeforePrint?: () => void
  /** 列印後的回調 */
  onAfterPrint?: () => void
  /** 自定義 className */
  className?: string
}

/**
 * 通用列印按鈕組件
 * 使用 react-to-print 實現列印功能
 *
 * @example
 * ```tsx
 * const printRef = useRef<HTMLDivElement>(null)
 *
 * <div ref={printRef}>
 *   {/* 要列印的內容 *\/}
 * </div>
 *
 * <PrintButton
 *   contentRef={printRef}
 *   documentTitle="報價單-NRT250209A"
 * />
 * ```
 */
export const PrintButton: React.FC<PrintButtonProps> = ({
  contentRef,
  documentTitle,
  label = '列印',
  size = 'sm',
  variant = 'outline',
  onBeforePrint,
  onAfterPrint,
  className,
}) => {
  const [isPrinting, setIsPrinting] = React.useState(false)

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle,
    // 列印頁面設定
    pageStyle: `
      @page {
        size: A4;
        margin: 8mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          font-size: 10pt !important;
        }
        /* Tailwind print utilities */
        .print\\:hidden {
          display: none !important;
        }
        .print\\:block {
          display: block !important;
        }
        .print\\:table-cell {
          display: table-cell !important;
        }
        .print\\:table-row {
          display: table-row !important;
        }
        .print\\:border-0 {
          border: none !important;
        }
        .print\\:rounded-none {
          border-radius: 0 !important;
        }
        /* 移除所有圓角和陰影 */
        * {
          border-radius: 0 !important;
          box-shadow: none !important;
        }
        /* 表格樣式 */
        table {
          border-collapse: collapse !important;
          width: 100% !important;
        }
        th, td {
          border: 0.5pt solid #333 !important;
          padding: 4px 6px !important;
        }
        /* 移除背景色（可選，看需求） */
        .bg-morandi-container\\/30,
        .bg-morandi-container\\/50,
        .bg-morandi-gold\\/10 {
          background-color: #f5f5f5 !important;
        }
      }
    `,
    onBeforePrint: () => {
      setIsPrinting(true)
      onBeforePrint?.()
      return Promise.resolve()
    },
    onAfterPrint: () => {
      setIsPrinting(false)
      onAfterPrint?.()
    },
  })

  return (
    <Button
      variant={variant}
      size={size}
      onClick={() => handlePrint()}
      disabled={isPrinting}
      className={`gap-2 ${className || ''}`}
    >
      {isPrinting ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <Printer size={16} />
      )}
      {label}
    </Button>
  )
}

/**
 * 列印內容包裝器
 * 用於包裝要列印的內容，提供列印時的樣式控制
 */
interface PrintContentProps {
  children: React.ReactNode
  className?: string
}

export const PrintContent = React.forwardRef<HTMLDivElement, PrintContentProps>(
  ({ children, className }, ref) => {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    )
  }
)
PrintContent.displayName = 'PrintContent'
