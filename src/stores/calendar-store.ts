/**
 * 行事曆 Store
 * 簡單版本 - 使用 createStore
 */

import { create } from 'zustand';
import { CalendarEvent, CreateCalendarEventData } from '@/types/calendar.types';
import { generateUUID } from '@/lib/utils/uuid';

interface CalendarSettings {
  showPersonal: boolean;
  showCompany: boolean;
  showTours: boolean;
  showBirthdays: boolean;
}

interface CalendarStore {
  events: CalendarEvent[];
  selectedDate: Date | null;
  view: 'month' | 'week' | 'day';
  settings: CalendarSettings;

  // Actions
  addEvent: (event: CreateCalendarEventData) => void;
  updateEvent: (id: string, event: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
  setSelectedDate: (date: Date | null) => void;
  setView: (view: 'month' | 'week' | 'day') => void;
  updateSettings: (settings: Partial<CalendarSettings>) => void;
  loadEvents: () => Promise<void>;
}

export const useCalendarStore = create<CalendarStore>((set) => ({
  events: [],
  selectedDate: new Date(),
  view: 'month',
  settings: {
    showPersonal: true,
    showCompany: true,
    showTours: true,
    showBirthdays: true,
  },

  addEvent: (eventData) => {
    const now = new Date().toISOString();
    const event: CalendarEvent = {
      id: generateUUID(),
      ...eventData,
      created_at: now,
      updated_at: now,
    };
    set((state) => ({
      events: [...state.events, event],
    }));
  },

  updateEvent: (id, updates) => {
    set((state) => ({
      events: state.events.map((event) =>
        event.id === id ? { ...event, ...updates } : event
      ),
    }));
  },

  deleteEvent: (id) => {
    set((state) => ({
      events: state.events.filter((event) => event.id !== id),
    }));
  },

  setSelectedDate: (date) => {
    set({ selectedDate: date });
  },

  setView: (view) => {
    set({ view });
  },

  updateSettings: (newSettings) => {
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    }));
  },

  loadEvents: async () => {
    // TODO: 從 localDB 載入行事曆事件
    // const events = await localDB.getAll('calendar_events');
    // set({ events });
  },
}));
