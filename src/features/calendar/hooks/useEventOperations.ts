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
      const isAllDay = !newEvent.start_time && !newEvent.end_time
      const endDate = newEvent.end_date || addEventDialog.selectedDate

      let startDateTime: string
      let endDateTime: string

      if (isAllDay) {
        // 全天事件：只存日期，不加時間
        startDateTime = `${addEventDialog.selectedDate}T00:00:00${tzOffset}`
        endDateTime = `${endDate}T00:00:00${tzOffset}`
      } else {
        // 有時間的事件
        startDateTime = newEvent.start_time
          ? `${addEventDialog.selectedDate}T${newEvent.start_time}:00${tzOffset}`
          : `${addEventDialog.selectedDate}T00:00:00${tzOffset}`

        endDateTime = newEvent.end_time
          ? `${endDate}T${newEvent.end_time}:00${tzOffset}`
          : `${endDate}T23:59:00${tzOffset}`
      }

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
        all_day: isAllDay,
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
      router.push(`/tours?highlight=${tour_id}`)
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

    // 🔧 修正：使用 Date 物件正確轉換時區，而不是直接 substring
    // 這樣可以避免 UTC 轉換造成的日期跳動問題
    const parseToTaipeiDateTime = (isoString: string) => {
      const date = new Date(isoString)
      // 使用台灣時區格式化
      const taipeiDate = date.toLocaleDateString('sv-SE', { timeZone: 'Asia/Taipei' }) // sv-SE 格式為 YYYY-MM-DD
      const taipeiTime = date.toLocaleTimeString('zh-TW', {
        timeZone: 'Asia/Taipei',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
      return { date: taipeiDate, time: taipeiTime }
    }

    const startParsed = parseToTaipeiDateTime(originalEvent.start)
    const startDate = startParsed.date

    // 結束日期：如果有 end 就解析，否則用開始日期
    let endDate = startDate
    let endParsed = { date: startDate, time: '23:59' }
    if (originalEvent.end) {
      endParsed = parseToTaipeiDateTime(originalEvent.end)
      endDate = endParsed.date
    }

    // 解析時間部分
    let startTime = ''
    let endTime = ''

    if (!originalEvent.all_day) {
      // 只有非 00:00 才設定時間
      if (startParsed.time !== '00:00') {
        startTime = startParsed.time
      }

      // 只有非 23:59 才設定時間（23:59 是全天事件的預設結束時間）
      if (endParsed.time !== '23:59') {
        endTime = endParsed.time
      }
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
      const isAllDay = !editEventDialog.startTime && !editEventDialog.endTime
      const endDate = editEventDialog.endDate || editEventDialog.startDate

      let startDateTime: string
      let endDateTime: string

      if (isAllDay) {
        // 全天事件：只存日期，不加時間
        startDateTime = `${editEventDialog.startDate}T00:00:00${tzOffset}`
        endDateTime = `${endDate}T00:00:00${tzOffset}`
      } else {
        // 有時間的事件
        startDateTime = editEventDialog.startTime
          ? `${editEventDialog.startDate}T${editEventDialog.startTime}:00${tzOffset}`
          : `${editEventDialog.startDate}T00:00:00${tzOffset}`

        endDateTime = editEventDialog.endTime
          ? `${endDate}T${editEventDialog.endTime}:00${tzOffset}`
          : `${endDate}T23:59:00${tzOffset}`
      }

      await updateEvent(editEventDialog.eventId, {
        title: editEventDialog.title,
        description: editEventDialog.description,
        start: startDateTime,
        end: endDateTime,
        all_day: isAllDay,
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
