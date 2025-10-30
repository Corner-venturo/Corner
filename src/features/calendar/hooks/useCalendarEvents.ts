import { useMemo, useCallback } from 'react'
import {
  useTourStore,
  useOrderStore,
  useMemberStore,
  useCalendarStore,
  useCalendarEventStore,
  useAuthStore,
  useEmployeeStore,
} from '@/stores'
import { Tour } from '@/stores/types'
import { FullCalendarEvent } from '../types'

export function useCalendarEvents() {
  const { items: tours } = useTourStore()
  const { items: orders } = useOrderStore()
  const { items: members } = useMemberStore()
  const { settings } = useCalendarStore()
  const { items: calendarEvents } = useCalendarEventStore()
  const { user } = useAuthStore()
  const { items: employees } = useEmployeeStore()

  // 根據類型取得顏色 - 使用莫蘭迪配色
  const getEventColor = useCallback((type: string, status?: Tour['status']) => {
    if (type === 'tour' && status) {
      const colors: Record<Tour['status'], { bg: string; border: string }> = {
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
  const tourEvents: FullCalendarEvent[] = useMemo(() => {
    return (tours || [])
      .filter(tour => tour.status !== 'special') // 過濾掉簽證專用團等特殊團
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
          title: tour.name,
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

  // 轉換個人事項為日曆事件（只顯示當前用戶的個人事項）
  const personalCalendarEvents: FullCalendarEvent[] = useMemo(() => {
    if (!user?.id) return []

    return (calendarEvents || [])
      .filter(event => event.visibility === 'personal' && event.created_by === user.id)
      .map(event => {
        const color = getEventColor('personal')
        return {
          id: event.id,
          title: event.title,
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
  }, [calendarEvents, getEventColor, user?.id])

  // 轉換公司事項為日曆事件
  const companyCalendarEvents: FullCalendarEvent[] = useMemo(() => {
    return (calendarEvents || [])
      .filter(event => event.visibility === 'company')
      .map(event => {
        const color = getEventColor('company')

        // 找出建立者姓名（用於詳細頁面）
        // 優先檢查當前登入用戶，再檢查員工列表
        let creatorName = '未知使用者'
        if (user?.id === event.created_by) {
          creatorName =
            user.display_name ||
            user.chinese_name ||
            user.english_name ||
            user.name ||
            user.email ||
            '未知使用者'
        } else {
          const creator = employees?.find(emp => emp.id === event.created_by)
          creatorName =
            creator?.display_name ||
            creator?.chinese_name ||
            creator?.english_name ||
            creator?.name ||
            '未知使用者'
        }

        // 🔥 修正 FullCalendar 的多日事件顯示問題
        // 如果有 end，則需要加一天才能正確顯示跨日事件（FullCalendar 的 end 是 exclusive）
        let end_date = event.end
        if (end_date && end_date !== event.start) {
          const endDateObj = new Date(end_date)
          endDateObj.setDate(endDateObj.getDate() + 1)
          end_date = endDateObj.toISOString().split('T')[0]
        }

        return {
          id: event.id,
          title: event.title, // 行事曆上不顯示建立者
          start: event.start,
          end: end_date,
          backgroundColor: color.bg,
          borderColor: color.border,
          extendedProps: {
            type: 'company' as const,
            description: event.description,
            created_by: event.created_by,
            creator_name: creatorName, // 保留在 extendedProps，詳細頁面可以用
          },
        }
      })
  }, [calendarEvents, getEventColor, employees])

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
          title: `${member.name} 生日`,
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

  return {
    filteredEvents,
    allEvents,
  }
}
