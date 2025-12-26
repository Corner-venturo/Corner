'use client'

import { useState } from 'react'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plane,
  Users,
  Clock,
  AlertCircle,
  Plus
} from 'lucide-react'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { Button } from '@/components/ui/button'
import { demoCalendarEvents, demoTours } from '@/lib/demo/demo-data'

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']
const MONTHS = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']

export default function DemoCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 0, 1)) // Start at Jan 2025 for demo

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)
  const startingDayOfWeek = firstDayOfMonth.getDay()
  const daysInMonth = lastDayOfMonth.getDate()

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))
  const goToToday = () => setCurrentDate(new Date(2025, 0, 19)) // Demo "today"

  // Generate calendar days
  const calendarDays: (number | null)[] = []
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null)
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day)
  }

  // Get events for a specific date
  const getEventsForDate = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return demoCalendarEvents.filter(event => event.date === dateStr)
  }

  // Get tours departing on a specific date
  const getToursForDate = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return demoTours.filter(tour => tour.start_date === dateStr)
  }

  const eventTypeConfig = {
    departure: { color: 'bg-status-info', icon: Plane, label: '出團' },
    meeting: { color: 'bg-morandi-gold', icon: Users, label: '會議' },
    deadline: { color: 'bg-status-danger', icon: AlertCircle, label: '截止' },
    reminder: { color: 'bg-status-warning', icon: Clock, label: '提醒' }
  }

  // Demo today
  const demoToday = 19

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title="行事曆"
        icon={CalendarIcon}
        breadcrumb={[
          { label: '首頁', href: '/demo' },
          { label: '行事曆', href: '/demo/calendar' },
        ]}
        actions={
          <div className="flex items-center gap-3">
            {/* 月份切換 */}
            <div className="flex items-center gap-2 bg-card border border-border rounded-lg shadow-sm">
              <Button
                variant="ghost"
                size="sm"
                onClick={prevMonth}
                className="h-9 w-9 p-0 hover:bg-morandi-container/50 hover:text-morandi-gold transition-all rounded-l-lg"
              >
                <ChevronLeft size={16} />
              </Button>
              <span className="text-sm font-semibold text-morandi-primary min-w-[120px] text-center px-2">
                {year} 年 {MONTHS[month]}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={nextMonth}
                className="h-9 w-9 p-0 hover:bg-morandi-container/50 hover:text-morandi-gold transition-all rounded-r-lg"
              >
                <ChevronRight size={16} />
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="h-9 border-morandi-gold/30 bg-card text-morandi-gold hover:bg-morandi-gold hover:border-morandi-gold hover:text-white transition-all shadow-sm font-medium rounded-lg"
            >
              今天
            </Button>

            <Button
              size="sm"
              onClick={() => alert('DEMO 模式：新增事項功能')}
              className="h-9 bg-morandi-gold hover:bg-morandi-gold-hover text-white shadow-sm hover:shadow-md transition-all font-medium rounded-lg"
            >
              <Plus size={16} className="mr-1.5" />
              新增事項
            </Button>
          </div>
        }
      />

      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
          {/* Calendar */}
          <div className="lg:col-span-3 bg-card rounded-xl border border-border shadow-sm flex flex-col">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 border-b border-border">
              {WEEKDAYS.map((day, index) => (
                <div
                  key={day}
                  className={`py-3 text-center text-sm font-medium ${
                    index === 0 ? 'text-status-danger' : index === 6 ? 'text-status-info' : 'text-morandi-secondary'
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 flex-1">
              {calendarDays.map((day, index) => {
                const events = day ? getEventsForDate(day) : []
                const tours = day ? getToursForDate(day) : []
                const isToday = day === demoToday && month === 0 && year === 2025
                const isWeekend = index % 7 === 0 || index % 7 === 6

                return (
                  <div
                    key={index}
                    className={`min-h-[100px] p-2 border-b border-r border-border ${
                      day ? 'hover:bg-morandi-container/30' : 'bg-morandi-container/10'
                    } transition-colors cursor-pointer`}
                    onClick={() => day && alert(`DEMO 模式：點擊 ${year}/${month + 1}/${day}`)}
                  >
                    {day && (
                      <>
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`w-7 h-7 flex items-center justify-center text-sm font-medium rounded-full ${
                              isToday
                                ? 'bg-morandi-gold text-white'
                                : isWeekend
                                  ? index % 7 === 0
                                    ? 'text-status-danger'
                                    : 'text-status-info'
                                  : 'text-morandi-primary'
                            }`}
                          >
                            {day}
                          </span>
                        </div>
                        <div className="space-y-1">
                          {tours.map((tour) => (
                            <div
                              key={tour.id}
                              className="px-1.5 py-1 bg-status-info-bg text-status-info rounded text-xs truncate"
                            >
                              <span className="flex items-center gap-1">
                                <Plane size={10} />
                                {tour.tour_code}
                              </span>
                            </div>
                          ))}
                          {events.slice(0, 2).map((event) => {
                            const config = eventTypeConfig[event.type]
                            return (
                              <div
                                key={event.id}
                                className={`px-1.5 py-1 ${config.color} text-white rounded text-xs truncate`}
                              >
                                {event.title}
                              </div>
                            )
                          })}
                          {events.length > 2 && (
                            <div className="text-xs text-morandi-secondary pl-1">
                              +{events.length - 2} 更多
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Sidebar - Upcoming Events */}
          <div className="space-y-4">
            {/* Today's Events */}
            <div className="bg-card rounded-xl border border-border shadow-sm">
              <div className="px-4 py-3 border-b border-border">
                <h3 className="font-semibold text-morandi-primary">今日事項</h3>
                <p className="text-xs text-morandi-secondary">2025年1月19日</p>
              </div>
              <div className="p-4">
                <p className="text-sm text-morandi-secondary text-center py-4">今日無事項</p>
              </div>
            </div>

            {/* Upcoming Departures */}
            <div className="bg-card rounded-xl border border-border shadow-sm">
              <div className="px-4 py-3 border-b border-border">
                <h3 className="font-semibold text-morandi-primary">即將出團</h3>
              </div>
              <div className="divide-y divide-border">
                {demoTours.filter(t => t.status === 'confirmed' || t.status === 'departed').slice(0, 4).map((tour) => (
                  <div key={tour.id} className="px-4 py-3 hover:bg-morandi-container/30 transition-colors cursor-pointer">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 bg-status-info rounded-full"></div>
                      <span className="text-sm font-medium text-morandi-primary">{tour.tour_code}</span>
                    </div>
                    <p className="text-xs text-morandi-primary mb-1">{tour.tour_name}</p>
                    <p className="text-xs text-morandi-secondary">{tour.start_date} | {tour.enrolled}人</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Event Legend */}
            <div className="bg-card rounded-xl border border-border shadow-sm p-4">
              <h3 className="font-semibold text-morandi-primary mb-3">圖例說明</h3>
              <div className="space-y-2">
                {Object.entries(eventTypeConfig).map(([type, config]) => (
                  <div key={type} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded ${config.color}`}></div>
                    <span className="text-sm text-morandi-secondary">{config.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
