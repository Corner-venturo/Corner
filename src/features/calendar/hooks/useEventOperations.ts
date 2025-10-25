import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { EventClickArg } from '@fullcalendar/core'
import { useCalendarEventStore } from '@/stores'
import { useAuthStore } from '@/stores/auth-store'
import { logger } from '@/lib/utils/logger'
import {
  AddEventDialogState,
  EventDetailDialogState,
  NewEventForm,
  PersonalEvent
} from '../types'

const initialNewEventState: NewEventForm = {
  title: '',
  visibility: 'personal',
  event_type: 'meeting',
  description: '',
  end_date: '',
  start_time: '',
  end_time: '',
}

export function useEventOperations() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { items: calendarEvents, create: addEvent, delete: deleteEvent } = useCalendarEventStore()

  const [eventDetailDialog, setEventDetailDialog] = useState<EventDetailDialogState>({
    open: false,
    event: null,
  })

  const [addEventDialog, setAddEventDialog] = useState<AddEventDialogState>({
    open: false,
    selectedDate: '',
  })

  const [newEvent, setNewEvent] = useState<NewEventForm>(initialNewEventState)

  // 處理日期點擊 - 直接開啟新增個人事項
  const handleDateClick = (info: any) => {
    setAddEventDialog({
      open: true,
      selectedDate: info.dateStr,
    })
  }

  // 新增事件
  const handleAddEvent = async () => {
    if (!newEvent.title || !user) return

    try {
      // 組合日期和時間
      const startDateTime = newEvent.start_time
        ? `${addEventDialog.selectedDate}T${newEvent.start_time}:00`
        : `${addEventDialog.selectedDate}T00:00:00`

      const endDate = newEvent.end_date || addEventDialog.selectedDate
      const endDateTime = newEvent.end_time
        ? `${endDate}T${newEvent.end_time}:00`
        : `${endDate}T23:59:59`

      // 映射 event_type: deadline → reminder
      const mappedType = newEvent.event_type === 'deadline' ? 'reminder' : newEvent.event_type

      await addEvent({
        title: newEvent.title,
        description: newEvent.description,
        start: startDateTime,
        end: endDateTime,
        all_day: !newEvent.start_time && !newEvent.end_time,
        type: mappedType as 'tour' | 'meeting' | 'task' | 'reminder' | 'other',
        visibility: newEvent.visibility,
        owner_id: user.id,
      })

      // 重置表單
      setNewEvent(initialNewEventState)
      setAddEventDialog({ open: false, selectedDate: '' })
    } catch (error) {
      logger.error('新增事件失敗:', error)
    }
  }

  // 處理事件點擊
  const handleEventClick = (info: EventClickArg) => {
    const eventType = info.event.extendedProps.type

    if (eventType === 'tour') {
      const tour_id = info.event.extendedProps.tourId
      router.push(`/tours/${tour_id}`)
    } else if (eventType === 'birthday') {
      // 跳轉到會員資料頁面
      const member_id = info.event.extendedProps.memberId
      router.push(`/orders?member=${member_id}`)
    } else if (eventType === 'personal' || eventType === 'company') {
      // 找到對應的事項
      const eventId = info.event.id
      const event = calendarEvents.find(e => e.id === eventId)
      if (event) {
        // 轉換為 PersonalEvent 格式以兼容現有 Dialog
        const personalEventFormat: PersonalEvent = {
          id: event.id,
          title: event.title,
          date: event.start,
          end_date: event.end,
          time: event.start,
          type: event.type as 'meeting' | 'deadline' | 'task',
          description: event.description,
        }
        setEventDetailDialog({
          open: true,
          event: personalEventFormat,
        })
      }
    }
  }

  // 刪除事項
  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteEvent(eventId)
      setEventDetailDialog({ open: false, event: null })
    } catch (error) {
      logger.error('刪除事件失敗:', error)
    }
  }

  // 重置新增表單
  const resetAddEventForm = () => {
    setNewEvent(initialNewEventState)
    setAddEventDialog({ open: false, selectedDate: '' })
  }

  return {
    eventDetailDialog,
    setEventDetailDialog,
    addEventDialog,
    setAddEventDialog,
    newEvent,
    setNewEvent,
    handleDateClick,
    handleAddEvent,
    handleEventClick,
    handleDeleteEvent,
    resetAddEventForm,
  }
}
