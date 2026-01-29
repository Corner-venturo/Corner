'use client'

import { useEffect, useRef, useCallback } from 'react'
import { logger } from '@/lib/utils/logger'
import { createUniver, LocaleType, merge } from '@univerjs/presets'
import { UniverSheetsCorePreset } from '@univerjs/presets/preset-sheets-core'
import PresetSheetsZhTW from '@univerjs/presets/preset-sheets-core/locales/zh-TW'
import type { Univer, IWorkbookData } from '@univerjs/core'
import type { FUniver } from '@univerjs/core/facade'
import { UniverBackToListPlugin } from '../plugins/back-to-list-plugin'
import { UniverFileOperationsPlugin, setFileOperationCallbacks, clearFileOperationCallbacks } from '../plugins/file-operations-plugin'

// CSS
import '@univerjs/presets/lib/styles/preset-sheets-core.css'

// 儲存狀態
export type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'idle'

interface UniverSpreadsheetProps {
  className?: string
  documentId?: string | null
  documentName?: string
  initialData?: IWorkbookData | null
  autoSave?: boolean
  autoSaveDelay?: number // 毫秒，預設 2000
  onSave?: (data: IWorkbookData) => void | Promise<void>
  onSaveAs?: (data: IWorkbookData) => void
  onExportExcel?: (data: IWorkbookData) => void
  onSaveStatusChange?: (status: SaveStatus) => void
}

export function UniverSpreadsheet({
  className,
  documentId,
  documentName,
  initialData,
  autoSave = true,
  autoSaveDelay = 2000,
  onSave,
  onSaveAs,
  onExportExcel,
  onSaveStatusChange,
}: UniverSpreadsheetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const univerRef = useRef<{ univer: Univer; univerAPI: FUniver } | null>(null)
  const mountedRef = useRef(false)
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedDataRef = useRef<string>('')

  // 取得當前 workbook 資料
  const getWorkbookData = useCallback((): IWorkbookData | null => {
    if (!univerRef.current) return null

    try {
      const workbook = univerRef.current.univerAPI.getActiveWorkbook()
      if (!workbook) return null

      // 使用 save 取得完整資料
      const snapshot = workbook.save()
      return snapshot as IWorkbookData
    } catch (error) {
      logger.error('取得 workbook 資料失敗:', error)
      return null
    }
  }, [])

  // 自動儲存邏輯
  const triggerAutoSave = useCallback(() => {
    if (!autoSave || !onSave) return

    // 清除之前的 timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }

    // 標記為未儲存
    onSaveStatusChange?.('unsaved')

    // 設定新的 timer
    autoSaveTimerRef.current = setTimeout(async () => {
      const data = getWorkbookData()
      if (!data) return

      // 檢查資料是否有變化
      const dataStr = JSON.stringify(data)
      if (dataStr === lastSavedDataRef.current) {
        onSaveStatusChange?.('saved')
        return
      }

      try {
        onSaveStatusChange?.('saving')
        await onSave(data)
        lastSavedDataRef.current = dataStr
        onSaveStatusChange?.('saved')
      } catch (error) {
        logger.error('自動儲存失敗:', error)
        onSaveStatusChange?.('unsaved')
      }
    }, autoSaveDelay)
  }, [autoSave, autoSaveDelay, getWorkbookData, onSave, onSaveStatusChange])

  // 設定回調函數
  useEffect(() => {
    setFileOperationCallbacks({
      onSave: async () => {
        const data = getWorkbookData()
        if (data && onSave) {
          onSaveStatusChange?.('saving')
          try {
            await onSave(data)
            lastSavedDataRef.current = JSON.stringify(data)
            onSaveStatusChange?.('saved')
          } catch {
            onSaveStatusChange?.('unsaved')
          }
        }
      },
      onSaveAs: () => {
        const data = getWorkbookData()
        if (data && onSaveAs) {
          onSaveAs(data)
        }
      },
      onExportExcel: () => {
        const data = getWorkbookData()
        if (data && onExportExcel) {
          onExportExcel(data)
        }
      },
    })

    return () => {
      clearFileOperationCallbacks()
    }
  }, [getWorkbookData, onSave, onSaveAs, onExportExcel, onSaveStatusChange])

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
        })

        univerRef.current = { univer, univerAPI }

        // 如果有初始資料，載入它；否則建立空白試算表
        if (initialData) {
          univerAPI.createWorkbook(initialData)
          // 記錄初始資料用於比較
          lastSavedDataRef.current = JSON.stringify(initialData)
        } else {
          univerAPI.createWorkbook({
            name: documentName || '未命名試算表',
          })
        }

        // 註冊 plugins
        univer.registerPlugin(UniverBackToListPlugin)
        univer.registerPlugin(UniverFileOperationsPlugin)

        // 監聽命令執行，觸發自動儲存
        if (autoSave) {
          univerAPI.onCommandExecuted((command) => {
            // 過濾掉不需要觸發儲存的命令（如選取、滾動等）
            const skipCommands = [
              'sheet.operation.set-selections',
              'sheet.operation.scroll',
              'doc.operation.set-selections',
            ]
            if (!skipCommands.some(skip => command.id.includes(skip))) {
              triggerAutoSave()
            }
          })
        }

      } catch (error) {
        logger.error('Univer Spreadsheet 初始化失敗:', error)
      }
    }, 100)

    return () => {
      mountedRef.current = false
      clearTimeout(timer)
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
      // 延遲 dispose 避免 React 渲染衝突
      const univerInstance = univerRef.current
      univerRef.current = null
      if (univerInstance) {
        setTimeout(() => {
          try {
            univerInstance.univer.dispose()
          } catch {
            // 忽略卸載錯誤
          }
        }, 0)
      }
    }
  }, [initialData, documentName, autoSave, triggerAutoSave])

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: '100%', height: '100%' }}
    />
  )
}
