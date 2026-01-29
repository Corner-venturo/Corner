'use client'

import { formatDate, toTaipeiDateString, toTaipeiTimeString } from '@/lib/utils/format-date'

import { useMemo, useCallback } from 'react'
import { useToursSlim, useMembersSlim, useCustomersSlim, useEmployeesSlim } from '@/data'
import { useAuthStore } from '@/stores'
import { Tour } from '@/stores/types'
import { FullCalendarEvent } from '../types'

// 定義 CalendarEvent 類型（從 store 推斷）
interface CalendarEvent {
  id: string
  title: string
  start: string
  end?: string
  all_day?: boolean
  visibility?: 'personal' | 'company'
  description?: string
  created_by?: string
  workspace_id?: string
}

// 從 ISO 時間字串取得顯示用的時間（HH:MM）
const getDisplayTime = (isoString: string, allDay?: boolean): string => {
  if (allDay) return ''
  return toTaipeiTimeString(isoString, { skipMidnight: true })
}

// 從 ISO 時間字串取得台灣時區的日期（YYYY-MM-DD）
// 用於全天事件，避免 FullCalendar 時區轉換問題
const getDateInTaipei = (isoString: string): string => {
  return toTaipeiDateString(isoString) || isoString
}

/**
 * 行事曆資料轉換邏輯
 * 將各種資料來源轉換為 FullCalendarEvent 格式：
 * 1. Tours → Tour Events
 * 2. CalendarEvents (personal) → Personal Calendar Events
 * 3. CalendarEvents (company) → Company Calendar Events
 * 4. Members/Customers → Birthday Events
 */
export function useCalendarTransform(calendarEvents: CalendarEvent[]) {
  const { items: tours } = useToursSlim()
  // P2 效能優化：移除 orders 完整載入
  // 改用 tour.current_participants denormalized 欄位計算團員數
  // members 保留用於生日事件（無 N+1 問題）
  const { items: members } = useMembersSlim()
  const { items: customers } = useCustomersSlim()
  const { items: employees } = useEmployeesSlim()
  const { user } = useAuthStore()

  // 根據類型取得顏色 - 使用莫蘭迪配色
  const getEventColor = useCallback((type: string, status?: string) => {
    if (type === 'tour' && status) {
      const colors: Record<string, { bg: string; border: string }> = {
        draft: { bg: '#9BB5D6', border: '#8AA4C5' }, // 提案
        active: { bg: '#A8C4A2', border: '#97B391' }, // 進行中
        pending_close: { bg: '#D4B896', border: '#C3A785' }, // 待結案
        closed: { bg: '#B8B3AE', border: '#A7A29D' }, // 結案
        cancelled: { bg: '#B8B3AE', border: '#A7A29D' }, // 已取消
        special: { bg: '#D4A5A5', border: '#C39494' }, // 特殊團
      }
      return colors[status] || colors.draft
    }

    const colors = {
      personal: { bg: '#B8A9D1', border: '#A798C0' },
      birthday: { bg: '#E6B8C8', border: '#D5A7B7' },
      company: { bg: '#E0C3A0', border: '#CFB28F' },
    }
    return colors[type as keyof typeof colors] || { bg: '#B8B3AE', border: '#A7A29D' }
  }, [])

  // 轉換旅遊團為日曆事件（過濾掉特殊團）
  // P2 效能優化：使用 tour.current_participants 替代 N+1 查詢
  // 原本：O(tours × orders × members) = O(n³)
  // 現在：O(tours) = O(n)
  const tourEvents: FullCalendarEvent[] = useMemo(() => {
    return (tours || [])
      .filter(tour => tour.status !== '特殊團') // 過濾掉簽證專用團等特殊團
      .map(tour => {
        const color = getEventColor('tour', tour.status || '提案')
        // 使用 denormalized 欄位，避免 N+1 查詢
        const actualMembers = tour.current_participants || 0

        // 修正 FullCalendar 的多日事件顯示問題
        // 如果有 return_date，則需要加一天才能正確顯示跨日事件
        let end_date = tour.return_date
        if (end_date && end_date !== tour.departure_date) {
          const returnDateObj = new Date(end_date)
          returnDateObj.setDate(returnDateObj.getDate() + 1)
          end_date = formatDate(returnDateObj)
        }

        return {
          id: `tour-${tour.id}`,
          title: tour.name || '',
          start: tour.departure_date || '',
          end: end_date || '',
          backgroundColor: color.bg,
          borderColor: color.border,
          extendedProps: {
            type: 'tour' as const,
            tour_id: tour.id,
            code: tour.code || '',
            location: tour.location || '',
            participants: actualMembers,
            max_participants: tour.max_participants || 0,
            status: tour.status || '',
          },
        } as FullCalendarEvent
      })
  }, [tours, getEventColor])

  // 轉換個人事項為日曆事件
  const transformPersonalEvents = useCallback(
    (events: CalendarEvent[]): FullCalendarEvent[] => {
      return events.map(event => {
        const color = getEventColor('personal')
        const timeStr = getDisplayTime(event.start, event.all_day)
        const displayTitle = timeStr ? `${timeStr} ${event.title}` : event.title

        // 🔧 修正：全天事件只傳日期字串，避免 FullCalendar 時區轉換問題
        const startDate = event.all_day ? getDateInTaipei(event.start) : event.start
        const endDate = event.end ? (event.all_day ? getDateInTaipei(event.end) : event.end) : undefined

        return {
          id: event.id,
          title: displayTitle,
          start: startDate,
          end: endDate,
          allDay: event.all_day,
          backgroundColor: color.bg,
          borderColor: color.border,
          extendedProps: {
            type: 'personal' as const,
            description: event.description,
          },
        }
      })
    },
    [getEventColor]
  )

  // 轉換公司事項為日曆事件
  const transformCompanyEvents = useCallback(
    (events: CalendarEvent[]): FullCalendarEvent[] => {
      return events.map(event => {
        const color = getEventColor('company')

        // 找出建立者姓名（用於詳細頁面）
        // 優先檢查當前登入用戶，再檢查員工列表
        let creatorName = '未知使用者'
        if (user && user.id === event.created_by) {
          creatorName =
            user.display_name ||
            user.chinese_name ||
            user.english_name ||
            user.personal_info?.email ||
            '未知使用者'
        } else {
          const creator = employees?.find(emp => emp.id === event.created_by)
          creatorName =
            creator?.display_name ||
            creator?.chinese_name ||
            creator?.english_name ||
            '未知使用者'
        }

        const timeStr = getDisplayTime(event.start, event.all_day)
        const displayTitle = timeStr
          ? `${timeStr} 公司｜${event.title}`
          : `公司｜${event.title}`

        // 🔧 修正：全天事件只傳日期字串，避免 FullCalendar 時區轉換問題
        const startDate = event.all_day ? getDateInTaipei(event.start) : event.start
        const endDate = event.end ? (event.all_day ? getDateInTaipei(event.end) : event.end) : undefined

        return {
          id: event.id,
          title: displayTitle,
          start: startDate,
          end: endDate,
          allDay: event.all_day,
          backgroundColor: color.bg,
          borderColor: color.border,
          extendedProps: {
            type: 'company' as const,
            description: event.description,
            created_by: event.created_by,
            creator_name: creatorName, // 保留在 extendedProps，詳細頁面可以用
          },
        } as FullCalendarEvent
      })
    },
    [getEventColor, employees, user]
  )

  // 轉換會員生日為日曆事件
  const memberBirthdayEvents: FullCalendarEvent[] = useMemo(() => {
    const currentYear = new Date().getFullYear()

    return (members || [])
      .map(member => {
        if (!member?.birthday) return null

        // 計算今年的生日日期
        const birthdayThisYear = `${currentYear}-${member.birthday.slice(5)}`

        return {
          id: `member-birthday-${member.id}`,
          title: `🎂 ${member.name} 生日`,
          start: birthdayThisYear,
          backgroundColor: getEventColor('birthday').bg,
          borderColor: getEventColor('birthday').border,
          extendedProps: {
            type: 'birthday' as const,
            member_id: member.id,
            member_name: member.name,
            order_id: member.order_id,
            source: 'member' as const,
          },
        }
      })
      .filter(Boolean) as FullCalendarEvent[]
  }, [members, getEventColor])

  // 轉換客戶生日為日曆事件
  const customerBirthdayEvents: FullCalendarEvent[] = useMemo(() => {
    const currentYear = new Date().getFullYear()

    return (customers || [])
      .map(customer => {
        if (!customer?.birth_date) return null

        // 計算今年的生日日期
        const birthdayThisYear = `${currentYear}-${customer.birth_date.slice(5)}`

        return {
          id: `customer-birthday-${customer.id}`,
          title: `🎂 ${customer.name} 生日`,
          start: birthdayThisYear,
          backgroundColor: getEventColor('birthday').bg,
          borderColor: getEventColor('birthday').border,
          extendedProps: {
            type: 'birthday' as const,
            customer_id: customer.id,
            customer_name: customer.name,
            source: 'customer' as const,
          },
        }
      })
      .filter(Boolean) as FullCalendarEvent[]
  }, [customers, getEventColor])

  // 合併所有生日事件
  const birthdayEvents = useMemo(() => {
    return [...memberBirthdayEvents, ...customerBirthdayEvents]
  }, [memberBirthdayEvents, customerBirthdayEvents])

  return {
    tourEvents,
    birthdayEvents,
    transformPersonalEvents,
    transformCompanyEvents,
  }
}
