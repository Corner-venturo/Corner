'use client'

import { useEffect, useRef } from 'react'
import { createUniver, LocaleType, merge } from '@univerjs/presets'
import { UniverDocsCorePreset } from '@univerjs/presets/preset-docs-core'
import PresetDocsZhTW from '@univerjs/presets/preset-docs-core/locales/zh-TW'
import type { Univer } from '@univerjs/core'
import type { FUniver } from '@univerjs/core/facade'
import { UniverBackToListDocPlugin } from '../plugins/back-to-list-doc-plugin'

// CSS
import '@univerjs/presets/lib/styles/preset-docs-core.css'

interface UniverDocumentProps {
  className?: string
}

export function UniverDocument({ className }: UniverDocumentProps) {
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
            [LocaleType.ZH_TW]: merge({}, PresetDocsZhTW),
          },
          presets: [
            UniverDocsCorePreset({
              container: containerRef.current,
            }),
          ],
          plugins: [
            UniverBackToListDocPlugin,
          ],
        })

        univerRef.current = { univer, univerAPI }

        // 建立空白文件
        univerAPI.createUniverDoc({})
      } catch (error) {
        console.error('Univer Document 初始化失敗:', error)
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
