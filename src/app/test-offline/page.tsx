'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getOfflineManager } from '@/lib/offline/offline-manager'
import { getSyncEngine, SyncStatus } from '@/lib/offline/sync-engine'
import { Database, CheckCircle, XCircle, Loader2, Trash2, RefreshCw } from 'lucide-react'

interface TestResult {
  name: string
  status: 'pending' | 'success' | 'error'
  message?: string
  duration?: number
}

export default function TestOfflinePage() {
  const [results, setResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [stats, setStats] = useState<any>(null)
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)
  const [offlineManager, setOfflineManager] = useState<any>(null)
  const [syncEngine, setSyncEngine] = useState<any>(null)

  useEffect(() => {
    // 只在客戶端初始化 OfflineManager 和 SyncEngine
    if (typeof window !== 'undefined') {
      setOfflineManager(getOfflineManager())
      setSyncEngine(getSyncEngine())
    }
  }, [])

  const updateResult = (name: string, status: TestResult['status'], message?: string, duration?: number) => {
    setResults(prev => {
      const existing = prev.find(r => r.name === name)
      if (existing) {
        return prev.map(r => r.name === name ? { ...r, status, message, duration } : r)
      }
      return [...prev, { name, status, message, duration }]
    })
  }

  const runTests = async () => {
    if (!offlineManager) {
      alert('OfflineManager 尚未初始化')
      return
    }

    setIsRunning(true)
    setResults([])

    try {
      // Test 1: 建立資料
      updateResult('建立 Tour 資料', 'pending')
      const startCreate = Date.now()
      const tour = await offlineManager.create('tours', {
        code: 'TEST001',
        name: '測試行程',
        destination: '台北',
        startDate: '2025-01-10',
        endDate: '2025-01-15',
        days: 5,
        nights: 4,
        adultCount: 10,
        childCount: 2,
        infantCount: 0,
        status: 'planning',
        totalCost: 50000,
        totalRevenue: 80000,
        profitMargin: 30000
      })
      updateResult('建立 Tour 資料', 'success', `ID: ${tour.id}`, Date.now() - startCreate)

      // Test 2: 讀取資料
      updateResult('讀取 Tour 資料', 'pending')
      const startRead = Date.now()
      const readTour = await offlineManager.get('tours', tour.id)
      if (readTour && readTour.id === tour.id) {
        updateResult('讀取 Tour 資料', 'success', `名稱: ${readTour.name}`, Date.now() - startRead)
      } else {
        updateResult('讀取 Tour 資料', 'error', '資料不符')
      }

      // Test 3: 更新資料
      updateResult('更新 Tour 資料', 'pending')
      const startUpdate = Date.now()
      const updatedTour = await offlineManager.update('tours', tour.id, {
        name: '測試行程 (已更新)',
        adultCount: 15
      })
      if (updatedTour.name === '測試行程 (已更新)' && updatedTour.adultCount === 15) {
        updateResult('更新 Tour 資料', 'success', `版本: ${updatedTour.version}`, Date.now() - startUpdate)
      } else {
        updateResult('更新 Tour 資料', 'error', '更新失敗')
      }

      // Test 4: 查詢所有資料
      updateResult('查詢所有 Tours', 'pending')
      const startGetAll = Date.now()
      const allTours = await offlineManager.getAll('tours')
      updateResult('查詢所有 Tours', 'success', `共 ${allTours.length} 筆`, Date.now() - startGetAll)

      // Test 5: 使用索引查詢
      updateResult('索引查詢 (status)', 'pending')
      const startIndex = Date.now()
      const planningTours = await offlineManager.getByIndex('tours', 'status', 'planning')
      updateResult('索引查詢 (status)', 'success', `找到 ${planningTours.length} 筆`, Date.now() - startIndex)

      // Test 6: 檢查同步佇列
      updateResult('檢查同步佇列', 'pending')
      const startSync = Date.now()
      const pendingSync = await offlineManager.getPendingSyncItems()
      updateResult('檢查同步佇列', 'success', `待同步: ${pendingSync.length} 筆`, Date.now() - startSync)

      // Test 7: 刪除資料
      updateResult('刪除 Tour 資料', 'pending')
      const startDelete = Date.now()
      await offlineManager.delete('tours', tour.id)
      const deletedTour = await offlineManager.get('tours', tour.id)
      if (!deletedTour) {
        updateResult('刪除 Tour 資料', 'success', '已成功刪除', Date.now() - startDelete)
      } else {
        updateResult('刪除 Tour 資料', 'error', '刪除失敗')
      }

      // Test 8: 批次建立
      updateResult('批次建立 3 筆資料', 'pending')
      const startBatch = Date.now()
      const batchData = await offlineManager.createBatch('tours', [
        { code: 'BATCH001', name: '批次測試1', destination: '台北', startDate: '2025-02-01', endDate: '2025-02-05', days: 4, nights: 3, adultCount: 10, childCount: 0, infantCount: 0, status: 'planning', totalCost: 40000, totalRevenue: 60000, profitMargin: 20000 },
        { code: 'BATCH002', name: '批次測試2', destination: '台中', startDate: '2025-03-01', endDate: '2025-03-05', days: 4, nights: 3, adultCount: 8, childCount: 2, infantCount: 0, status: 'planning', totalCost: 35000, totalRevenue: 55000, profitMargin: 20000 },
        { code: 'BATCH003', name: '批次測試3', destination: '高雄', startDate: '2025-04-01', endDate: '2025-04-05', days: 4, nights: 3, adultCount: 12, childCount: 1, infantCount: 0, status: 'planning', totalCost: 45000, totalRevenue: 70000, profitMargin: 25000 }
      ])
      updateResult('批次建立 3 筆資料', 'success', `建立了 ${batchData.length} 筆`, Date.now() - startBatch)

      // 更新統計資料
      const newStats = await offlineManager.getStats()
      setStats(newStats)

    } catch (error) {
      console.error('測試失敗:', error)
      updateResult('測試執行', 'error', error instanceof Error ? error.message : '未知錯誤')
    } finally {
      setIsRunning(false)
    }
  }

  const clearAllData = async () => {
    if (!offlineManager) return
    if (!confirm('確定要清空所有測試資料嗎？')) return

    try {
      await offlineManager.clear('tours')
      await offlineManager.clearCompletedSync()
      const newStats = await offlineManager.getStats()
      setStats(newStats)
      setResults([])
      alert('已清空所有測試資料')
    } catch (error) {
      alert('清空失敗: ' + (error instanceof Error ? error.message : '未知錯誤'))
    }
  }

  const handleSync = async () => {
    if (!syncEngine) {
      alert('SyncEngine 尚未初始化')
      return
    }

    setIsSyncing(true)
    try {
      const status = await syncEngine.manualSync()
      setSyncStatus(status)

      // 更新統計資料
      if (offlineManager) {
        const newStats = await offlineManager.getStats()
        setStats(newStats)
      }

      if (status.completedCount > 0) {
        alert(`✅ 同步完成：${status.completedCount} 筆成功`)
      } else if (status.pendingCount === 0) {
        alert('✅ 沒有待同步項目')
      }
    } catch (error) {
      alert('同步失敗: ' + (error instanceof Error ? error.message : '未知錯誤'))
    } finally {
      setIsSyncing(false)
    }
  }

  useEffect(() => {
    // 載入初始統計資料和同步狀態
    if (offlineManager) {
      offlineManager.getStats().then(setStats)
    }
    if (syncEngine) {
      syncEngine.getStatus().then(setSyncStatus)
    }
  }, [offlineManager, syncEngine])

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Database className="h-8 w-8" />
          離線架構測試
        </h1>
        <p className="text-muted-foreground mt-2">
          測試 OfflineManager 的 CRUD 操作、索引查詢、同步佇列等功能
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>資料統計</CardTitle>
            <CardDescription>IndexedDB 儲存狀態</CardDescription>
          </CardHeader>
          <CardContent>
            {stats ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tours:</span>
                  <span className="font-mono">{stats.tours || 0} 筆</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Orders:</span>
                  <span className="font-mono">{stats.orders || 0} 筆</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Quotes:</span>
                  <span className="font-mono">{stats.quotes || 0} 筆</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-muted-foreground">待同步:</span>
                  <span className="font-mono font-semibold">{stats.pendingSync || 0} 筆</span>
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground">載入中...</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>測試控制</CardTitle>
            <CardDescription>執行測試或清空資料</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={runTests}
              disabled={isRunning}
              className="w-full"
              size="lg"
            >
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  測試執行中...
                </>
              ) : (
                '開始測試'
              )}
            </Button>
            <Button
              onClick={handleSync}
              disabled={isSyncing}
              variant="outline"
              className="w-full"
              size="lg"
            >
              {isSyncing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  同步中...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  手動同步
                </>
              )}
            </Button>
            <Button
              onClick={clearAllData}
              variant="destructive"
              className="w-full"
              size="lg"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              清空所有資料
            </Button>
          </CardContent>
        </Card>
      </div>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>測試結果</CardTitle>
            <CardDescription>共 {results.length} 個測試項目</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {results.map((result, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {result.status === 'pending' && (
                      <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                    )}
                    {result.status === 'success' && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                    {result.status === 'error' && (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <div>
                      <div className="font-medium">{result.name}</div>
                      {result.message && (
                        <div className="text-sm text-muted-foreground">{result.message}</div>
                      )}
                    </div>
                  </div>
                  {result.duration !== undefined && (
                    <div className="text-sm text-muted-foreground font-mono">
                      {result.duration}ms
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
