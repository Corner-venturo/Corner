'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ErrorBoundary } from '@/components/error-boundary'
import { AlertCircle, Bomb } from 'lucide-react'

// 故意會出錯的組件
function BrokenComponent() {
  throw new Error('這是一個測試錯誤！')
  return <div>你不應該看到這個</div>
}

// 可控制的錯誤組件
function ConditionalErrorComponent({ shouldError }: { shouldError: boolean }) {
  if (shouldError) {
    throw new Error('條件式錯誤被觸發了！')
  }
  return <div className="text-green-600">✅ 組件運作正常</div>
}

export default function TestErrorPage() {
  const [showBrokenComponent, setShowBrokenComponent] = useState(false)
  const [shouldError, setShouldError] = useState(false)

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <AlertCircle className="h-8 w-8" />
          錯誤邊界測試
        </h1>
        <p className="text-muted-foreground mt-2">測試不同層級的錯誤處理機制</p>
      </div>

      <div className="grid gap-6">
        {/* 測試 1: 頁面級錯誤 */}
        <Card>
          <CardHeader>
            <CardTitle>測試 1: 頁面級錯誤</CardTitle>
            <CardDescription>
              觸發錯誤會導致整個頁面顯示錯誤畫面（error.tsx）
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="destructive"
              onClick={() => {
                throw new Error('頁面級錯誤測試')
              }}
              className="gap-2"
            >
              <Bomb className="h-4 w-4" />
              觸發頁面級錯誤
            </Button>
            <p className="text-sm text-muted-foreground">
              ⚠️ 點擊後會看到 error.tsx 的錯誤畫面
            </p>
          </CardContent>
        </Card>

        {/* 測試 2: 組件級錯誤（有 ErrorBoundary 保護） */}
        <Card>
          <CardHeader>
            <CardTitle>測試 2: 組件級錯誤（有保護）</CardTitle>
            <CardDescription>
              使用 ErrorBoundary 包裝，錯誤只影響該組件
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={() => setShowBrokenComponent(!showBrokenComponent)}>
              {showBrokenComponent ? '隱藏' : '顯示'}錯誤組件
            </Button>

            <div className="border rounded-lg p-4 min-h-[100px]">
              {showBrokenComponent ? (
                <ErrorBoundary>
                  <BrokenComponent />
                </ErrorBoundary>
              ) : (
                <p className="text-muted-foreground">點擊按鈕顯示會出錯的組件</p>
              )}
            </div>

            <p className="text-sm text-muted-foreground">
              ✅ ErrorBoundary 會捕獲錯誤，其他部分仍正常運作
            </p>
          </CardContent>
        </Card>

        {/* 測試 3: 條件式錯誤 */}
        <Card>
          <CardHeader>
            <CardTitle>測試 3: 條件式錯誤</CardTitle>
            <CardDescription>
              根據狀態決定是否觸發錯誤
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={() => setShouldError(false)} variant="outline" size="sm">
                正常模式
              </Button>
              <Button onClick={() => setShouldError(true)} variant="destructive" size="sm">
                錯誤模式
              </Button>
            </div>

            <div className="border rounded-lg p-4 min-h-[60px]">
              <ErrorBoundary>
                <ConditionalErrorComponent shouldError={shouldError} />
              </ErrorBoundary>
            </div>

            <p className="text-sm text-muted-foreground">
              目前狀態: {shouldError ? '❌ 錯誤模式' : '✅ 正常模式'}
            </p>
          </CardContent>
        </Card>

        {/* 測試 4: 非同步錯誤 */}
        <Card>
          <CardHeader>
            <CardTitle>測試 4: 非同步錯誤</CardTitle>
            <CardDescription>測試 Promise 拒絕和非同步錯誤</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="outline"
              onClick={() => {
                Promise.reject(new Error('非同步錯誤測試')).catch((err) => {
                  console.error('捕獲的非同步錯誤:', err)
                  alert('非同步錯誤已被捕獲: ' + err.message)
                })
              }}
            >
              觸發非同步錯誤
            </Button>

            <p className="text-sm text-muted-foreground">
              💡 非同步錯誤需要 try-catch 或 .catch() 處理
            </p>
          </CardContent>
        </Card>

        {/* 說明卡片 */}
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-blue-900 dark:text-blue-100">
              錯誤邊界層級說明
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <div>
              <strong>1. global-error.tsx</strong> - 捕獲根 layout 的錯誤（最外層）
            </div>
            <div>
              <strong>2. error.tsx</strong> - 捕獲頁面層級的錯誤
            </div>
            <div>
              <strong>3. ErrorBoundary 組件</strong> - 保護特定組件或區塊
            </div>
            <div className="mt-4 p-3 bg-white dark:bg-slate-900 rounded border border-blue-300 dark:border-blue-700">
              <strong>最佳實踐：</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>重要功能用 ErrorBoundary 包裝</li>
                <li>關鍵操作加 try-catch</li>
                <li>記錄錯誤到監控服務（Sentry）</li>
                <li>提供友善的錯誤訊息</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
