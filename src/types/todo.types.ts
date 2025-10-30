/**
 * 待辦事項類型定義
 */

import type { BaseEntity } from './base.types'

export interface Todo extends BaseEntity {
  title: string
  priority: 1 | 2 | 3 | 4 | 5 // 星級緊急度
  deadline?: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  completed?: boolean // 對齊資料庫欄位

  // 人員關係（共享機制）
  creator: string // 建立者
  assignee?: string // 被指派者（可選）
  visibility: string[] // 可見人員ID列表 = [creator, assignee]

  // 關聯資料
  related_items: {
    type: 'group' | 'quote' | 'order' | 'invoice' | 'receipt'
    id: string
    title: string
  }[]

  // 子任務
  sub_tasks: {
    id: string
    title: string
    done: boolean
    completed_at?: string
  }[]

  // 簡單備註（非留言板）
  notes: {
    timestamp: string
    content: string
  }[]

  // 快速功能設定
  enabled_quick_actions: ('receipt' | 'invoice' | 'group' | 'quote' | 'assign')[]

  // 通知標記
  needs_creator_notification?: boolean // 被指派人有更新，需要通知建立者
}

export type CreateTodoData = Omit<Todo, keyof BaseEntity>
export type UpdateTodoData = Partial<CreateTodoData>
