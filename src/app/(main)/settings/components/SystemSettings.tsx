import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Database, Trash2 } from 'lucide-react'
import { confirm, alertSuccess, alertError } from '@/lib/ui/alert-dialog'
import { logger } from '@/lib/utils/logger'
import { cn } from '@/lib/utils'
import { CacheInfo } from '../types'
import { LABELS } from '../constants/labels'

interface SystemSettingsProps {
  cacheInfo: CacheInfo | null
  clearingCache: boolean
  setClearingCache: (clearing: boolean) => void
}

export function SystemSettings({
  cacheInfo,
  clearingCache,
  setClearingCache,
}: SystemSettingsProps) {
  const handleClearCache = async () => {
    const confirmed = await confirm(
      LABELS.CLEAR_CACHE_CONFIRM_MSG,
      {
        type: 'warning',
        title: LABELS.CLEAR_CACHE_CONFIRM_TITLE,
      }
    )

    if (!confirmed) return

    setClearingCache(true)

    try {
      const DB_NAME = 'venturo-erp-db'

      // 1. 清除 localStorage
      const localStorageCount = Object.keys(localStorage).length
      localStorage.clear()
      logger.log(`✅ localStorage cleared (${localStorageCount} items)`)

      // 2. 清除 sessionStorage
      sessionStorage.clear()
      logger.log('✅ sessionStorage cleared')

      // 3. 清除 IndexedDB
      await new Promise<void>((resolve, reject) => {
        const deleteRequest = indexedDB.deleteDatabase(DB_NAME)

        deleteRequest.onsuccess = () => {
          logger.log('✅ IndexedDB deleted')
          resolve()
        }

        deleteRequest.onerror = () => {
          logger.error('❌ IndexedDB delete failed:', deleteRequest.error)
          reject(deleteRequest.error)
        }

        deleteRequest.onblocked = () => {
          logger.warn('⚠️ IndexedDB blocked (other tabs may be open)')
          reject(new Error('Database blocked'))
        }
      })

      await alertSuccess(LABELS.CLEAR_CACHE_SUCCESS, LABELS.CLEAR_CACHE_SUCCESS_TITLE)

      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (error) {
      logger.error('Clear cache failed:', error)
      await alertError(
        error instanceof Error && error.message === 'Database blocked'
          ? LABELS.CLEAR_CACHE_BLOCKED
          : LABELS.CLEAR_CACHE_FAILED
      )
      setClearingCache(false)
    }
  }

  return (
    <Card className="rounded-xl shadow-lg border border-border p-8">
      <div className="flex items-center gap-3 mb-6">
        <Database className="h-6 w-6 text-morandi-gold" />
        <h2 className="text-xl font-semibold">{LABELS.SYSTEM_MAINTENANCE}</h2>
      </div>

      <div className="space-y-6">
        <div className="p-6 border border-border rounded-lg bg-card">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Trash2 className="h-5 w-5 text-morandi-gold" />
                <h3 className="font-medium">{LABELS.CLEAR_LOCAL_CACHE}</h3>
              </div>
              <p className="text-sm text-morandi-secondary mb-3">
                {LABELS.CLEAR_CACHE_DESC}
              </p>

              {cacheInfo && (
                <div className="mt-3 p-3 bg-morandi-container/20 rounded-lg text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className={cn(
                        'w-2 h-2 rounded-full',
                        cacheInfo.dbExists ? 'bg-morandi-gold' : 'bg-morandi-secondary/50'
                      )}
                    />
                    <span className="font-medium">
                      {LABELS.DB_STATUS}：{cacheInfo.dbExists ? LABELS.DB_CREATED : LABELS.DB_NOT_CREATED}
                    </span>
                  </div>
                  {cacheInfo.dbExists && (
                    <div className="text-morandi-secondary ml-4">
                      {LABELS.LOCAL_TABLES}：{cacheInfo.tableCount} {LABELS.LOCAL_TABLES_UNIT}
                    </div>
                  )}
                </div>
              )}
            </div>

            <Button
              variant="outline"
              onClick={handleClearCache}
              disabled={clearingCache || !cacheInfo?.dbExists}
              className="ml-4 border-morandi-red text-morandi-red hover:bg-morandi-red hover:text-white"
            >
              {clearingCache ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span>
                  {LABELS.CLEARING}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  {LABELS.CLEAR_CACHE_BTN}
                </span>
              )}
            </Button>
          </div>

          <div className="mt-4 p-3 bg-morandi-gold/5 dark:bg-morandi-gold/20 border border-morandi-gold/20 dark:border-morandi-gold/40 rounded-lg">
            <p className="text-xs text-morandi-gold dark:text-morandi-gold/80">
              <strong>⚠️ </strong>
              {LABELS.CLEAR_CACHE_WARNING}
            </p>
          </div>

          <div className="mt-3 text-xs text-morandi-muted">
            <p className="font-medium mb-1">{LABELS.CLEAR_CACHE_TIMING_TITLE}</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>{LABELS.CLEAR_CACHE_TIMING_1}</li>
              <li>{LABELS.CLEAR_CACHE_TIMING_2}</li>
              <li>{LABELS.CLEAR_CACHE_TIMING_3}</li>
              <li>{LABELS.CLEAR_CACHE_TIMING_4}</li>
            </ul>
          </div>
        </div>
      </div>
    </Card>
  )
}
