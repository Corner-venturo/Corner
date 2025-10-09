/**
 * 行事曆類型定義
 */

import type { BaseEntity } from './base.types';

export interface CalendarEvent extends BaseEntity {
  title: string;
  description?: string;
  start: string; // ISO date string
  end: string; // ISO date string
  all_day: boolean;
  type: 'tour' | 'meeting' | 'task' | 'reminder' | 'other';
  color?: string;
  // 關聯資料
  related_tour_id?: string;
  related_order_id?: string;
  // 參與者
  attendees?: string[]; // employee IDs
  // 提醒
  reminder_minutes?: number;
  // 重複事件
  recurring?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurring_until?: string;
  // 擁有者
  owner_id: string;
}

export type CreateCalendarEventData = Omit<CalendarEvent, keyof BaseEntity>;
export type UpdateCalendarEventData = Partial<CreateCalendarEventData>;
