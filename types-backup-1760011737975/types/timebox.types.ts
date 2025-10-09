/**
 * 時間盒類型定義
 */

import type { BaseEntity } from './base.types';

export interface TimeboxSession extends BaseEntity {
  title: string;
  description?: string;
  start_time: string; // ISO date string
  end_time: string; // ISO date string
  duration_minutes: number;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  // 關聯任務
  related_todo_id?: string;
  // 專注模式設定
  pomodoro_enabled: boolean;
  pomodoro_duration?: number; // 分鐘
  break_duration?: number; // 分鐘
  // 標籤和分類
  tags?: string[];
  category?: string;
  // 擁有者
  owner_id: string;
  // 實際時間追蹤
  actual_start?: string;
  actual_end?: string;
  actual_duration?: number;
}

export type CreateTimeboxSessionData = Omit<TimeboxSession, keyof BaseEntity>;
export type UpdateTimeboxSessionData = Partial<CreateTimeboxSessionData>;
