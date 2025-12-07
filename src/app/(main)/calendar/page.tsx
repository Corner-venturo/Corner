'use client'

import { Plus } from 'lucide-react'
import { CalendarSettingsDialog } from '@/components/calendar/calendar-settings-dialog'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { Button } from '@/components/ui/button'
import {
  CalendarGrid,
  CalendarStyles,
  AddEventDialog,
  EditEventDialog,
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
  const { calendarRef, handlePrevMonth, handleNextMonth, handleToday, getCurrentMonthYear } =
    useCalendarNavigation()

  const {
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
      <div className="h-full flex flex-col">
        <ResponsiveHeader
          title="行事曆"
          breadcrumb={[
            { label: '首頁', href: '/' },
            { label: '行事曆', href: '/calendar' },
          ]}
          actions={
            <div className="flex items-center gap-3">
              {/* 月份切換 */}
              <div className="flex items-center gap-2 bg-card border border-border rounded-lg shadow-sm">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrevMonth}
                  className="h-9 w-9 p-0 hover:bg-morandi-container/50 hover:text-morandi-gold transition-all rounded-l-lg"
                >
                  ←
                </Button>
                <span className="text-sm font-semibold text-morandi-primary min-w-[120px] text-center px-2">
                  {getCurrentMonthYear()}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNextMonth}
                  className="h-9 w-9 p-0 hover:bg-morandi-container/50 hover:text-morandi-gold transition-all rounded-r-lg"
                >
                  →
                </Button>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleToday}
                className="h-9 border-morandi-gold/30 bg-card text-morandi-gold hover:bg-morandi-gold hover:border-morandi-gold hover:text-white transition-all shadow-sm font-medium rounded-lg"
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
                className="h-9 bg-morandi-gold hover:bg-morandi-gold-hover text-white shadow-sm hover:shadow-md transition-all font-medium rounded-lg"
              >
                <Plus size={16} className="mr-1.5" />
                新增事項
              </Button>
            </div>
          }
        />

        <div className="flex-1 overflow-hidden">
          <div className="h-full bg-card rounded-lg border border-border shadow-sm flex flex-col overflow-hidden">
            {/* 日曆主體 */}
            <div className="flex-1 overflow-hidden">
              <CalendarGrid
                calendarRef={calendarRef}
                events={filteredEvents}
                onDateClick={handleDateClick}
                onEventClick={handleEventClick}
                onMoreLinkClick={info => handleMoreLinkClick(info, filteredEvents)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 新增行事曆事項對話框 */}
      <AddEventDialog
        dialog={addEventDialog}
        newEvent={newEvent}
        onNewEventChange={setNewEvent}
        onDialogChange={setAddEventDialog}
        onSubmit={handleAddEvent}
        onClose={resetAddEventForm}
      />

      {/* 事件詳情對話框 */}
      <EventDetailDialog
        open={eventDetailDialog.open}
        event={eventDetailDialog.event}
        onClose={() => setEventDetailDialog({ open: false, event: null })}
        onEdit={openEditDialog}
        onDelete={handleDeleteEvent}
      />

      {/* 編輯行事曆事項對話框 */}
      <EditEventDialog
        dialog={editEventDialog}
        onDialogChange={setEditEventDialog}
        onSubmit={handleUpdateEvent}
        onClose={resetEditEventForm}
      />

      {/* 更多事件對話框 */}
      <MoreEventsDialog
        dialog={moreEventsDialog}
        onClose={handleCloseDialog}
        onEventClick={handleDialogEventClick}
        getEventDuration={getEventDuration}
      />

      <CalendarStyles />
    </>
  )
}
