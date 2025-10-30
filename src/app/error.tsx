'use client'

import { useEffect } from 'react'

export const dynamic = 'force-dynamic'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // 記錄錯誤到錯誤追蹤服務（例如 Sentry）
    console.error('Application Error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full space-y-6 text-center">
        {/* 錯誤圖示 */}
        <div className="flex justify-center">
          <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-6">
            <AlertCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
          </div>
        </div>

        {/* 錯誤標題 */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">發生錯誤</h1>
          <p className="text-muted-foreground">很抱歉，應用程式遇到了一些問題</p>
        </div>

        {/* 錯誤詳情（開發模式） */}
        {process.env.NODE_ENV === 'development' && (
          <div className="rounded-lg bg-card border border-border p-4 text-left">
            <p className="text-sm font-mono text-destructive break-words">{error.message}</p>
            {error.digest && (
              <p className="text-xs text-muted-foreground mt-2">錯誤 ID: {error.digest}</p>
            )}
          </div>
        )}

        {/* 操作按鈕 */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            重試
          </Button>
          <Button variant="outline" onClick={() => (window.location.href = '/')} className="gap-2">
            <Home className="h-4 w-4" />
            返回首頁
          </Button>
        </div>

        {/* 提示訊息 */}
        <p className="text-sm text-muted-foreground">如果問題持續發生，請聯繫技術支援</p>
      </div>
    </div>
  )
}
