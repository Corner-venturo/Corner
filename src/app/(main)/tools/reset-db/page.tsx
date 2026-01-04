'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle2, Database, Trash2, RefreshCw } from 'lucide-react'

export default function ResetDBPage() {
  const [status, setStatus] = useState<'idle' | 'deleting' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const deleteSingleDB = (dbName: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const deleteRequest = indexedDB.deleteDatabase(dbName)

      deleteRequest.onsuccess = () => {
        console.log(`✅ ${dbName} 刪除成功`)
        resolve()
      }

      deleteRequest.onerror = () => {
        console.error(`❌ ${dbName} 刪除失敗:`, deleteRequest.error)
        reject(deleteRequest.error)
      }

      deleteRequest.onblocked = () => {
        console.warn(`⚠️ ${dbName} 被鎖定`)
        reject(new Error(`${dbName} 被其他連線鎖定`))
      }
    })
  }

  const handleReset = async () => {
    try {
      setStatus('deleting')

      // Step 1: 關閉所有現有連線
      setMessage('步驟 1/4: 正在關閉所有資料庫連線...')
      const dbNames = ['VenturoOfflineDB', 'venturo-db']

      for (const dbName of dbNames) {
        try {
          const openRequest = indexedDB.open(dbName)
          await new Promise<void>((resolve) => {
            openRequest.onsuccess = () => {
              const db = openRequest.result
              console.log(`🔌 關閉 ${dbName} 連線...`)
              db.close()
              resolve()
            }
            openRequest.onerror = () => {
              console.log(`⚠️ ${dbName} 沒有連線需要關閉`)
              resolve()
            }
          })
        } catch (e) {
          console.log(`⚠️ 無法關閉 ${dbName} 連線，繼續執行刪除...`)
        }
      }

      // Step 2: 等待連線完全關閉
      setMessage('步驟 2/4: 等待連線完全關閉...')
      await new Promise(resolve => setTimeout(resolve, 500))

      // Step 3: 刪除舊資料庫 (venturo-db)
      setMessage('步驟 3/4: 正在刪除舊資料庫 (venturo-db)...')
      try {
        await Promise.race([
          deleteSingleDB('venturo-db'),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), 5000)
          )
        ])
        console.log('✅ 舊資料庫已刪除')
      } catch (e) {
        console.log('⚠️ 舊資料庫刪除失敗或不存在，繼續...')
      }

      // Step 4: 刪除當前資料庫 (VenturoOfflineDB)
      setMessage('步驟 4/4: 正在刪除當前資料庫 (VenturoOfflineDB)...')

      await Promise.race([
        deleteSingleDB('VenturoOfflineDB'),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 10000)
        )
      ])

      setStatus('success')
      setMessage('✅ 所有資料庫已清空！請點擊下方按鈕重新整理頁面。')

    } catch (error) {
      setStatus('error')
      if (error instanceof Error && error.message === 'timeout') {
        setMessage('⏱️ 清空超時！請嘗試以下步驟：\n1. 完全關閉瀏覽器\n2. 重新開啟瀏覽器\n3. 只開這個頁面再試一次')
      } else if (error instanceof Error && error.message.includes('鎖定')) {
        setMessage('⚠️ 資料庫被鎖定！請完全關閉瀏覽器（包括所有分頁），然後重新開啟再試。')
      } else {
        setMessage('❌ 執行失敗：' + (error as Error).message)
      }
      console.error('❌ 執行失敗：', error)
    }
  }

  const handleReload = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-8">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-6 h-6" />
            IndexedDB 重置工具
          </CardTitle>
          <CardDescription>
            徹底清空本地資料庫，並從 Supabase 重新同步所有資料
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* 說明 */}
          <div className="bg-status-info-bg border border-status-info/30 rounded-lg p-4">
            <div className="flex gap-2">
              <AlertCircle className="h-5 w-5 text-status-info flex-shrink-0 mt-0.5" />
              <div className="text-sm text-morandi-primary">
                <strong>這個工具會：</strong>
                <ol className="list-decimal ml-4 mt-2 space-y-1">
                  <li>刪除本地 IndexedDB 的所有資料</li>
                  <li>重新整理頁面後，系統會自動重建資料庫結構</li>
                  <li>從 Supabase 雲端重新下載所有資料</li>
                </ol>
                <p className="mt-3 text-status-warning font-semibold">
                  ⚠️ 注意：所有未同步到 Supabase 的資料將會遺失！
                </p>
              </div>
            </div>
          </div>

          {/* 當前狀態 */}
          <div className="bg-muted p-4 rounded-lg border border-border">
            <h3 className="font-semibold mb-2">將清空以下資料庫</h3>
            <div className="space-y-1 text-sm">
              <div>
                1. <code className="bg-white px-2 py-1 rounded border">VenturoOfflineDB</code>
                <span className="text-status-success ml-2">✓ 當前使用</span>
              </div>
              <div>
                2. <code className="bg-white px-2 py-1 rounded border">venturo-db</code>
                <span className="text-morandi-secondary ml-2">(舊資料庫)</span>
              </div>
              <div className="mt-2 text-morandi-secondary">
                重建後版本：<code className="bg-white px-2 py-1 rounded border">v6 (46 個表格)</code>
              </div>
            </div>
          </div>

          {/* 狀態訊息 */}
          {status !== 'idle' && (
            <div className={`p-4 rounded-lg border ${
              status === 'success'
                ? 'bg-status-success-bg border-status-success/30 text-status-success'
                : status === 'error'
                ? 'bg-status-danger-bg border-status-danger/30 text-status-danger'
                : 'bg-status-info-bg border-status-info/30 text-status-info'
            }`}>
              <div className="flex gap-2">
                {status === 'success' ? (
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                )}
                <div className="text-sm font-medium">{message}</div>
              </div>
            </div>
          )}

          {/* 操作按鈕 */}
          <div className="flex gap-3">
            {status === 'success' ? (
              <Button onClick={handleReload} className="w-full gap-2" size="lg">
                <RefreshCw size={16} />
                重新整理頁面
              </Button>
            ) : (
              <Button
                onClick={handleReset}
                variant="destructive"
                className="w-full"
                size="lg"
                disabled={status === 'deleting'}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {status === 'deleting' ? '清空中...' : '清空 IndexedDB'}
              </Button>
            )}
          </div>

          {/* 技術說明 */}
          <details className="text-sm text-morandi-secondary border-t pt-4">
            <summary className="cursor-pointer font-semibold hover:text-foreground">
              為什麼需要這個工具？
            </summary>
            <div className="mt-2 space-y-2 pl-4">
              <p>
                <strong>問題：</strong>當 IndexedDB 的表格結構與代碼定義不一致時，
                可能導致資料讀取失敗（例如「目前沒有資料」但 Supabase 有資料）。
              </p>
              <p>
                <strong>原因：</strong>資料庫版本升級機制只會新增缺少的表格，
                但如果舊表格的索引結構已經改變，就會出現不一致。
              </p>
              <p>
                <strong>解決方案：</strong>完全刪除舊資料庫 → 重建全新的 v6 版本 →
                確保所有 46 個表格結構都正確。
              </p>
            </div>
          </details>
        </CardContent>
      </Card>
    </div>
  )
}
