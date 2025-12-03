// src/features/timebox/hooks/useTimeboxData.ts
import { createCloudHook } from '@/hooks/createCloudHook'
import type { BaseEntity } from '@/types'

// Based on the schemas from the disabled timebox store and the new migration

export interface TimeboxBase extends BaseEntity {
  name: string;
  color: string;
  type: 'workout' | 'reminder' | 'basic';
  user_id: string;
  default_content?: any; // For the template feature
}

export interface TimeboxWeek extends BaseEntity {
  user_id: string;
  week_start: string; // ISO date string
  name?: string;
  archived: boolean;
}

export interface TimeboxScheduledBox extends BaseEntity {
  box_id: string;
  week_id: string;
  day_of_week: number; // 0-6
  start_time: string; // "HH:mm"
  duration: number; // in minutes
  completed: boolean;
  data?: any; // Can be WorkoutData, ReminderData, etc.
}

// Create and export the hooks using the factory
export const useTimeboxBases = createCloudHook<TimeboxBase>('timebox_boxes', {
  orderBy: { column: 'name', ascending: true },
});

export const useTimeboxWeeks = createCloudHook<TimeboxWeek>('timebox_weeks', {
  orderBy: { column: 'week_start', ascending: false },
});

export const useTimeboxScheduledBoxes = createCloudHook<TimeboxScheduledBox>('timebox_scheduled_boxes', {
  orderBy: { column: 'created_at', ascending: true },
});
