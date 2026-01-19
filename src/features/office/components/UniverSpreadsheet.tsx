'use client'

import { useEffect, useRef } from 'react'
import { createUniver, LocaleType, merge } from '@univerjs/presets'
import { UniverSheetsCorePreset } from '@univerjs/presets/preset-sheets-core'
import PresetSheetsZhTW from '@univerjs/presets/preset-sheets-core/locales/zh-TW'
import type { Univer } from '@univerjs/core'
import type { FUniver } from '@univerjs/core/facade'
import { UniverBackToListPlugin } from '../plugins/back-to-list-plugin'

// CSS
import '@univerjs/presets/lib/styles/preset-sheets-core.css'

interface UniverSpreadsheetProps {
  className?: string
}

export function UniverSpreadsheet({ className }: UniverSpreadsheetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const univerRef = useRef<{ univer: Univer; univerAPI: FUniver } | null>(null)
  const mountedRef = useRef(false)

  useEffect(() => {
    mountedRef.current = true

    // 延遲初始化，確保 DOM 完全掛載
    const timer = setTimeout(() => {
      if (!containerRef.current || univerRef.current || !mountedRef.current) return

      try {
        // 使用 presets 建立 Univer 實例
        const { univer, univerAPI } = createUniver({
          locale: LocaleType.ZH_TW,
          locales: {
            [LocaleType.ZH_TW]: merge({}, PresetSheetsZhTW),
          },
          presets: [
            UniverSheetsCorePreset({
              container: containerRef.current,
            }),
          ],
          plugins: [
            UniverBackToListPlugin,
          ],
        })

        univerRef.current = { univer, univerAPI }

        // 建立空白試算表
        univerAPI.createWorkbook({
          name: '未命名試算表',
        })
      } catch (error) {
        console.error('Univer Spreadsheet 初始化失敗:', error)
      }
    }, 100)

    return () => {
      mountedRef.current = false
      clearTimeout(timer)
      if (univerRef.current) {
        univerRef.current.univer.dispose()
        univerRef.current = null
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: '100%', height: '100%' }}
    />
  )
}
