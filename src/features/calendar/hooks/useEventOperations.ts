import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { EventClickArg } from '@fullcalendar/core'
import { DateClickArg } from '@fullcalendar/interaction'
import { useCalendarEventStore } from '@/stores'
import { useAuthStore } from '@/stores/auth-store'
import { logger } from '@/lib/utils/logger'
import { FullCalendarEvent } from '@/features/calendar/types'
import { AddEventDialogState, NewEventForm, EditEventDialogState } from '../types'

const initialNewEventState: NewEventForm = {
  title: '',
  visibility: 'personal',
  description: '',
  end_date: '',
  start_time: '',
  end_time: '',
}

const initialEditEventState: EditEventDialogState = {
  open: false,
  eventId: '',
  startDate: '',
  endDate: '',
  startTime: '',
  endTime: '',
  title: '',
  description: '',
  visibility: 'personal',
}

export function useEventOperations() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { items: calendarEvents, create: addEvent, update: updateEvent, delete: deleteEvent } = useCalendarEventStore()

  const [eventDetailDialog, setEventDetailDialog] = useState<{
    open: boolean
    event: FullCalendarEvent | null
  }>({
    open: false,
    event: null,
  })

  const [addEventDialog, setAddEventDialog] = useState<AddEventDialogState>({
    open: false,
    selectedDate: '',
  })

  const [newEvent, setNewEvent] = useState<NewEventForm>(initialNewEventState)

  const [editEventDialog, setEditEventDialog] = useState<EditEventDialogState>(initialEditEventState)

  // 處理日期點擊 - 直接開啟新增個人事項
  const handleDateClick = (info: DateClickArg) => {
    setAddEventDialog({
      open: true,
      selectedDate: info.dateStr,
    })
  }

  // 新增事件
  const handleAddEvent = async () => {
    if (!newEvent.title) {
      logger.error('新增事件失敗: 標題為空')
      return
    }

    if (!user?.id) {
      logger.error('新增事件失敗: 使用者未登入或無法取得使用者 ID')
      return
    }

    try {
      // 組合日期和時間（加上本地時區，避免 UTC 轉換問題）
      const tzOffset = '+08:00' // 台灣時區
      const startDateTime = newEvent.start_time
        ? `${addEventDialog.selectedDate}T${newEvent.start_time}:00${tzOffset}`
        : `${addEventDialog.selectedDate}T00:00:00${tzOffset}`

      const endDate = newEvent.end_date || addEventDialog.selectedDate
      const endDateTime = newEvent.end_time
        ? `${endDate}T${newEvent.end_time}:00${tzOffset}`
        : `${endDate}T23:59:59${tzOffset}`

      logger.log('[Calendar] 新增事件:', {
        title: newEvent.title,
        owner_id: user.id,
        workspace_id: user.workspace_id
      })

      await addEvent({
        title: newEvent.title,
        description: newEvent.description,
        start: startDateTime,
        end: endDateTime,
        all_day: !newEvent.start_time && !newEvent.end_time,
        type: 'other',
        visibility: newEvent.visibility,
        owner_id: user.id,
        created_by: user.id,
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
      const fullCalendarEvent: FullCalendarEvent = {
        id: info.event.id,
        title: info.event.title,
        start: info.event.startStr,
        end: info.event.endStr,
        allDay: info.event.allDay,
        backgroundColor: info.event.backgroundColor || '',
        borderColor: info.event.borderColor || '',
        extendedProps: info.event.extendedProps as unknown as FullCalendarEvent['extendedProps'],
      }
      setEventDetailDialog({
        open: true,
        event: fullCalendarEvent,
      })
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

  // 開啟編輯對話框
  const openEditDialog = (event: FullCalendarEvent) => {
    // 從原始事件中取得資料
    const originalEvent = calendarEvents.find(e => e.id === event.id)
    if (!originalEvent) return

    // 解析時間
    const startDate = originalEvent.start.split('T')[0]
    const endDate = originalEvent.end?.split('T')[0] || startDate

    // 解析時間部分（處理時區）
    let startTime = ''
    let endTime = ''

    if (!originalEvent.all_day && originalEvent.start.includes('T')) {
      const startMatch = originalEvent.start.match(/T(\d{2}:\d{2})/)
      if (startMatch) startTime = startMatch[1]
    }
    if (!originalEvent.all_day && originalEvent.end?.includes('T')) {
      const endMatch = originalEvent.end.match(/T(\d{2}:\d{2})/)
      if (endMatch) endTime = endMatch[1]
    }

    setEditEventDialog({
      open: true,
      eventId: event.id,
      startDate,
      endDate,
      startTime,
      endTime,
      title: originalEvent.title,
      description: originalEvent.description || '',
      visibility: originalEvent.visibility as 'personal' | 'company',
    })
    setEventDetailDialog({ open: false, event: null })
  }

  // 更新事件
  const handleUpdateEvent = async () => {
    if (!editEventDialog.title) {
      logger.error('更新事件失敗: 標題為空')
      return
    }

    try {
      const tzOffset = '+08:00'
      const startDateTime = editEventDialog.startTime
        ? `${editEventDialog.startDate}T${editEventDialog.startTime}:00${tzOffset}`
        : `${editEventDialog.startDate}T00:00:00${tzOffset}`

      const endDate = editEventDialog.endDate || editEventDialog.startDate
      const endDateTime = editEventDialog.endTime
        ? `${endDate}T${editEventDialog.endTime}:00${tzOffset}`
        : `${endDate}T23:59:59${tzOffset}`

      await updateEvent(editEventDialog.eventId, {
        title: editEventDialog.title,
        description: editEventDialog.description,
        start: startDateTime,
        end: endDateTime,
        all_day: !editEventDialog.startTime && !editEventDialog.endTime,
        visibility: editEventDialog.visibility,
      })

      setEditEventDialog(initialEditEventState)
    } catch (error) {
      logger.error('更新事件失敗:', error)
    }
  }

  // 重置編輯表單
  const resetEditEventForm = () => {
    setEditEventDialog(initialEditEventState)
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
    editEventDialog,
    setEditEventDialog,
    handleDateClick,
    handleAddEvent,
    handleEventClick,
    handleDeleteEvent,
    openEditDialog,
    handleUpdateEvent,
    resetEditEventForm,
    resetAddEventForm,
  }
}
