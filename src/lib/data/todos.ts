/**
 * Todos 資料存取層 (Data Access Layer)
 *
 * 客戶端資料存取函式，用於待辦事項相關的查詢。
 * 將查詢邏輯從 Hooks 中抽離，實現關注點分離。
 *
 * 🔒 安全修復 2026-01-12：所有查詢都需要傳入 workspaceId
 */

import { supabase } from '@/lib/supabase/client'
import type { Todo } from '@/stores/types'
import { logger } from '@/lib/utils/logger'

// ============================================
// 查詢函式（客戶端）
// ============================================

/**
 * 取得所有待辦事項
 * 🔒 需要傳入 workspaceId
 */
export async function getAllTodos(workspaceId: string): Promise<Todo[]> {
  if (!workspaceId) {
    logger.error('getAllTodos: workspaceId 必須提供')
    return []
  }

  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .eq('workspace_id', workspaceId)  // 🔒 Workspace 過濾
    .order('created_at', { ascending: false })

  if (error) {
    logger.error('Error fetching todos:', error)
    throw new Error(error.message)
  }

  return (data || []) as unknown as Todo[]
}

/**
 * 根據 ID 取得單一待辦事項
 * 🔒 需要傳入 workspaceId
 */
export async function getTodoById(id: string, workspaceId: string): Promise<Todo | null> {
  if (!workspaceId) {
    logger.error('getTodoById: workspaceId 必須提供')
    return null
  }

  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .eq('id', id)
    .eq('workspace_id', workspaceId)  // 🔒 Workspace 過濾
    .single()

  if (error) {
    logger.error('Error fetching todo:', error)
    return null
  }

  return data as unknown as Todo
}

/**
 * 根據狀態取得待辦事項
 * 🔒 需要傳入 workspaceId
 */
export async function getTodosByStatus(status: string, workspaceId: string): Promise<Todo[]> {
  if (!workspaceId) {
    logger.error('getTodosByStatus: workspaceId 必須提供')
    return []
  }

  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .eq('status', status)
    .eq('workspace_id', workspaceId)  // 🔒 Workspace 過濾
    .order('created_at', { ascending: false })

  if (error) {
    logger.error('Error fetching todos by status:', error)
    return []
  }

  return (data || []) as unknown as Todo[]
}

/**
 * 根據指派者取得待辦事項
 * 🔒 需要傳入 workspaceId
 */
export async function getTodosByAssignee(assigneeId: string, workspaceId: string): Promise<Todo[]> {
  if (!workspaceId) {
    logger.error('getTodosByAssignee: workspaceId 必須提供')
    return []
  }

  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .eq('assignee', assigneeId)
    .eq('workspace_id', workspaceId)  // 🔒 Workspace 過濾
    .order('created_at', { ascending: false })

  if (error) {
    logger.error('Error fetching todos by assignee:', error)
    return []
  }

  return (data || []) as unknown as Todo[]
}

/**
 * 根據關聯實體取得待辦事項
 * 🔒 需要傳入 workspaceId
 */
export async function getTodosByEntity(entityType: string, entityId: string, workspaceId: string): Promise<Todo[]> {
  if (!workspaceId) {
    logger.error('getTodosByEntity: workspaceId 必須提供')
    return []
  }

  // TODO: related_entity_type/id 欄位不存在，todos 用 related_items (jsonb)
  // 暫時用 contains 查詢，待確認 related_items 的結構後優化
  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .contains('related_items', [{ type: entityType, id: entityId }])
    .eq('workspace_id', workspaceId)  // 🔒 Workspace 過濾
    .order('created_at', { ascending: false })

  if (error) {
    logger.error('Error fetching todos by entity:', error)
    return []
  }

  return (data || []) as unknown as Todo[]
}
