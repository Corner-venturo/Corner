import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Database, Trash2 } from 'lucide-react'
import { alert, alertSuccess, alertError } from '@/lib/ui/alert-dialog'
import { logger } from '@/lib/utils/logger'
import { cn } from '@/lib/utils'
import { CacheInfo } from '../types'

interface SystemSettingsProps {
  cacheInfo: CacheInfo | null
  clearingCache: boolean
  setClearingCache: (clearing: boolean) => void
}

export function SystemSettings({ cacheInfo, clearingCache, setClearingCache }: SystemSettingsProps) {
  const handleClearCache = async () => {
    const confirmed = await alert(
      '確定要清除所有本地快取嗎？\n\n' +
        '這會刪除：\n' +
        '• IndexedDB 本地資料庫\n' +
        '• localStorage 儲存的狀態\n' +
        '• sessionStorage 暫存資料\n\n' +
        '清除後系統會重新整理，從 Supabase 載入最新資料。',
      '清除快取確認'
    )

    if (!confirmed) return

    setClearingCache(true)

    try {
      const { DB_NAME } = await import('@/lib/db/schemas')

      // 1. 清除 localStorage
      const localStorageCount = Object.keys(localStorage).length
      localStorage.clear()
      logger.log(`✅ localStorage 已清除 (${localStorageCount} 項)`)

      // 2. 清除 sessionStorage
      sessionStorage.clear()
      logger.log('✅ sessionStorage 已清除')

      // 3. 清除 IndexedDB
      await new Promise<void>((resolve, reject) => {
        const deleteRequest = indexedDB.deleteDatabase(DB_NAME)

        deleteRequest.onsuccess = () => {
          logger.log('✅ IndexedDB 已刪除')
          resolve()
        }

        deleteRequest.onerror = () => {
          logger.error('❌ IndexedDB 刪除失敗:', deleteRequest.error)
          reject(deleteRequest.error)
        }

        deleteRequest.onblocked = () => {
          logger.warn('⚠️ IndexedDB 被阻擋（可能有其他分頁開啟）')
          reject(new Error('Database blocked'))
        }
      })

      await alertSuccess('快取已成功清除！\n頁面即將重新載入...', '清除成功')

      // 延遲重新載入，讓使用者看到成功訊息
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (error) {
      logger.error('清除快取失敗:', error)
      await alertError(
        error instanceof Error && error.message === 'Database blocked'
          ? '無法清除快取：請關閉所有 Venturo 分頁後再試'
          : '清除快取失敗，請稍後再試'
      )
      setClearingCache(false)
    }
  }

  return (
    <Card className="rounded-xl shadow-lg border border-border p-8">
      <div className="flex items-center gap-3 mb-6">
        <Database className="h-6 w-6 text-morandi-gold" />
        <h2 className="text-xl font-semibold">系統維護</h2>
      </div>

      <div className="space-y-6">
        {/* 清除快取 */}
        <div className="p-6 border border-border rounded-lg bg-card">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Trash2 className="h-5 w-5 text-morandi-gold" />
                <h3 className="font-medium">清除本地快取</h3>
              </div>
              <p className="text-sm text-morandi-secondary mb-3">
                清除所有本地儲存的資料，包括 IndexedDB、localStorage 和 sessionStorage。
                清除後會從 Supabase 重新載入最新資料。
              </p>

              {/* 快取狀態顯示 */}
              {cacheInfo && (
                <div className="mt-3 p-3 bg-morandi-container/20 rounded-lg text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className={cn(
                        'w-2 h-2 rounded-full',
                        cacheInfo.dbExists ? 'bg-green-500' : 'bg-gray-400'
                      )}
                    />
                    <span className="font-medium">
                      資料庫狀態：{cacheInfo.dbExists ? '已建立' : '未建立'}
                    </span>
                  </div>
                  {cacheInfo.dbExists && (
                    <div className="text-morandi-secondary ml-4">
                      本地資料表：{cacheInfo.tableCount} 個
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
                  清除中...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  清除快取
                </span>
              )}
            </Button>
          </div>

          {/* 警告提示 */}
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-xs text-yellow-800 dark:text-yellow-200">
              <strong>⚠️ 注意：</strong>
              清除快取會刪除所有本地儲存的資料，但不會影響 Supabase 雲端資料庫。
              如果遇到資料同步問題或顯示異常時，可以使用此功能重置本地快取。
            </p>
          </div>

          {/* 使用時機說明 */}
          <div className="mt-3 text-xs text-morandi-muted">
            <p className="font-medium mb-1">📝 建議使用時機：</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>資料顯示異常或不正確</li>
              <li>系統更新後需要重新初始化</li>
              <li>遇到資料同步問題</li>
              <li>本地快取損壞或過期</li>
            </ul>
          </div>
        </div>
      </div>
    </Card>
  )
}
