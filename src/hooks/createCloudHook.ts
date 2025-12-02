// src/hooks/createCloudHook.ts
// 通用 SWR Hook 工廠函數 - 純雲端架構

import useSWR, { mutate } from 'swr'
import { supabase } from '@/lib/supabase/client'

// 基礎實體型別
interface BaseEntity {
  id: string
  created_at: string
  updated_at: string
}

// Hook 回傳型別
interface CloudHookReturn<T extends BaseEntity> {
  items: T[]
  isLoading: boolean
  isValidating: boolean
  error: Error | undefined
  create: (data: Omit<T, 'id' | 'created_at' | 'updated_at'>) => Promise<T>
  update: (id: string, updates: Partial<T>) => Promise<void>
  delete: (id: string) => Promise<void>
  fetchAll: () => void
  getById: (id: string) => T | undefined
}

// 建立雲端 Hook 的工廠函數
export function createCloudHook<T extends BaseEntity>(
  tableName: string,
  options?: {
    orderBy?: { column: string; ascending?: boolean }
    select?: string
  }
) {
  const SWR_KEY = tableName

  // Supabase fetcher
  async function fetcher(): Promise<T[]> {
    let query = supabase
      .from(tableName)
      .select(options?.select || '*')

    if (options?.orderBy) {
      query = query.order(options.orderBy.column, {
        ascending: options.orderBy.ascending ?? false,
      })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    const { data, error } = await query

    if (error) {
      throw new Error(error.message)
    }

    return (data || []) as T[]
  }

  // 回傳 Hook 函數
  return function useCloudData(): CloudHookReturn<T> {
    const { data: items = [], error, isLoading, isValidating } = useSWR<T[]>(
      SWR_KEY,
      fetcher,
      {
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
        dedupingInterval: 5000,
      }
    )

    // 新增
    const create = async (data: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T> => {
      const now = new Date().toISOString()
      const newItem = {
        ...data,
        id: crypto.randomUUID(),
        created_at: now,
        updated_at: now,
      } as T

      // 樂觀更新
      mutate(SWR_KEY, [...items, newItem], false)

      try {
        const { error } = await supabase.from(tableName).insert(newItem)
        if (error) throw error

        mutate(SWR_KEY)
        return newItem
      } catch (err) {
        mutate(SWR_KEY)
        throw err
      }
    }

    // 更新
    const update = async (id: string, updates: Partial<T>): Promise<void> => {
      const updatedData = {
        ...updates,
        updated_at: new Date().toISOString(),
      }

      // 樂觀更新
      mutate(
        SWR_KEY,
        items.map(item => (item.id === id ? { ...item, ...updatedData } : item)),
        false
      )

      try {
        const { error } = await supabase
          .from(tableName)
          .update(updatedData)
          .eq('id', id)
        if (error) throw error

        mutate(SWR_KEY)
      } catch (err) {
        mutate(SWR_KEY)
        throw err
      }
    }

    // 刪除
    const remove = async (id: string): Promise<void> => {
      // 樂觀更新
      mutate(
        SWR_KEY,
        items.filter(item => item.id !== id),
        false
      )

      try {
        const { error } = await supabase.from(tableName).delete().eq('id', id)
        if (error) throw error

        mutate(SWR_KEY)
      } catch (err) {
        mutate(SWR_KEY)
        throw err
      }
    }

    // 重新載入
    const fetchAll = () => mutate(SWR_KEY)

    // 依 ID 取得
    const getById = (id: string) => items.find(item => item.id === id)

    return {
      items,
      isLoading,
      isValidating,
      error,
      create,
      update,
      delete: remove,
      fetchAll,
      getById,
    }
  }
}

export default createCloudHook
