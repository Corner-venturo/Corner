/**
 * Todos 資料存取層 (Data Access Layer)
 *
 * 客戶端資料存取函式，用於待辦事項相關的查詢。
 * 將查詢邏輯從 Hooks 中抽離，實現關注點分離。
 */

import { supabase } from '@/lib/supabase/client'
import type { Todo } from '@/stores/types'
import { logger } from '@/lib/utils/logger'

// ============================================
// 查詢函式（客戶端）
// ============================================

/**
 * 取得所有待辦事項
 */
export async function getAllTodos(): Promise<Todo[]> {
  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    logger.error('Error fetching todos:', error)
    throw new Error(error.message)
  }

  return (data || []) as unknown as Todo[]
}

/**
 * 根據 ID 取得單一待辦事項
 */
export async function getTodoById(id: string): Promise<Todo | null> {
  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    logger.error('Error fetching todo:', error)
    return null
  }

  return data as unknown as Todo
}

/**
 * 根據狀態取得待辦事項
 */
export async function getTodosByStatus(status: string): Promise<Todo[]> {
  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false })

  if (error) {
    logger.error('Error fetching todos by status:', error)
    return []
  }

  return (data || []) as unknown as Todo[]
}

/**
 * 根據指派者取得待辦事項
 */
export async function getTodosByAssignee(assigneeId: string): Promise<Todo[]> {
  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .eq('assignee', assigneeId)
    .order('created_at', { ascending: false })

  if (error) {
    logger.error('Error fetching todos by assignee:', error)
    return []
  }

  return (data || []) as unknown as Todo[]
}

/**
 * 根據關聯實體取得待辦事項
 */
export async function getTodosByEntity(entityType: string, entityId: string): Promise<Todo[]> {
  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .eq('related_entity_type', entityType)
    .eq('related_entity_id', entityId)
    .order('created_at', { ascending: false })

  if (error) {
    logger.error('Error fetching todos by entity:', error)
    return []
  }

  return (data || []) as unknown as Todo[]
}
