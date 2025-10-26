'use client'

import { useMemo } from 'react'
import { Plus } from 'lucide-react'
import { CalendarSettingsDialog } from '@/components/calendar/calendar-settings-dialog'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  CalendarGrid,
  CalendarLegend,
  CalendarStyles,
  AddEventDialog,
  EventDetailDialog,
  MoreEventsDialog,
} from '@/features/calendar/components'
import {
  useCalendarEvents,
  useCalendarNavigation,
  useEventOperations,
  useMoreEventsDialog,
} from '@/features/calendar/hooks'

export default function CalendarPage() {
  // Custom hooks for calendar logic
  const { filteredEvents } = useCalendarEvents()
  const {
    calendarRef,
    handlePrevMonth,
    handleNextMonth,
    handleToday,
    getCurrentMonthYear,
  } = useCalendarNavigation()

  const {
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
  } = useEventOperations()

  const {
    moreEventsDialog,
    getEventDuration,
    handleMoreLinkClick,
    handleCloseDialog,
    handleDialogEventClick,
  } = useMoreEventsDialog()

  const eventStats = useMemo(() => {
    return filteredEvents.reduce(
      (stats, event) => {
        stats.total += 1
        stats[event.extendedProps.type] += 1
        return stats
      },
      {
        total: 0,
        tour: 0,
        personal: 0,
        birthday: 0,
        company: 0,
      }
    )
  }, [filteredEvents])

  const upcomingEvents = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return filteredEvents
      .filter((event) => {
        const start = new Date(event.start)
        return !Number.isNaN(start.getTime()) && start >= today
      })
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      .slice(0, 4)
  }, [filteredEvents])

  const typeLabels: Record<string, string> = {
    tour: '旅遊團',
    personal: '個人事項',
    birthday: '生日',
    company: '公司活動',
  }

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString)
    if (Number.isNaN(date.getTime())) {
      return '日期待定'
    }

    return new Intl.DateTimeFormat('zh-TW', {
      month: '2-digit',
      day: '2-digit',
      weekday: 'short',
    }).format(date)
  }

  return (
    <div className="flex h-full flex-col">
      <ResponsiveHeader
        title="行事曆"
        breadcrumb={[
          { label: '首頁', href: '/' },
          { label: '行事曆', href: '/calendar' },
        ]}
        actions={
          <div className="flex items-center gap-4">
            {/* 月份切換 */}
            <div className="flex items-center gap-2 rounded-lg border border-border bg-white/80 p-1 shadow-sm">
              <Button variant="ghost" size="sm" onClick={handlePrevMonth} className="h-8 w-8 p-0">
                ←
              </Button>
              <span className="min-w-[120px] text-center text-sm font-medium text-morandi-primary">
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
              className="bg-morandi-gold text-white hover:bg-morandi-gold-hover"
            >
              <Plus size={16} className="mr-1" />
              新增事項
            </Button>
          </div>
        }
      />

      <div className="flex flex-1 flex-col gap-6 pb-6 pt-20 sm:pt-24">
        <div className="grid flex-1 min-h-0 gap-6 xl:grid-cols-[320px,minmax(0,1fr)]">
          <aside className="order-2 flex flex-col gap-4 xl:order-1">
            <Card className="border border-morandi-container/60 bg-gradient-to-br from-white via-white to-morandi-container/30 p-5 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.45em] text-morandi-secondary/80">本月概況</p>
                  <p className="mt-3 text-3xl font-semibold text-morandi-primary">
                    {eventStats.total}
                  </p>
                  <p className="text-xs text-morandi-secondary/80">總事項</p>
                </div>
                <div className="rounded-full bg-morandi-gold/15 px-4 py-2 text-xs font-medium text-morandi-gold">
                  即時更新
                </div>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                <div className="rounded-xl border border-morandi-container/50 bg-white/70 p-3 shadow-sm">
                  <p className="text-xs text-morandi-secondary/70">旅遊團</p>
                  <p className="mt-1 text-xl font-semibold text-morandi-primary">{eventStats.tour}</p>
                </div>
                <div className="rounded-xl border border-morandi-container/50 bg-white/70 p-3 shadow-sm">
                  <p className="text-xs text-morandi-secondary/70">個人事項</p>
                  <p className="mt-1 text-xl font-semibold text-morandi-primary">{eventStats.personal}</p>
                </div>
                <div className="rounded-xl border border-morandi-container/50 bg-white/70 p-3 shadow-sm">
                  <p className="text-xs text-morandi-secondary/70">生日提醒</p>
                  <p className="mt-1 text-xl font-semibold text-morandi-primary">{eventStats.birthday}</p>
                </div>
                <div className="rounded-xl border border-morandi-container/50 bg-white/70 p-3 shadow-sm">
                  <p className="text-xs text-morandi-secondary/70">公司活動</p>
                  <p className="mt-1 text-xl font-semibold text-morandi-primary">{eventStats.company}</p>
                </div>
              </div>
            </Card>

            <Card className="border border-morandi-container/60 bg-white/85 p-5 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-morandi-primary">即將到來</h2>
                  <p className="text-xs text-morandi-secondary/80">掌握下一步的關鍵行程</p>
                </div>
                <span className="rounded-full bg-morandi-container/40 px-3 py-1 text-xs text-morandi-secondary/90">
                  {upcomingEvents.length} 項
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {upcomingEvents.length === 0 ? (
                  <p className="text-sm text-morandi-secondary/80">
                    尚無即將到來的事項，快透過「新增事項」建立一筆吧！
                  </p>
                ) : (
                  upcomingEvents.map((event) => (
                    <div
                      key={event.id}
                      className="rounded-xl border border-morandi-container/40 bg-white/90 p-3 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-morandi-primary">{event.title}</p>
                        <span className="text-xs text-morandi-secondary/70">
                          {typeLabels[event.extendedProps.type] || '其他'}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-morandi-secondary/80">
                        <span className="font-medium text-morandi-gold">{formatEventDate(event.start)}</span>
                        {event.extendedProps.location && (
                          <span>• {event.extendedProps.location}</span>
                        )}
                        {event.extendedProps.description && (
                          <span className="line-clamp-1">• {event.extendedProps.description}</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-6">
                <CalendarLegend />
              </div>
            </Card>
          </aside>

          <Card className="order-1 flex min-h-0 flex-col overflow-hidden border border-morandi-container/60 bg-gradient-to-br from-white via-white to-morandi-container/20 shadow-2xl xl:order-2">
            <div className="border-b border-morandi-container/50 bg-white/80 px-6 py-5 backdrop-blur">
              <h2 className="text-lg font-semibold text-morandi-primary">月曆總覽</h2>
              <p className="text-sm text-morandi-secondary/80">即時掌握各部門的最新行程</p>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              <CalendarGrid
                calendarRef={calendarRef}
                events={filteredEvents}
                onDateClick={handleDateClick}
                onEventClick={handleEventClick}
                onMoreLinkClick={(info) => handleMoreLinkClick(info, filteredEvents)}
              />
            </div>
          </Card>
        </div>
      </div>

      <AddEventDialog
        dialog={addEventDialog}
        newEvent={newEvent}
        onNewEventChange={setNewEvent}
        onSubmit={handleAddEvent}
        onClose={resetAddEventForm}
      />

      <EventDetailDialog
        dialog={eventDetailDialog}
        onClose={() => setEventDetailDialog({ open: false, event: null })}
        onDelete={handleDeleteEvent}
      />

      <MoreEventsDialog
        dialog={moreEventsDialog}
        onClose={handleCloseDialog}
        onEventClick={handleDialogEventClick}
        getEventDuration={getEventDuration}
      />

      <CalendarStyles />
    </div>
  )
}
