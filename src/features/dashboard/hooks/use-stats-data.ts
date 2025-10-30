'use client'

import { useMemo } from 'react'
import { useTourStore, useOrderStore } from '@/stores'
import type { StatConfig, StatType } from '../types'
import { CheckSquare, TrendingUp, Briefcase, Calendar } from 'lucide-react'

export function useStatsData() {
  const { items: tours } = useTourStore()
  const { items: orders } = useOrderStore()

  return useMemo(() => {
    // 過濾掉特殊團
    const normalTours = tours.filter(t => t.status !== 'special')

    // 計算本週時間範圍
    const today = new Date()
    const dayOfWeek = today.getDay()
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() + mondayOffset)
    weekStart.setHours(0, 0, 0, 0)

    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)

    // 下週時間範圍
    const nextWeekStart = new Date(weekStart)
    nextWeekStart.setDate(weekStart.getDate() + 7)
    const nextWeekEnd = new Date(nextWeekStart)
    nextWeekEnd.setDate(nextWeekStart.getDate() + 6)

    // 本月時間範圍
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999)

    // 本週出團數量（排除特殊團）
    const toursThisWeek = normalTours.filter(tour => {
      const departureDate = new Date(tour.departure_date)
      return departureDate >= weekStart && departureDate <= weekEnd
    }).length

    // 本月出團數量（排除特殊團）
    const toursThisMonth = normalTours.filter(tour => {
      const departureDate = new Date(tour.departure_date)
      return departureDate >= monthStart && departureDate <= monthEnd
    }).length

    // 本週請款金額（本週出發的團，排除特殊團）
    const paymentsThisWeek = orders
      .filter(order => {
        const tour = normalTours.find(t => t.id === order.tour_id)
        if (!tour) return false
        const departureDate = new Date(tour.departure_date)
        return departureDate >= weekStart && departureDate <= weekEnd
      })
      .reduce((sum, order) => sum + (order.total_amount || 0), 0)

    // 下週請款金額（下週出發的團，排除特殊團）
    const paymentsNextWeek = orders
      .filter(order => {
        const tour = normalTours.find(t => t.id === order.tour_id)
        if (!tour) return false
        const departureDate = new Date(tour.departure_date)
        return departureDate >= nextWeekStart && departureDate <= nextWeekEnd
      })
      .reduce((sum, order) => sum + (order.total_amount || 0), 0)

    // 本週甲存金額（本週出發的團已付款，排除特殊團）
    const depositsThisWeek = orders
      .filter(order => {
        const tour = normalTours.find(t => t.id === order.tour_id)
        if (!tour) return false
        const departureDate = new Date(tour.departure_date)
        return departureDate >= weekStart && departureDate <= weekEnd
      })
      .reduce((sum, order) => sum + (order.paid_amount || 0), 0)

    // 待辦事項數量（簡化版：未收齊款且即將出發的訂單，排除特殊團）
    const todosCount = orders.filter(order => {
      if (order.payment_status === 'paid') return false
      const tour = normalTours.find(t => t.id === order.tour_id)
      if (!tour) return false
      const departureDate = new Date(tour.departure_date)
      const daysUntilDeparture = Math.ceil(
        (departureDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      )
      return daysUntilDeparture <= 14 && daysUntilDeparture >= 0
    }).length

    const allStats: StatConfig[] = [
      {
        id: 'todos',
        label: '待辦事項',
        value: todosCount,
        icon: CheckSquare,
        color: 'text-morandi-gold',
        bgColor: 'bg-morandi-gold/10',
      },
      {
        id: 'paymentsThisWeek',
        label: '本週請款',
        value: `NT$ ${paymentsThisWeek.toLocaleString()}`,
        icon: TrendingUp,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
      },
      {
        id: 'paymentsNextWeek',
        label: '下週請款',
        value: `NT$ ${paymentsNextWeek.toLocaleString()}`,
        icon: TrendingUp,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
      },
      {
        id: 'depositsThisWeek',
        label: '本週甲存',
        value: `NT$ ${depositsThisWeek.toLocaleString()}`,
        icon: Briefcase,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
      },
      {
        id: 'toursThisWeek',
        label: '本週出團',
        value: `${toursThisWeek} 團`,
        icon: Calendar,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
      },
      {
        id: 'toursThisMonth',
        label: '本月出團',
        value: `${toursThisMonth} 團`,
        icon: Calendar,
        color: 'text-pink-600',
        bgColor: 'bg-pink-50',
      },
    ]

    return allStats
  }, [tours, orders])
}

export function useStatsConfig() {
  const loadStatsConfig = (): StatType[] => {
    if (typeof window === 'undefined') {
      return [
        'todos',
        'paymentsThisWeek',
        'paymentsNextWeek',
        'depositsThisWeek',
        'toursThisWeek',
        'toursThisMonth',
      ]
    }
    const saved = localStorage.getItem('homepage-stats-config')
    if (saved) {
      return JSON.parse(saved)
    }
    return [
      'todos',
      'paymentsThisWeek',
      'paymentsNextWeek',
      'depositsThisWeek',
      'toursThisWeek',
      'toursThisMonth',
    ]
  }

  return loadStatsConfig()
}

export function saveStatsConfig(config: StatType[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('homepage-stats-config', JSON.stringify(config))
  }
}
