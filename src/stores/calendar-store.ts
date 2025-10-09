/**
 * 🗓️ CalendarStore - 行事曆資料管理
 *
 * 功能：
 * - 管理個人/公司行事曆事件
 * - 支援 CRUD 操作
 * - 與 IndexedDB 同步
 * - 顯示設定管理
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CalendarEvent, CalendarSettings } from './types'
import { localDB } from '@/lib/db'
import { generateUUID } from '@/lib/offline/unified-types'

interface CalendarStore {
  // 資料
  events: CalendarEvent[]

  // 顯示設定
  settings: CalendarSettings

  // CRUD 操作
  addEvent: (event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt' | 'synced'>) => Promise<void>
  updateEvent: (id: string, data: Partial<CalendarEvent>) => Promise<void>
  deleteEvent: (id: string) => Promise<void>

  // 查詢
  getPersonalEvents: () => CalendarEvent[]
  getCompanyEvents: () => CalendarEvent[]

  // 設定管理
  updateSettings: (settings: Partial<CalendarSettings>) => void

  // 資料載入
  loadEvents: () => Promise<void>
}

export const useCalendarStore = create<CalendarStore>()(
  persist(
    (set, get) => ({
      // 初始狀態
      events: [],
      settings: {
        showPersonal: true,
        showCompany: true,
        showTours: true,
        showBirthdays: true,
      },

      // 新增事件
      addEvent: async (eventData) => {
        const now = new Date().toISOString()
        const newEvent: CalendarEvent = {
          ...eventData,
          id: generateUUID(),
          created_at: now,
          updated_at: now,
          synced: false,
        }

        try {
          await localDB.create('calendar_events', newEvent)

          set(state => ({
            events: [...(state.events || []), newEvent]
          }))
        } catch (error) {
          console.error('❌ Failed to add calendar event:', error)
          throw error
        }
      },

      // 更新事件
      updateEvent: async (id, data) => {
        const updatedData = {
          ...data,
          updated_at: new Date().toISOString(),
          synced: false,
        }

        try {
          const existingEvent = await localDB.getById<CalendarEvent>('calendar_events', id)

          if (!existingEvent) {
            throw new Error('Event not found')
          }

          const updatedEvent = { ...existingEvent, ...updatedData }
          await localDB.update('calendar_events', id, updatedData)

          set(state => ({
            events: (state.events || []).map(e =>
              e.id === id ? updatedEvent : e
            )
          }))
        } catch (error) {
          console.error('❌ Failed to update calendar event:', error)
          throw error
        }
      },

      // 刪除事件
      deleteEvent: async (id) => {
        try {
          await localDB.delete('calendar_events', id)

          set(state => ({
            events: (state.events || []).filter(e => e.id !== id)
          }))
        } catch (error) {
          console.error('❌ Failed to delete calendar event:', error)
          throw error
        }
      },

      // 取得個人事件
      getPersonalEvents: () => {
        return (get().events || []).filter(e => e.visibility === 'personal')
      },

      // 取得公司事件
      getCompanyEvents: () => {
        return (get().events || []).filter(e => e.visibility === 'company')
      },

      // 更新顯示設定
      updateSettings: (newSettings) => {
        set(state => ({
          settings: { ...(state.settings || {}), ...newSettings }
        }))
      },

      // 從 IndexedDB 載入事件
      loadEvents: async () => {
        try {
          const events = await localDB.getAll<CalendarEvent>('calendar_events')

          set({ events: events || [] })
        } catch (error) {
          console.error('❌ Failed to load calendar events:', error)
        }
      },
    }),
    {
      name: 'calendar-settings',
      // 只持久化設定，events 從 IndexedDB 載入
      partialize: (state) => ({ settings: state.settings }),
    }
  )
)
