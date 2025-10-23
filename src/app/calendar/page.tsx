'use client'

import { useState, useRef, useMemo, useCallback, useEffect } from 'react'

import { useRouter } from 'next/navigation'

import { EventClickArg } from '@fullcalendar/core'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import FullCalendar from '@fullcalendar/react'
import {
  Calendar as CalendarIcon,
  MapPin,
  X,
  Plus,
  Cake,
  Briefcase,
  Clock,
  CheckSquare,
} from 'lucide-react'

import { CalendarSettingsDialog } from '@/components/calendar/calendar-settings-dialog'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useTourStore, useOrderStore, useMemberStore, useCalendarStore, useCalendarEventStore } from '@/stores'
import { useAuthStore } from '@/stores/auth-store'
import { Tour } from '@/stores/types'
import { CalendarEvent } from '@/types/calendar.types'
import { logger } from '@/lib/utils/logger'

// FullCalendar 元件所需的顯示格式（與資料庫 CalendarEvent 不同）
interface FullCalendarEvent {
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
  }
}

interface PersonalEvent {
  id: string
  title: string
  date: string
  end_date?: string
  time?: string
  type: 'meeting' | 'deadline' | 'task'
  description?: string
}

export default function CalendarPage() {
  const router = useRouter()
  const calendarRef = useRef<FullCalendar>(null)
  const { items: tours } = useTourStore()
  const { items: orders } = useOrderStore()
  const { items: members } = useMemberStore()

  // CalendarStore（只管理 UI 狀態）
  const { user } = useAuthStore()
  const { settings } = useCalendarStore()

  // CalendarEventStore（管理事件資料）
  const { items: calendarEvents, create: addEvent, remove: deleteEvent } = useCalendarEventStore()

  const [moreEventsDialog, setMoreEventsDialog] = useState<{
    open: boolean
    date: string
    events: FullCalendarEvent[]
  }>({
    open: false,
    date: '',
    events: [],
  })

  const [eventDetailDialog, setEventDetailDialog] = useState<{
    open: boolean
    event: PersonalEvent | null
  }>({
    open: false,
    event: null,
  })

  const [addEventDialog, setAddEventDialog] = useState<{
    open: boolean
    selectedDate: string
  }>({
    open: false,
    selectedDate: '',
  })

  const [currentDate, setCurrentDate] = useState(new Date())

  const [newEvent, setNewEvent] = useState({
    title: '',
    visibility: 'personal' as 'personal' | 'company',
    event_type: 'meeting' as 'meeting' | 'deadline' | 'task' | 'other',
    description: '',
    end_date: '',
    start_time: '',
    end_time: '',
  })

  // 計算事件區間長度（用於排序）
  const getEventDuration = useCallback((event: FullCalendarEvent): number => {
    if (!event.end) return 0
    const start = new Date(event.start)
    const end = new Date(event.end)
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  }, [])

  // 事件排序：短程在前，長程在後
  const compareEvents = useCallback(
    (a: FullCalendarEvent, b: FullCalendarEvent): number => {
      const durationA = getEventDuration(a)
      const durationB = getEventDuration(b)

      if (durationA !== durationB) {
        return durationA - durationB
      }

      return a.start.localeCompare(b.start)
    },
    [getEventDuration]
  )

  // 根據類型取得顏色 - 使用莫蘭迪配色
  const getEventColor = useCallback((type: string, status?: Tour['status']) => {
    if (type === 'tour' && status) {
      const colors = {
        提案: { bg: '#9BB5D6', border: '#8AA4C5' },
        進行中: { bg: '#A8C4A2', border: '#97B391' },
        待結案: { bg: '#D4B896', border: '#C3A785' },
        結案: { bg: '#B8B3AE', border: '#A7A29D' },
        特殊團: { bg: '#D4A5A5', border: '#C39494' },
      }
      return colors[status] || colors['提案']
    }

    const colors = {
      personal: { bg: '#B8A9D1', border: '#A798C0' },
      birthday: { bg: '#E6B8C8', border: '#D5A7B7' },
      company: { bg: '#E0C3A0', border: '#CFB28F' },
    }
    return colors[type as keyof typeof colors] || { bg: '#B8B3AE', border: '#A7A29D' }
  }, [])

  // 轉換旅遊團為日曆事件（過濾掉特殊團）
  const tourEvents: FullCalendarEvent[] = useMemo(() => {
    return (tours || [])
      .filter(tour => tour.status !== '特殊團') // 過濾掉簽證專用團等特殊團
      .map(tour => {
        const color = getEventColor('tour', tour.status)
        const tourOrders = (orders || []).filter(order => order.tour_id === tour.id)
        const actualMembers = (members || []).filter(member =>
          tourOrders.some(order => order.id === member.order_id)
        ).length

        // 修正 FullCalendar 的多日事件顯示問題
        // 如果有 return_date，則需要加一天才能正確顯示跨日事件
        let end_date = tour.return_date
        if (end_date && end_date !== tour.departure_date) {
          const returnDateObj = new Date(end_date)
          returnDateObj.setDate(returnDateObj.getDate() + 1)
          end_date = returnDateObj.toISOString().split('T')[0]
        }

        return {
          id: `tour-${tour.id}`,
          title: `🛫 ${tour.name}`,
          start: tour.departure_date,
          end: end_date,
          backgroundColor: color.bg,
          borderColor: color.border,
          extendedProps: {
            type: 'tour' as const,
            tour_id: tour.id,
            code: tour.code,
            location: tour.location,
            participants: actualMembers,
            max_participants: tour.max_participants,
            status: tour.status,
          },
        }
      })
  }, [tours, orders, members, getEventColor])

  // 轉換個人事項為日曆事件
  const personalCalendarEvents: FullCalendarEvent[] = useMemo(() => {
    return (calendarEvents || [])
      .filter(event => event.visibility === 'personal')
      .map(event => {
        const color = getEventColor('personal')
        return {
          id: event.id,
          title: `📅 ${event.title}`,
          start: event.start,
          end: event.end,
          backgroundColor: color.bg,
          borderColor: color.border,
          extendedProps: {
            type: 'personal' as const,
            description: event.description,
          },
        }
      })
  }, [calendarEvents, getEventColor])

  // 轉換公司事項為日曆事件
  const companyCalendarEvents: FullCalendarEvent[] = useMemo(() => {
    return (calendarEvents || [])
      .filter(event => event.visibility === 'company')
      .map(event => {
        const color = getEventColor('company')
        return {
          id: event.id,
          title: `🏢 ${event.title}`,
          start: event.start,
          end: event.end,
          backgroundColor: color.bg,
          borderColor: color.border,
          extendedProps: {
            type: 'company' as const,
            description: event.description,
          },
        }
      })
  }, [calendarEvents, getEventColor])

  // 轉換會員生日為日曆事件
  const birthdayEvents: FullCalendarEvent[] = useMemo(() => {
    const currentYear = new Date().getFullYear()

    return (members || [])
      .map(member => {
        if (!member?.birthday) return null

        // 計算今年的生日日期
        const birthdayThisYear = `${currentYear}-${member.birthday.slice(5)}`

        return {
          id: `birthday-${member.id}`,
          title: `🎂 ${member.name}`,
          start: birthdayThisYear,
          backgroundColor: getEventColor('birthday').bg,
          borderColor: getEventColor('birthday').border,
          extendedProps: {
            type: 'birthday' as const,
            member_id: member.id,
            member_name: member.name,
            order_id: member.order_id,
          },
        }
      })
      .filter(Boolean) as FullCalendarEvent[]
  }, [members, getEventColor])

  // 合併所有事件
  const allEvents = useMemo(() => {
    return [...tourEvents, ...personalCalendarEvents, ...companyCalendarEvents, ...birthdayEvents]
  }, [tourEvents, personalCalendarEvents, companyCalendarEvents, birthdayEvents])

  // 過濾事件（根據 settings）
  const filteredEvents = useMemo(() => {
    return allEvents.filter(event => {
      const type = event.extendedProps.type

      if (type === 'tour' && !settings.showTours) return false
      if (type === 'personal' && !settings.showPersonal) return false
      if (type === 'company' && !settings.showCompany) return false
      if (type === 'birthday' && !settings.showBirthdays) return false

      return true
    })
  }, [allEvents, settings])

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
        : `${addEventDialog.selectedDate}T00:00:00`;

      const endDate = newEvent.end_date || addEventDialog.selectedDate;
      const endDateTime = newEvent.end_time
        ? `${endDate}T${newEvent.end_time}:00`
        : `${endDate}T23:59:59`;

      // 映射 event_type: deadline → reminder
      const mappedType = newEvent.event_type === 'deadline' ? 'reminder' : newEvent.event_type;

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
      setNewEvent({
        title: '',
        visibility: 'personal',
        event_type: 'meeting',
        description: '',
        end_date: '',
        start_time: '',
        end_time: '',
      })

      setAddEventDialog({ open: false, selectedDate: '' })
    } catch (error) {
      logger.error('新增事件失敗:', error)
    }
  }

  // 生成15分鐘間隔的時間選項
  const generateTimeOptions = () => {
    const options = []
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        options.push(timeString)
      }
    }
    return options
  }

  const timeOptions = generateTimeOptions()

  // 月份切換
  const handlePrevMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
    setCurrentDate(newDate)
    calendarRef.current?.getApi().prev()
  }

  const handleNextMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
    setCurrentDate(newDate)
    calendarRef.current?.getApi().next()
  }

  const handleToday = () => {
    const today = new Date()
    setCurrentDate(today)
    calendarRef.current?.getApi().today()
  }

  // 格式化當前月份
  const getCurrentMonthYear = () => {
    return currentDate.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long' })
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
      // 這裡可以跳轉到訂單詳情頁面的會員區塊
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

  // 處理 "更多" 連結點擊
  const handleMoreLinkClick = (info: any) => {
    info.jsEvent.preventDefault()
    const clickedDate = info.dateStr

    const dayEvents = (filteredEvents || []).filter((event: FullCalendarEvent) => {
      if (!event?.start) return false
      const eventStart = event.start.split('T')[0]
      const eventEnd = event?.end ? event.end.split('T')[0] : eventStart
      return clickedDate >= eventStart && clickedDate <= eventEnd
    })

    const sortedEvents = dayEvents.sort(compareEvents)

    setMoreEventsDialog({
      open: true,
      date: clickedDate,
      events: sortedEvents,
    })

    return 'popover' as const
  }

  const handleCloseDialog = () => {
    setMoreEventsDialog({
      open: false,
      date: '',
      events: [],
    })
  }

  const handleDialogEventClick = (event: FullCalendarEvent) => {
    if (event.extendedProps.type === 'tour') {
      router.push(`/tours/${event.extendedProps.tour_id}`)
    }
    handleCloseDialog()
  }

  return (
    <>
      <ResponsiveHeader
        title="行事曆"
        breadcrumb={[
          { label: '首頁', href: '/' },
          { label: '行事曆', href: '/calendar' },
        ]}
        actions={
          <div className="flex items-center gap-4">
            {/* 月份切換 */}
            <div className="flex items-center gap-2 border border-border rounded-lg p-1">
              <Button variant="ghost" size="sm" onClick={handlePrevMonth} className="h-8 w-8 p-0">
                ←
              </Button>
              <span className="text-sm font-medium text-morandi-primary min-w-[120px] text-center">
                {getCurrentMonthYear()}
              </span>
              <Button variant="ghost" size="sm" onClick={handleNextMonth} className="h-8 w-8 p-0">
                →
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleToday}
              className="border-morandi-gold text-morandi-gold hover:bg-morandi-gold hover:text-white"
            >
              今天
            </Button>

            <CalendarSettingsDialog />

            <Button
              size="sm"
              onClick={() => {
                const today = new Date().toISOString().split('T')[0]
                setAddEventDialog({ open: true, selectedDate: today })
              }}
              className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
            >
              <Plus size={16} className="mr-1" />
              新增事項
            </Button>
          </div>
        }
      />

      <div className="space-y-6">
        <Card className="p-6 border-morandi-container">
        {/* 日曆主體 */}
        <div className="calendar-container">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={false}
            events={filteredEvents}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            locale="zh-tw"
            height="auto"
            dayMaxEvents={3}
            moreLinkClick={handleMoreLinkClick}
            moreLinkText="更多"
            weekends={true}
            firstDay={1}
            eventDisplay="auto"
            eventDidMount={info => {
              // 為事件添加 data 屬性以便 CSS 選擇器使用
              const eventType = info.event.extendedProps.type
              info.el.setAttribute('data-event-type', eventType)
            }}
            displayEventTime={false}
            eventOrder="start,-duration,title"
            buttonText={{
              today: '今天',
              month: '月',
              week: '週',
              day: '日',
            }}
          />
        </div>

        {/* 圖例 */}
        <div className="mt-6 flex flex-wrap gap-4 p-4 bg-morandi-container/10 rounded-lg">
          <div className="text-sm font-medium text-morandi-secondary">圖例：</div>

          {/* 旅遊團狀態圖例 */}
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#9BB5D6' }} />
            <span className="text-sm text-morandi-secondary">提案</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#A8C4A2' }} />
            <span className="text-sm text-morandi-secondary">進行中</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#D4B896' }} />
            <span className="text-sm text-morandi-secondary">待結案</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#B8B3AE' }} />
            <span className="text-sm text-morandi-secondary">結案</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#D4A5A5' }} />
            <span className="text-sm text-morandi-secondary">特殊團</span>
          </div>

          {/* 個人事項圖例 */}
          <div className="flex items-center gap-2 ml-4">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#B8A9D1' }} />
            <span className="text-sm text-morandi-secondary">個人事項</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#E6B8C8' }} />
            <span className="text-sm text-morandi-secondary">生日</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#E0C3A0' }} />
            <span className="text-sm text-morandi-secondary">公司活動</span>
          </div>
        </div>
      </Card>

      {/* 新增行事曆事項對話框 */}
      <Dialog
        open={addEventDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            // 關閉時重置表單
            setNewEvent({
              title: '',
              visibility: 'personal',
              event_type: 'meeting',
              description: '',
              end_date: '',
              start_time: '',
              end_time: '',
            })
            setAddEventDialog({ open: false, selectedDate: '' })
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>新增行事曆事項</DialogTitle>
          </DialogHeader>

          <form
            onSubmit={e => {
              e.preventDefault()
              if (newEvent.title.trim()) {
                handleAddEvent()
              }
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-morandi-primary">開始日期</label>
                <div className="mt-1 p-3 bg-morandi-container/20 rounded-lg">
                  <p className="text-base font-semibold text-morandi-primary">
                    {addEventDialog.selectedDate}
                  </p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-morandi-primary">結束日期（選填）</label>
                <Input
                  type="date"
                  value={newEvent.end_date}
                  onChange={e => setNewEvent(prev => ({ ...prev, end_date: e.target.value }))}
                  min={addEventDialog.selectedDate}
                  className="mt-1"
                  placeholder="跨天活動請選擇"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-morandi-primary">標題</label>
              <Input
                value={newEvent.title}
                onChange={e => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                placeholder="輸入事項標題"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-morandi-primary">事件類型</label>
                <select
                  value={newEvent.visibility}
                  onChange={e => setNewEvent(prev => ({ ...prev, visibility: e.target.value as 'personal' | 'company' }))}
                  className="mt-1 w-full p-2 border border-border rounded-md bg-white"
                >
                  <option value="personal">個人行事曆</option>
                  <option value="company">公司行事曆</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-morandi-primary">開始時間（選填）</label>
                <select
                  value={newEvent.start_time}
                  onChange={e => setNewEvent(prev => ({ ...prev, start_time: e.target.value }))}
                  className="mt-1 w-full p-2 border border-border rounded-md bg-white"
                >
                  <option value="">不指定時間</option>
                  {timeOptions.map(time => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 如果有結束日期，顯示結束時間 */}
            {newEvent.end_date && (
              <div>
                <label className="text-sm font-medium text-morandi-primary">結束時間（選填）</label>
                <select
                  value={newEvent.end_time}
                  onChange={e => setNewEvent(prev => ({ ...prev, end_time: e.target.value }))}
                  className="mt-1 w-full p-2 border border-border rounded-md bg-white"
                >
                  <option value="">不指定時間</option>
                  {timeOptions.map(time => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-morandi-primary">說明（選填）</label>
              <Input
                value={newEvent.description}
                onChange={e => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                placeholder="輸入說明"
                className="mt-1"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddEventDialog({ open: false, selectedDate: '' })}
              >
                取消
              </Button>
              <Button
                type="submit"
                disabled={!newEvent.title.trim()}
                className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
              >
                新增 <span className="ml-1 text-xs opacity-70">(Enter)</span>
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 事件詳情對話框 */}
      <Dialog
        open={eventDetailDialog.open}
        onOpenChange={() => setEventDetailDialog({ open: false, event: null })}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>事件詳情</DialogTitle>
          </DialogHeader>

          {eventDetailDialog.event && (
            <div className="space-y-4">
              {/* 標題 */}
              <div className="p-4 bg-morandi-container/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {eventDetailDialog.event.type === 'meeting' && (
                    <span className="text-2xl">📅</span>
                  )}
                  {eventDetailDialog.event.type === 'deadline' && (
                    <span className="text-2xl">⏰</span>
                  )}
                  {eventDetailDialog.event.type === 'task' && <span className="text-2xl">✓</span>}
                  <span className="text-sm text-morandi-secondary">
                    {eventDetailDialog.event.type === 'meeting'
                      ? '會議'
                      : eventDetailDialog.event.type === 'deadline'
                        ? '截止日期'
                        : '待辦事項'}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-morandi-primary">
                  {eventDetailDialog.event.title}
                </h3>
              </div>

              {/* 日期時間 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CalendarIcon size={16} className="text-morandi-secondary" />
                  <span className="text-morandi-primary">
                    {new Date(eventDetailDialog.event.date).toLocaleDateString('zh-TW', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      weekday: 'long',
                    })}
                  </span>
                </div>

                {eventDetailDialog.event.end_date && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-morandi-secondary ml-6">至</span>
                    <span className="text-morandi-primary">
                      {new Date(eventDetailDialog.event.end_date).toLocaleDateString('zh-TW', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        weekday: 'long',
                      })}
                    </span>
                  </div>
                )}

                {eventDetailDialog.event.time && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock size={16} className="text-morandi-secondary" />
                    <span className="text-morandi-primary">{eventDetailDialog.event.time}</span>
                  </div>
                )}
              </div>

              {/* 說明 */}
              {eventDetailDialog.event.description && (
                <div className="p-3 bg-morandi-container/10 rounded-lg">
                  <p className="text-sm text-morandi-secondary mb-1">說明</p>
                  <p className="text-sm text-morandi-primary">
                    {eventDetailDialog.event.description}
                  </p>
                </div>
              )}

              {/* 操作按鈕 */}
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (confirm('確定要刪除這個事件嗎？')) {
                      handleDeleteEvent(eventDetailDialog.event!.id)
                    }
                  }}
                  className="text-morandi-red hover:bg-morandi-red hover:text-white"
                >
                  刪除
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEventDetailDialog({ open: false, event: null })}
                >
                  關閉
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 更多事件對話框 */}
      <Dialog open={moreEventsDialog.open} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>
                {moreEventsDialog.date} 的所有事件 ({moreEventsDialog.events.length})
              </DialogTitle>
              <button
                onClick={handleCloseDialog}
                className="text-morandi-secondary hover:text-morandi-primary"
              >
                <X size={20} />
              </button>
            </div>
          </DialogHeader>

          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {moreEventsDialog.events.map((event, index) => {
              const duration = getEventDuration(event)
              const Icon =
                event.extendedProps.type === 'tour'
                  ? MapPin
                  : event.extendedProps.type === 'personal'
                    ? CheckSquare
                    : event.extendedProps.type === 'birthday'
                      ? Cake
                      : Briefcase

              return (
                <button
                  key={index}
                  onClick={() => handleDialogEventClick(event)}
                  className="w-full p-4 border border-border rounded-lg hover:bg-morandi-container/10 transition-colors text-left"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-3 h-3 rounded mt-1 flex-shrink-0"
                      style={{ backgroundColor: event.backgroundColor }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-morandi-primary mb-1 truncate">
                        {event.title}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-morandi-secondary">
                        <div className="flex items-center gap-1">
                          <Icon size={14} />
                          <span className="capitalize">{event.extendedProps.type}</span>
                        </div>
                        {event.extendedProps.location && (
                          <span>{event.extendedProps.location}</span>
                        )}
                        {event.extendedProps.participants && (
                          <span>
                            {event.extendedProps.participants}/{event.extendedProps.max_participants}
                            人
                          </span>
                        )}
                        {duration > 0 && (
                          <span className="text-morandi-gold font-medium">{duration}天</span>
                        )}
                      </div>
                      {event.extendedProps.description && (
                        <div className="mt-1 text-xs text-morandi-secondary">
                          {event.extendedProps.description}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>
      </div>

      <style jsx global>{`
        /* FullCalendar Morandi 樣式覆蓋 */
        .calendar-container {
          font-family: inherit;
        }

        .fc .fc-toolbar-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: #3a3633;
        }

        .fc .fc-button {
          background-color: #c4a572;
          border-color: #c4a572;
          color: white;
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
          text-transform: none;
          box-shadow: none;
        }

        .fc .fc-button:hover {
          background-color: #b39561;
          border-color: #b39561;
        }

        .fc .fc-button:disabled {
          background-color: #e8e6e3;
          border-color: #e8e6e3;
          color: #8b8680;
          opacity: 0.6;
        }

        .fc .fc-button-primary:not(:disabled).fc-button-active {
          background-color: #b39561;
          border-color: #b39561;
        }

        .fc .fc-col-header-cell {
          background-color: #f6f4f1;
          padding: 1rem 0.5rem;
          font-weight: 500;
          color: #8b8680;
          border-color: #e8e6e3;
        }

        .fc .fc-daygrid-day {
          border-color: #e8e6e3;
        }

        .fc .fc-daygrid-day-number {
          color: #3a3633;
          padding: 0.5rem;
          font-size: 0.875rem;
        }

        .fc .fc-day-today {
          background-color: rgba(217, 210, 200, 0.3) !important;
        }

        .fc .fc-day-today .fc-daygrid-day-number {
          background-color: #c4a572;
          color: white;
          padding: 0.125rem 0.5rem;
          border-radius: 0.375rem;
          font-weight: 600;
          display: inline-block;
          margin: 0.25rem 0 0.25rem 0.5rem;
        }

        .fc .fc-daygrid-day:hover {
          background-color: rgba(58, 54, 51, 0.02);
          cursor: pointer;
        }

        .fc-event {
          cursor: pointer;
          border: none;
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-weight: 500;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
          transition: all 0.2s ease;
        }

        .fc-event:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12);
        }

        .fc-event-title {
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .fc-daygrid-more-link {
          color: #c4a572 !important;
          font-weight: 500 !important;
          text-decoration: none !important;
          padding: 0.125rem 0.5rem !important;
          border-radius: 0.25rem !important;
          transition: all 0.2s ease !important;
          display: inline-block !important;
          margin-top: 0.25rem !important;
          font-size: 0.75rem !important;
        }

        .fc-daygrid-more-link:hover {
          background-color: rgba(196, 165, 114, 0.1) !important;
          color: #b39561 !important;
        }

        .fc-popover {
          display: none !important;
        }

        .fc .fc-day-sat,
        .fc .fc-day-sun {
          background-color: transparent;
        }

        /* 點點樣式事件 */
        .fc .fc-daygrid-event.fc-event-start.fc-event-end {
          margin: 1px 2px;
          padding: 2px 6px;
          border-radius: 12px;
          font-size: 11px;
          line-height: 1.2;
        }

        /* 生日事件特殊樣式 - 圓形點點 */
        .fc-event[data-event-type='birthday'] {
          border-radius: 50% !important;
          width: 24px !important;
          height: 24px !important;
          padding: 0 !important;
          margin: 2px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          overflow: hidden !important;
          border: none !important;
        }

        .fc-event[data-event-type='birthday'] .fc-event-title {
          font-size: 14px !important;
          line-height: 1 !important;
          text-align: center !important;
        }
      `}</style>
    </>
  )
}
