'use client'

import { Plus } from 'lucide-react'
import { CalendarSettingsDialog } from '@/components/calendar/calendar-settings-dialog'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  CalendarGrid,
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

      <div className="h-[calc(100vh-180px)]">
        <Card className="h-full border-morandi-container flex flex-col">
          {/* 日曆主體 */}
          <div className="flex-1 overflow-hidden">
            <CalendarGrid
              calendarRef={calendarRef}
              events={filteredEvents}
              onDateClick={handleDateClick}
              onEventClick={handleEventClick}
              onMoreLinkClick={(info) => handleMoreLinkClick(info, filteredEvents)}
            />
          </div>
        </Card>

        {/* 新增行事曆事項對話框 */}
        <AddEventDialog
          dialog={addEventDialog}
          newEvent={newEvent}
          onNewEventChange={setNewEvent}
          onSubmit={handleAddEvent}
          onClose={resetAddEventForm}
        />

        {/* 事件詳情對話框 */}
        <EventDetailDialog
          dialog={eventDetailDialog}
          onClose={() => setEventDetailDialog({ open: false, event: null })}
          onDelete={handleDeleteEvent}
        />

        {/* 更多事件對話框 */}
        <MoreEventsDialog
          dialog={moreEventsDialog}
          onClose={handleCloseDialog}
          onEventClick={handleDialogEventClick}
          getEventDuration={getEventDuration}
        />
      </div>

      <CalendarStyles />
    </>
  )
}
