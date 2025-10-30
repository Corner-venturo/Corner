import { Tour } from '@/stores/types'

// FullCalendar 元件所需的顯示格式（與資料庫 CalendarEvent 不同）
export interface FullCalendarEvent {
  id: string
  title: string
  start: string
  end?: string
  backgroundColor: string
  borderColor: string
  extendedProps: {
    type: 'tour' | 'personal' | 'birthday' | 'company'
    description?: string
    location?: string
    participants?: number
    max_participants?: number
    status?: Tour['status']
    tour_id?: string
    code?: string
    member_id?: string
    member_name?: string
    order_id?: string
  }
}

export interface MoreEventsDialogState {
  open: boolean
  date: string
  events: FullCalendarEvent[]
}

export interface AddEventDialogState {
  open: boolean
  selectedDate: string
}

export interface NewEventForm {
  title: string
  visibility: 'personal' | 'company'
  description: string
  end_date: string
  start_time: string
  end_time: string
}
