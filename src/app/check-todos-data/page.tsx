'use client'

import { useEffect, useState } from 'react'
import { localDB } from '@/lib/db'
import { supabase } from '@/lib/supabase/client'
import type { Todo } from '@/stores/types'
import { Button } from '@/components/ui/button'

export default function CheckTodosDataPage() {
  const [indexedDBData, setIndexedDBData] = useState<Todo[]>([])
  const [supabaseData, setSupabaseData] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [syncing, setSyncing] = useState(false)
  const [storageInfo, setStorageInfo] = useState<{
    usage: number
    quota: number
    percentage: number
  } | null>(null)

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString().split('T')[1].split('.')[0]} - ${message}`])
  }

  // 檢查儲存空間
  async function checkStorage() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate()
        const usage = estimate.usage || 0
        const quota = estimate.quota || 0
        const percentage = quota > 0 ? (usage / quota) * 100 : 0

        setStorageInfo({
          usage,
          quota,
          percentage,
        })

        addLog(
          `💾 儲存空間: ${(usage / 1024 / 1024).toFixed(2)} MB / ${(quota / 1024 / 1024).toFixed(2)} MB (${percentage.toFixed(1)}%)`
        )
      } catch (err) {
        addLog(`⚠️ 無法檢查儲存空間: ${err}`)
      }
    } else {
      addLog('⚠️ 瀏覽器不支援 Storage API')
    }
  }

  useEffect(() => {
    checkData()
  }, [])

  async function checkData() {
    try {
      setLoading(true)
      setLogs([])
      setError(null)

      addLog('🔍 開始檢查資料...')

      // 0. 檢查儲存空間
      await checkStorage()

      // 1. 檢查 IndexedDB
      addLog('📦 檢查 IndexedDB...')
      try {
        const idbData = await localDB.getAll('todos')
        setIndexedDBData(idbData as Todo[])
        addLog(`✅ IndexedDB 讀取成功: ${idbData.length} 筆`)
      } catch (idbError) {
        addLog(`❌ IndexedDB 讀取失敗: ${idbError}`)
        throw idbError
      }

      // 2. 檢查 Supabase
      addLog('☁️ 檢查 Supabase...')
      try {
        const { data, error: sbError } = await supabase.from('todos').select('*').order('created_at', { ascending: false })

        if (sbError) {
          addLog(`❌ Supabase 查詢失敗: ${sbError.message}`)
          setError(`Supabase Error: ${sbError.message}`)
        } else {
          setSupabaseData(data || [])
          addLog(`✅ Supabase 讀取成功: ${data?.length || 0} 筆`)
        }
      } catch (sbError) {
        addLog(`❌ Supabase 連線失敗: ${sbError}`)
        throw sbError
      }

      addLog('✅ 檢查完成')
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      addLog(`❌ 檢查失敗: ${errorMsg}`)
      setError(`Error: ${errorMsg}`)
    } finally {
      setLoading(false)
    }
  }

  async function syncFromSupabase() {
    if (supabaseData.length === 0) {
      alert('Supabase 沒有資料可同步')
      return
    }

    try {
      setSyncing(true)
      addLog('🔄 開始同步 Supabase 資料到 IndexedDB...')

      // 批量寫入 IndexedDB
      for (const todo of supabaseData) {
        await localDB.put('todos', todo as any)
      }

      addLog(`✅ 同步完成: ${supabaseData.length} 筆`)

      // 重新檢查
      const idbData = await localDB.getAll('todos')
      setIndexedDBData(idbData as Todo[])
      addLog(`✅ 驗證: IndexedDB 現在有 ${idbData.length} 筆`)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      addLog(`❌ 同步失敗: ${errorMsg}`)
      alert(`同步失敗: ${errorMsg}`)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">檢查待辦事項資料</h1>

      {/* 操作按鈕 */}
      <div className="flex gap-2 mb-4">
        <Button onClick={checkData} disabled={loading}>
          {loading ? '檢查中...' : '🔄 重新檢查'}
        </Button>
        <Button onClick={syncFromSupabase} disabled={syncing || supabaseData.length === 0} variant="default">
          {syncing ? '同步中...' : '📥 從 Supabase 同步到 IndexedDB'}
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* 執行記錄 */}
      {logs.length > 0 && (
        <div className="mb-8 p-4 bg-gray-900 text-gray-100 rounded font-mono text-xs max-h-48 overflow-y-auto">
          {logs.map((log, i) => (
            <div key={i} className="mb-1">
              {log}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-8">
        {/* IndexedDB */}
        <div>
          <h2 className="text-xl font-semibold mb-2">IndexedDB</h2>
          <p className="text-sm text-gray-600 mb-4">共 {indexedDBData.length} 筆資料</p>
          <div className="bg-gray-50 p-4 rounded max-h-96 overflow-y-auto">
            {indexedDBData.length === 0 ? (
              <p className="text-gray-500 text-sm">無資料</p>
            ) : (
              <pre className="text-xs">{JSON.stringify(indexedDBData, null, 2)}</pre>
            )}
          </div>
        </div>

        {/* Supabase */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Supabase</h2>
          <p className="text-sm text-gray-600 mb-4">共 {supabaseData.length} 筆資料</p>
          <div className="bg-gray-50 p-4 rounded max-h-96 overflow-y-auto">
            {supabaseData.length === 0 ? (
              <p className="text-gray-500 text-sm">無資料</p>
            ) : (
              <pre className="text-xs">{JSON.stringify(supabaseData, null, 2)}</pre>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded">
        <h3 className="font-semibold mb-2">診斷資訊</h3>
        <ul className="text-sm space-y-1">
          <li>• IndexedDB 資料數量: {indexedDBData.length}</li>
          <li>• Supabase 資料數量: {supabaseData.length}</li>
          <li>
            • 同步狀態:{' '}
            {indexedDBData.length === supabaseData.length ? (
              <span className="text-green-600">✅ 一致</span>
            ) : (
              <span className="text-red-600">❌ 不一致</span>
            )}
          </li>
        </ul>

        {indexedDBData.length === 0 && supabaseData.length > 0 && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">
              <strong>⚠️ 問題診斷：</strong>
              <br />
              Supabase 有 {supabaseData.length} 筆資料，但 IndexedDB 是空的。
              <br />
              這表示 fetchAll() 沒有正確將資料同步到 IndexedDB。
              <br />
              <br />
              <strong>可能原因：</strong>
              <br />
              1. 瀏覽器儲存空間已滿
              {storageInfo && storageInfo.percentage > 90 && (
                <span className="text-red-600 font-semibold">
                  {' '}
                  ⚠️ 儲存空間使用率 {storageInfo.percentage.toFixed(1)}%，接近上限！
                </span>
              )}
              <br />
              2. IndexedDB 寫入權限被阻擋（私密瀏覽模式、瀏覽器設定）
              <br />
              3. fetchAll() 執行失敗（查看控制台錯誤和上方執行記錄）
              <br />
              4. batchPut() 錯誤被靜默吞掉（已修復）
              <br />
              <br />
              <strong>儲存空間資訊：</strong>
              <br />
              {storageInfo ? (
                <>
                  已使用: {(storageInfo.usage / 1024 / 1024).toFixed(2)} MB / 配額:{' '}
                  {(storageInfo.quota / 1024 / 1024).toFixed(2)} MB ({storageInfo.percentage.toFixed(1)}%)
                </>
              ) : (
                '無法取得儲存空間資訊'
              )}
              <br />
              <br />
              <strong>建議：</strong>點擊上方「從 Supabase 同步到 IndexedDB」按鈕手動同步。
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
