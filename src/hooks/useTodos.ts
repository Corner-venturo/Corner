// src/hooks/useTodos.ts
// Phase 1: 純雲端架構的 Todos Hook (使用 SWR)

import useSWR, { mutate } from 'swr'
import { supabase } from '@/lib/supabase/client'
import type { Todo } from '@/stores/types'

// SWR key
const TODOS_KEY = 'todos'

// Supabase fetcher
async function fetchTodos(): Promise<Todo[]> {
  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (data || []) as Todo[]
}

// ===== 主要 Hook =====
export function useTodos() {
  const { data: todos = [], error, isLoading, isValidating } = useSWR<Todo[]>(
    TODOS_KEY,
    fetchTodos,
    {
      revalidateOnFocus: true,     // 視窗切回來時重新驗證
      revalidateOnReconnect: true, // 網路恢復時重新驗證
      dedupingInterval: 5000,      // 5秒內不重複請求
    }
  )

  // 新增待辦
  const create = async (todoData: Omit<Todo, 'id' | 'created_at' | 'updated_at'>) => {
    const now = new Date().toISOString()
    const newTodo = {
      ...todoData,
      id: crypto.randomUUID(),
      created_at: now,
      updated_at: now,
    }

    // 樂觀更新：先在 UI 顯示
    mutate(TODOS_KEY, [...todos, newTodo], false)

    try {
      const { error } = await supabase.from('todos').insert(newTodo)
      if (error) throw error

      // 成功後重新驗證
      mutate(TODOS_KEY)
      return newTodo
    } catch (err) {
      // 失敗時回滾
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

    // 樂觀更新
    mutate(
      TODOS_KEY,
      todos.map(t => (t.id === id ? { ...t, ...updatedTodo } : t)),
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
    // 樂觀更新
    mutate(
      TODOS_KEY,
      todos.filter(t => t.id !== id),
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
