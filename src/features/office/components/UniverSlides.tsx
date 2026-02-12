'use client'

import { useEffect, useRef } from 'react'
import { logger } from '@/lib/utils/logger'
import { Univer, LocaleType, UniverInstanceType, merge } from '@univerjs/core'
import { defaultTheme } from '@univerjs/design'
import { UniverRenderEnginePlugin } from '@univerjs/engine-render'
import { UniverUIPlugin } from '@univerjs/ui'
import { UniverSlidesPlugin } from '@univerjs/slides'
import { UniverSlidesUIPlugin } from '@univerjs/slides-ui'
import { UniverBackToListSlidesPlugin } from '../plugins/back-to-list-slides-plugin'

// Locale imports
import DesignZhTW from '@univerjs/design/lib/locale/zh-TW.js'
import UIZhTW from '@univerjs/ui/lib/locale/zh-TW.js'
import { OFFICE_LABELS } from '../constants/labels'

// CSS imports
import '@univerjs/design/lib/index.css'
import '@univerjs/ui/lib/index.css'
import '@univerjs/slides-ui/lib/index.css'

interface UniverSlidesProps {
  className?: string
}

// 建立空白簡報的初始資料結構
function createEmptySlidesData() {
  const pageId = 'slide-page-' + Date.now()
  return {
    id: 'slides-' + Date.now(),
    title: OFFICE_LABELS.未命名簡報,
    pageSize: {
      width: 960,
      height: 540,
    },
    pages: {
      [pageId]: {
        id: pageId,
        pageType: 0, // Normal page
        zIndex: 1,
        title: OFFICE_LABELS.投影片_1,
        description: '',
        pageBackgroundFill: {
          rgb: 'rgb(255, 255, 255)',
        },
        elements: {},
      },
    },
    pageOrder: [pageId],
  }
}

export function UniverSlides({ className }: UniverSlidesProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const univerRef = useRef<Univer | null>(null)
  const mountedRef = useRef(false)

  useEffect(() => {
    mountedRef.current = true

    // 延遲初始化，確保 DOM 完全掛載
    const timer = setTimeout(() => {
      if (!containerRef.current || univerRef.current || !mountedRef.current) return

      try {
        // 建立 Univer 實例（含語言包）
        const univer = new Univer({
          theme: defaultTheme,
          locale: LocaleType.ZH_TW,
          locales: {
            [LocaleType.ZH_TW]: merge(
              {},
              DesignZhTW,
              UIZhTW
            ),
          },
        })

        univerRef.current = univer

        // 註冊核心插件
        univer.registerPlugin(UniverRenderEnginePlugin)
        univer.registerPlugin(UniverUIPlugin, {
          container: containerRef.current,
        })

        // 註冊簡報插件
        univer.registerPlugin(UniverSlidesPlugin)
        univer.registerPlugin(UniverSlidesUIPlugin)

        // 建立空白簡報（需要提供完整的簡報結構）
        univer.createUnit(UniverInstanceType.UNIVER_SLIDE, createEmptySlidesData())

        // 在簡報建立後註冊返回列表 plugin
        univer.registerPlugin(UniverBackToListSlidesPlugin)
      } catch (error) {
        logger.error(OFFICE_LABELS.Univer_Slides_初始化失敗, error)
      }
    }, 100)

    return () => {
      mountedRef.current = false
      clearTimeout(timer)
      if (univerRef.current) {
        univerRef.current.dispose()
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
