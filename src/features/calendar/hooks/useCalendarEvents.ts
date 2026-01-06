'use client'

import { formatDate } from '@/lib/utils/format-date'

import { useMemo, useEffect, useRef, useState, useCallback } from 'react'
import {
  useCalendarStore,
  useCalendarEventStore,
  useEmployeeStore,
  useTourStore,
  useOrderStore,
  useMemberStore,
  useCustomerStore,
  useAuthStore,
  useWorkspaceStore,
} from '@/stores'
import { logger } from '@/lib/utils/logger'
import { supabase } from '@/lib/supabase/client'
import { useCalendarFilters } from './useCalendarFilters'
import { useCalendarTransform } from './useCalendarTransform'
import { FullCalendarEvent } from '../types'
import type { CalendarEvent } from '@/types/calendar.types'

// 從 ISO 時間字串取得顯示用的時間（HH:MM）
const getDisplayTime = (isoString: string, allDay?: boolean): string => {
  if (allDay) return ''
  if (!isoString) return ''

  try {
    const date = new Date(isoString)
    if (isNaN(date.getTime())) return ''

    const timeStr = date.toLocaleTimeString('zh-TW', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Taipei',
    })

    if (timeStr === '00:00') return ''
    return timeStr
  } catch {
    return ''
  }
}

// 🔧 修正：從 ISO 時間字串取得台灣時區的日期（YYYY-MM-DD）
// 用於全天事件，避免 FullCalendar 時區轉換問題
const getDateInTaipei = (isoString: string): string => {
  if (!isoString) return ''
  try {
    const date = new Date(isoString)
    if (isNaN(date.getTime())) return isoString
    // 使用 sv-SE locale 取得 YYYY-MM-DD 格式
    return date.toLocaleDateString('sv-SE', { timeZone: 'Asia/Taipei' })
  } catch {
    return isoString
  }
}

export function useCalendarEvents() {
  const { items: tours, fetchAll: fetchTours } = useTourStore()
  const { items: orders, fetchAll: fetchOrders } = useOrderStore()
  const { items: members, fetchAll: fetchMembers } = useMemberStore()
  const { items: customers, fetchAll: fetchCustomers } = useCustomerStore()
  const { settings } = useCalendarStore()
  const { items: calendarEvents, fetchAll: fetchCalendarEvents } = useCalendarEventStore()
  const { user } = useAuthStore()
  const { items: employees, fetchAll: fetchEmployees } = useEmployeeStore()
  const { workspaces, loadWorkspaces } = useWorkspaceStore()

  // Workspace 篩選狀態（只有超級管理員能用）
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null)
  const isSuperAdmin = user?.roles?.includes('super_admin') || user?.permissions?.includes('super_admin')

  // 初始化時從 localStorage 讀取篩選狀態
  const workspaceInitRef = useRef(false)
  useEffect(() => {
    if (isSuperAdmin && !workspaceInitRef.current) {
      workspaceInitRef.current = true
      const saved = localStorage.getItem('calendar_workspace_filter')
      setSelectedWorkspaceId(saved)
      loadWorkspaces()
    }
  }, [isSuperAdmin, loadWorkspaces])

  // 確保資料已載入（當用戶登入後才載入）
  const initializedRef = useRef(false)
  useEffect(() => {
    // 等待用戶資料載入後才開始抓取
    if (!user?.id) return

    if (!initializedRef.current) {
      initializedRef.current = true
      logger.log('[Calendar] 載入行事曆所需資料...')
      logger.log('[Calendar] 當前用戶:', {
        id: user?.id,
        workspace_id: user?.workspace_id,
        roles: user?.roles,
        isSuperAdmin,
      })
      // 載入所有行事曆需要的資料
      fetchCalendarEvents()
      fetchEmployees()
      fetchTours()
      fetchOrders()
      fetchMembers()
      fetchCustomers() // 🔧 修正：載入客戶資料以顯示客戶生日

      // 顯示載入的資料數量（除錯用）
      setTimeout(() => {
        logger.log('[Calendar] 資料載入完成，tours 數量:', tours?.length || 0)
      }, 2000)
    }
  }, [fetchCalendarEvents, fetchEmployees, fetchTours, fetchOrders, fetchMembers, fetchCustomers, user, isSuperAdmin, tours?.length])

  // Realtime 訂閱：當其他人新增/修改/刪除行事曆事件時，自動更新
  useEffect(() => {
    const channel = supabase
      .channel('calendar_events_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'calendar_events' },
        (payload) => {
          logger.log('[Calendar] Realtime 收到更新:', payload.eventType)
          // 重新抓取資料
          fetchCalendarEvents()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchCalendarEvents])

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

  // 轉換旅遊團為日曆事件（過濾掉特殊團和已封存的）
  const tourEvents: FullCalendarEvent[] = useMemo(() => {
    logger.log('[Calendar] 轉換 tours，原始數量:', tours?.length || 0)
    return (tours || [])
      .filter(tour => tour.status !== '特殊團' && !tour.archived) // 過濾掉簽證專用團等特殊團，以及已封存的
      .map(tour => {
        const color = getEventColor('tour', tour.status || '提案')
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
  }, [tours, orders, members, getEventColor])

  // 轉換個人事項為日曆事件（只顯示當前用戶的個人事項）
  const personalCalendarEvents: FullCalendarEvent[] = useMemo(() => {
    if (!user?.id) return []

    return (calendarEvents || [])
      .filter(event => event.visibility === 'personal' && event.created_by === user.id)
      .map(event => {
        const color = getEventColor('personal')
        const isAllDay = event.all_day ?? false // 轉換 null 為 false
        const timeStr = getDisplayTime(event.start, isAllDay)
        const displayTitle = timeStr ? `${timeStr} ${event.title}` : event.title

        // 🔧 修正：全天事件只傳日期字串，避免 FullCalendar 時區轉換問題
        const startDate = isAllDay ? getDateInTaipei(event.start) : event.start
        const endDate = event.end ? (isAllDay ? getDateInTaipei(event.end) : event.end) : undefined

        return {
          id: event.id,
          title: displayTitle,
          start: startDate,
          end: endDate,
          allDay: isAllDay || undefined, // FullCalendar 期望 boolean | undefined
          backgroundColor: color.bg,
          borderColor: color.border,
          extendedProps: {
            type: 'personal' as const,
            description: event.description ?? undefined,
          },
        }
      })
  }, [calendarEvents, getEventColor, user?.id])

  // 轉換公司事項為日曆事件
  const companyCalendarEvents: FullCalendarEvent[] = useMemo(() => {
    // 🔍 診斷日誌：查看載入的行事曆事件
    logger.log('[Calendar] calendarEvents 總數:', calendarEvents?.length || 0)
    logger.log('[Calendar] 公司事件數量:', calendarEvents?.filter(e => e.visibility === 'company').length || 0)

    return (calendarEvents || [])
      .filter(event => {
        if (event.visibility !== 'company') return false
        // 超級管理員且有選擇特定 workspace，則只顯示該 workspace 的事項
        if (isSuperAdmin && selectedWorkspaceId) {
          return (event as CalendarEvent).workspace_id === selectedWorkspaceId
        }
        return true
      })
      .map(event => {
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

        const isAllDay = event.all_day ?? false // 轉換 null 為 false
        const timeStr = getDisplayTime(event.start, isAllDay)
        const displayTitle = timeStr
          ? `${timeStr} 公司｜${event.title}`
          : `公司｜${event.title}`

        // 🔧 修正：全天事件只傳日期字串，避免 FullCalendar 時區轉換問題
        const startDate = isAllDay ? getDateInTaipei(event.start) : event.start
        const endDate = event.end ? (isAllDay ? getDateInTaipei(event.end) : event.end) : undefined

        return {
          id: event.id,
          title: displayTitle,
          start: startDate,
          end: endDate,
          allDay: isAllDay || undefined, // FullCalendar 期望 boolean | undefined
          backgroundColor: color.bg,
          borderColor: color.border,
          extendedProps: {
            type: 'company' as const,
            description: event.description ?? undefined,
            created_by: event.created_by ?? undefined,
            creator_name: creatorName, // 保留在 extendedProps，詳細頁面可以用
          },
        } as FullCalendarEvent
      })
  }, [calendarEvents, getEventColor, employees, user, isSuperAdmin, selectedWorkspaceId])

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
        if (!customer?.date_of_birth) return null

        // 計算今年的生日日期
        const birthdayThisYear = `${currentYear}-${customer.date_of_birth.slice(5)}`

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

  // 合併所有事件（生日改用獨立彈窗顯示，不在行事曆上顯示）
  const allEvents = useMemo(() => {
    return [...tourEvents, ...personalCalendarEvents, ...companyCalendarEvents]
  }, [tourEvents, personalCalendarEvents, companyCalendarEvents])

  // 過濾事件（根據 settings）
  const filteredEvents = useMemo(() => {
    return allEvents.filter(event => {
      const type = event.extendedProps.type

      if (type === 'tour' && !settings.showTours) return false
      if (type === 'personal' && !settings.showPersonal) return false
      if (type === 'company' && !settings.showCompany) return false

      return true
    })
  }, [allEvents, settings])

  // 切換 workspace 篩選
  const handleWorkspaceFilterChange = useCallback((workspaceId: string | null) => {
    setSelectedWorkspaceId(workspaceId)
    if (workspaceId) {
      localStorage.setItem('calendar_workspace_filter', workspaceId)
    } else {
      localStorage.removeItem('calendar_workspace_filter')
    }
  }, [])

  return {
    filteredEvents,
    allEvents,
    // Workspace 篩選相關（只有超級管理員可用）
    isSuperAdmin,
    workspaces,
    selectedWorkspaceId,
    onWorkspaceFilterChange: handleWorkspaceFilterChange,
  }
}
