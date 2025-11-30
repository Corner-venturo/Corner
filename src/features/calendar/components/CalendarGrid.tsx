'use client'

import { RefObject } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import { EventClickArg, MoreLinkAction } from '@fullcalendar/core'
import { DateClickArg } from '@fullcalendar/interaction'
import { FullCalendarEvent } from '../types'

interface CalendarGridProps {
  calendarRef: RefObject<FullCalendar | null>
  events: FullCalendarEvent[]
  onDateClick: (info: DateClickArg) => void
  onEventClick: (info: EventClickArg) => void
  onMoreLinkClick: MoreLinkAction
}

export function CalendarGrid({
  calendarRef,
  events,
  onDateClick,
  onEventClick,
  onMoreLinkClick,
}: CalendarGridProps) {
  return (
    <div className="calendar-container h-full">
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={false}
        events={events}
        dateClick={onDateClick}
        eventClick={onEventClick}
        locale="zh-tw"
        height="100%"
        dayMaxEvents={3}
        moreLinkClick={onMoreLinkClick}
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
  )
}
