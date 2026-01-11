/**
 * PrintableWrapper - 共用列印包裝元件
 *
 * 統一快速報價單和團體報價單的列印結構
 */

'use client'

import React, { useState, useEffect, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { PrintHeader } from './PrintHeader'
import { PrintFooter } from './PrintFooter'
import { PrintControls } from './PrintControls'
import { usePrintLogo } from './usePrintLogo'

// 列印專用樣式 - 內嵌確保優先級
const PRINT_CSS = `
  @media print {
    /* 隱藏頁面其他元素 */
    body > *:not(#print-overlay) {
      display: none !important;
    }

    /* 重置 overlay */
    #print-overlay {
      position: static !important;
      inset: auto !important;
      width: 100% !important;
      height: auto !important;
      background: transparent !important;
      padding: 0 !important;
      display: block !important;
      z-index: 1 !important;
    }

    /* 重置內部容器 */
    #print-overlay > div {
      max-width: 100% !important;
      max-height: none !important;
      overflow: visible !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      padding: 0 !important;
    }

    /* 隱藏控制按鈕和螢幕版本 */
    .print-controls,
    .screen-only {
      display: none !important;
    }

    /* 顯示列印版本 */
    .print-only {
      display: table !important;
      visibility: visible !important;
      width: 100% !important;
    }

    .print-only * {
      visibility: visible !important;
    }

    .print-only thead {
      display: table-header-group;
    }

    .print-only tfoot {
      display: table-footer-group;
    }

    .print-only tbody {
      display: table-row-group;
    }

    .print-only tbody > tr > td {
      vertical-align: top;
    }

    /* 內容區域 */
    #print-content {
      padding: 0 !important;
      width: 100% !important;
    }

    /* 頁面設定 */
    @page {
      size: A4;
      margin: 10mm 12mm 10mm 10mm;
    }

    /* 表格設定 */
    table {
      max-width: 100% !important;
      table-layout: fixed !important;
    }

    td, th {
      word-break: break-word;
      overflow-wrap: break-word;
    }
  }
`

interface PrintableWrapperProps {
  isOpen: boolean
  onClose: () => void
  onPrint: () => void
  title: string
  subtitle?: string
  children: ReactNode
}

export const PrintableWrapper: React.FC<PrintableWrapperProps> = ({
  isOpen,
  onClose,
  onPrint,
  title,
  subtitle = 'QUOTATION',
  children,
}) => {
  const [isMounted, setIsMounted] = useState(false)
  const logoUrl = usePrintLogo(isOpen)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // ESC 鍵關閉
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !isMounted) return null

  return createPortal(
    /* eslint-disable venturo/no-custom-modal -- 列印預覽需要使用 createPortal */
    <div
      className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-8"
      onClick={onClose}
      id="print-overlay"
    >
      <style>{PRINT_CSS}</style>

      <div
        className="bg-card rounded-lg max-w-[1000px] w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="print-controls">
          <PrintControls onClose={onClose} onPrint={onPrint} />
        </div>

        <div className="bg-card p-8" id="print-content">
          {/* 列印版本 */}
          <table className="print-only hidden w-full border-collapse">
            <thead>
              <tr>
                <td>
                  <PrintHeader logoUrl={logoUrl} title={title} subtitle={subtitle} />
                </td>
              </tr>
            </thead>

            <tfoot>
              <tr>
                <td>
                  <PrintFooter />
                </td>
              </tr>
            </tfoot>

            <tbody>
              <tr>
                <td>{children}</td>
              </tr>
            </tbody>
          </table>

          {/* 螢幕版本 */}
          <div className="screen-only">
            <PrintHeader logoUrl={logoUrl} title={title} subtitle={subtitle} />
            {children}
            <div className="text-center mt-8 pt-4" style={{ borderTop: '1px solid #F3F4F6' }}>
              <PrintFooter />
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
