// src/hooks/useTodos.ts
// Phase 1: 純雲端架構的 Todos Hook (使用 SWR)
// 使用資料存取層 (DAL) 進行資料查詢

import { useEffect } from 'react'
import useSWR, { mutate } from 'swr'
import { supabase } from '@/lib/supabase/client'
import { getAllTodos } from '@/lib/data/todos'
import type { Todo } from '@/stores/types'
import { logger } from '@/lib/utils/logger'

// SWR key
const TODOS_KEY = 'todos'

/**
 * 生成 UUID（相容不支援 crypto.randomUUID 的瀏覽器）
 */
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c =>
      (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16)
    )
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

/**
 * 取得當前使用者的 workspace_id
 * 從 localStorage 讀取 auth-store 的值
 */
function getCurrentWorkspaceId(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const authData = localStorage.getItem('auth-storage')
    if (authData) {
      const parsed = JSON.parse(authData)
      return parsed?.state?.user?.workspace_id || null
    }
  } catch {
    // 忽略解析錯誤
  }
  return null
}

// ===== 主要 Hook =====
export function useTodos() {
  // 使用 DAL 的 getAllTodos 作為 SWR fetcher
  const { data: todos = [], error, isLoading, isValidating } = useSWR<Todo[]>(
    TODOS_KEY,
    getAllTodos,
    {
      revalidateOnFocus: true,     // 視窗切回來時重新驗證
      revalidateOnReconnect: true, // 網路恢復時重新驗證
      dedupingInterval: 5000,      // 5秒內不重複請求
    }
  )

  // Realtime 訂閱：當其他人新增/修改/刪除待辦時，自動更新
  useEffect(() => {
    const channel = supabase
      .channel('todos_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'todos' },
        (payload) => {
          logger.log('[Todos] Realtime 收到更新:', payload.eventType)
          // 重新抓取資料
          mutate(TODOS_KEY)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // 新增待辦
  const create = async (todoData: Omit<Todo, 'id' | 'created_at' | 'updated_at'>) => {
    // 驗證必填欄位
    if (!todoData.creator) {
      throw new Error('新增待辦事項需要 creator 欄位')
    }

    const now = new Date().toISOString()

    // 自動注入 workspace_id（如果未提供）
    const workspace_id = (todoData as { workspace_id?: string }).workspace_id || getCurrentWorkspaceId()

    const newTodo = {
      ...todoData,
      id: generateUUID(),
      ...(workspace_id && { workspace_id }),
      created_at: now,
      updated_at: now,
    }

    logger.log('[useTodos] 新增待辦:', { title: newTodo.title, creator: newTodo.creator, workspace_id })

    // 樂觀更新：使用 functional update 避免 stale closure 問題
    mutate(TODOS_KEY, (currentTodos: Todo[] | undefined) => [...(currentTodos || []), newTodo], false)

    try {
       
      const { error } = await supabase.from('todos').insert(newTodo as any)
      if (error) throw error

      // 成功後重新驗證
      mutate(TODOS_KEY)
      return newTodo
    } catch (err) {
      // 失敗時回滾
      logger.error('[useTodos] 新增失敗:', err)
      mutate(TODOS_KEY)
      throw err
    }
  }

  // 更新待辦
  const update = async (id: string, updates: Partial<Todo>) => {
    const updatedTodo = {
      ...updates,
      updated_at: new Date().toISOString(),
    }

    // 樂觀更新：使用 functional update 避免 stale closure 問題
    mutate(
      TODOS_KEY,
      (currentTodos: Todo[] | undefined) => (currentTodos || []).map(t => (t.id === id ? { ...t, ...updatedTodo } : t)),
      false
    )

    try {
      const { error } = await supabase
        .from('todos')
        .update(updatedTodo)
        .eq('id', id)
      if (error) throw error

      mutate(TODOS_KEY)
    } catch (err) {
      mutate(TODOS_KEY)
      throw err
    }
  }

  // 刪除待辦
  const remove = async (id: string) => {
    // 樂觀更新：使用 functional update 避免 stale closure 問題
    mutate(
      TODOS_KEY,
      (currentTodos: Todo[] | undefined) => (currentTodos || []).filter(t => t.id !== id),
      false
    )

    try {
      const { error } = await supabase.from('todos').delete().eq('id', id)
      if (error) throw error

      mutate(TODOS_KEY)
    } catch (err) {
      mutate(TODOS_KEY)
      throw err
    }
  }

  // 重新載入
  const refresh = () => mutate(TODOS_KEY)

  return {
    // 資料
    todos,
    items: todos, // 相容舊 store API

    // 狀態
    isLoading,
    isValidating,
    error,

    // 操作
    create,
    update,
    delete: remove,
    fetchAll: refresh, // 相容舊 store API
  }
}

export default useTodos
