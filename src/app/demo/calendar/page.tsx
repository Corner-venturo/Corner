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
    departure: { color: 'bg-blue-500', icon: Plane, label: '出團' },
    meeting: { color: 'bg-purple-500', icon: Users, label: '會議' },
    deadline: { color: 'bg-red-500', icon: AlertCircle, label: '截止' },
    reminder: { color: 'bg-amber-500', icon: Clock, label: '提醒' }
  }

  // Demo today
  const demoToday = 19

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <CalendarIcon className="text-indigo-500" />
            行事曆
          </h1>
          <p className="text-slate-500 mt-1">行程出團與重要事項</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            今天
          </button>
          <button className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 hover:shadow-lg transition-all">
            <Plus size={18} />
            新增事件
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm">
          {/* Calendar Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800">
              {year} 年 {MONTHS[month]}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={prevMonth}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={nextMonth}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 border-b border-slate-100">
            {WEEKDAYS.map((day, index) => (
              <div
                key={day}
                className={`py-3 text-center text-sm font-medium ${
                  index === 0 ? 'text-red-500' : index === 6 ? 'text-blue-500' : 'text-slate-500'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, index) => {
              const events = day ? getEventsForDate(day) : []
              const tours = day ? getToursForDate(day) : []
              const isToday = day === demoToday && month === 0 && year === 2025
              const isWeekend = index % 7 === 0 || index % 7 === 6

              return (
                <div
                  key={index}
                  className={`min-h-[100px] p-2 border-b border-r border-slate-100 ${
                    day ? 'hover:bg-slate-50' : 'bg-slate-50/50'
                  } transition-colors`}
                >
                  {day && (
                    <>
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`w-7 h-7 flex items-center justify-center text-sm font-medium rounded-full ${
                            isToday
                              ? 'bg-indigo-500 text-white'
                              : isWeekend
                                ? index % 7 === 0
                                  ? 'text-red-500'
                                  : 'text-blue-500'
                                : 'text-slate-700'
                          }`}
                        >
                          {day}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {tours.map((tour) => (
                          <div
                            key={tour.id}
                            className="px-1.5 py-1 bg-blue-100 text-blue-700 rounded text-xs truncate"
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
                          <div className="text-xs text-slate-400 pl-1">
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
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="px-4 py-3 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800">今日事項</h3>
              <p className="text-xs text-slate-400">2025年1月19日</p>
            </div>
            <div className="p-4">
              <p className="text-sm text-slate-500 text-center py-4">今日無事項</p>
            </div>
          </div>

          {/* Upcoming Departures */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="px-4 py-3 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800">即將出團</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {demoTours.filter(t => t.status === 'confirmed' || t.status === 'departed').slice(0, 4).map((tour) => (
                <div key={tour.id} className="px-4 py-3 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium text-slate-800">{tour.tour_code}</span>
                  </div>
                  <p className="text-xs text-slate-600 mb-1">{tour.tour_name}</p>
                  <p className="text-xs text-slate-400">{tour.start_date} | {tour.enrolled}人</p>
                </div>
              ))}
            </div>
          </div>

          {/* Event Legend */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <h3 className="font-semibold text-slate-800 mb-3">圖例說明</h3>
            <div className="space-y-2">
              {Object.entries(eventTypeConfig).map(([type, config]) => (
                <div key={type} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded ${config.color}`}></div>
                  <span className="text-sm text-slate-600">{config.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
