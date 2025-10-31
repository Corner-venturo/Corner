'use client'

import { useEffect, useState } from 'react'
import { localDB } from '@/lib/db'
import type { Todo } from '@/stores/types'

export default function CheckTodosDataPage() {
  const [indexedDBData, setIndexedDBData] = useState<Todo[]>([])
  const [supabaseData, setSupabaseData] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function checkData() {
      try {
        setLoading(true)

        // 1. 檢查 IndexedDB
        const idbData = await localDB.getAll('todos')
        setIndexedDBData(idbData as Todo[])

        // 2. 檢查 Supabase
        const { createClient } = await import('@supabase/supabase-js')
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL || '',
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
        )

        const { data, error: sbError } = await supabase.from('todos').select('*').order('created_at', { ascending: false })

        if (sbError) {
          setError(`Supabase Error: ${sbError.message}`)
        } else {
          setSupabaseData(data || [])
        }
      } catch (err) {
        setError(`Error: ${err}`)
      } finally {
        setLoading(false)
      }
    }

    checkData()
  }, [])

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">檢查待辦事項資料</h1>
        <p>載入中...</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">檢查待辦事項資料</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-8">
        {/* IndexedDB */}
        <div>
          <h2 className="text-xl font-semibold mb-2">IndexedDB</h2>
          <p className="text-sm text-gray-600 mb-4">共 {indexedDBData.length} 筆資料</p>
          <div className="bg-gray-50 p-4 rounded max-h-96 overflow-y-auto">
            <pre className="text-xs">{JSON.stringify(indexedDBData, null, 2)}</pre>
          </div>
        </div>

        {/* Supabase */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Supabase</h2>
          <p className="text-sm text-gray-600 mb-4">共 {supabaseData.length} 筆資料</p>
          <div className="bg-gray-50 p-4 rounded max-h-96 overflow-y-auto">
            <pre className="text-xs">{JSON.stringify(supabaseData, null, 2)}</pre>
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
      </div>
    </div>
  )
}
