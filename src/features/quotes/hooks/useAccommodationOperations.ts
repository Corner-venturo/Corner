'use client'

import { useCallback } from 'react'
import { CostItem, CostCategory } from '../types'

interface UseAccommodationOperationsProps {
  categories: CostCategory[]
  setCategories: React.Dispatch<React.SetStateAction<CostCategory[]>>
  accommodationDays: number
  setAccommodationDays: (days: number) => void
}

export const useAccommodationOperations = ({
  categories,
  setCategories,
  accommodationDays,
  setAccommodationDays,
}: UseAccommodationOperationsProps) => {
  // 住宿：新增房型（在所有現有天數都新增同樣的房型）
  const handleAddAccommodationRoomType = useCallback(() => {
    if (accommodationDays === 0) return // 必須先有天數

    const timestamp = Date.now()
    const newItems: CostItem[] = []

    // 為每一天都新增同樣的房型
    for (let day = 1; day <= accommodationDays; day++) {
      newItems.push({
        id: `accommodation-day${day}-${timestamp}`,
        name: '',
        quantity: 0,
        unit_price: 0,
        total: 0,
        note: '',
        day: day,
        room_type: '',
      })
    }

    setCategories(prev =>
      prev.map(cat => {
        if (cat.id === 'accommodation') {
          return {
            ...cat,
            items: [...cat.items, ...newItems],
          }
        }
        return cat
      })
    )
  }, [accommodationDays, setCategories])

  // 住宿：新增天數（同時自動添加午餐和晚餐）
  const handleAddAccommodationDay = useCallback(() => {
    const newDayCount = accommodationDays + 1
    setAccommodationDays(newDayCount)

    // 新增一天，預設加一個空房型
    const timestamp = Date.now()
    const newAccommodationItem: CostItem = {
      id: `accommodation-day${newDayCount}-${timestamp}`,
      name: '',
      quantity: 0,
      unit_price: 0,
      total: 0,
      note: '',
      day: newDayCount,
      room_type: '',
    }

    // 自動新增該天的午餐和晚餐
    const newLunchItem: CostItem = {
      id: `meal-lunch-day${newDayCount}-${timestamp}`,
      name: `Day ${newDayCount} 午餐 - `,
      quantity: 1,
      unit_price: 0,
      total: 0,
      note: '',
    }

    const newDinnerItem: CostItem = {
      id: `meal-dinner-day${newDayCount}-${timestamp}`,
      name: `Day ${newDayCount} 晚餐 - `,
      quantity: 1,
      unit_price: 0,
      total: 0,
      note: '',
    }

    setCategories(prev =>
      prev.map(cat => {
        if (cat.id === 'accommodation') {
          return {
            ...cat,
            items: [...cat.items, newAccommodationItem],
          }
        }
        if (cat.id === 'meals') {
          return {
            ...cat,
            items: [...cat.items, newLunchItem, newDinnerItem],
          }
        }
        return cat
      })
    )
  }, [accommodationDays, setAccommodationDays, setCategories])

  return {
    handleAddAccommodationRoomType,
    handleAddAccommodationDay,
  }
}
