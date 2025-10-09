/**
 * 待辦事項類型定義
 */

import type { BaseEntity } from './base.types';

export interface Todo extends BaseEntity {
  title: string;
  priority: 1 | 2 | 3 | 4 | 5; // 星級緊急度
  deadline?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  completed?: boolean; // 對齊資料庫欄位

  // 人員關係（共享機制）
  creator: string; // 建立者
  assignee?: string; // 被指派者（可選）
  visibility: string[]; // 可見人員ID列表 = [creator, assignee]

  // 關聯資料
  relatedItems: {
    type: 'group' | 'quote' | 'order' | 'invoice' | 'receipt';
    id: string;
    title: string;
  }[];

  // 子任務
  subTasks: {
    id: string;
    title: string;
    done: boolean;
    completedAt?: string;
  }[];

  // 簡單備註（非留言板）
  notes: {
    timestamp: string;
    content: string;
  }[];

  // 快速功能設定
  enabledQuickActions: ('receipt' | 'invoice' | 'group' | 'quote' | 'assign')[];

  // 通知標記
  needsCreatorNotification?: boolean; // 被指派人有更新，需要通知建立者
}

export type CreateTodoData = Omit<Todo, keyof BaseEntity>;
export type UpdateTodoData = Partial<CreateTodoData>;
