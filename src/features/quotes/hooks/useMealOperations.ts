'use client'

import { useCallback } from 'react'
import { CostItem, CostCategory } from '../types'

interface UseMealOperationsProps {
  categories: CostCategory[]
  setCategories: React.Dispatch<React.SetStateAction<CostCategory[]>>
}

export const useMealOperations = ({
  categories,
  setCategories,
}: UseMealOperationsProps) => {
  // 計算餐食的下一個天數
  const getNextMealDay = useCallback((mealType: '午餐' | '晚餐') => {
    const mealsCategory = categories.find(cat => cat.id === 'meals')
    if (!mealsCategory || mealsCategory.items.length === 0) return 1

    // 找出該餐別最大的天數
    const regex = new RegExp(`Day\\s*(\\d+)\\s*${mealType}`)
    const maxDay = mealsCategory.items.reduce((max, item) => {
      const match = item.name.match(regex)
      if (match) {
        return Math.max(max, parseInt(match[1]))
      }
      return max
    }, 0)

    return maxDay + 1
  }, [categories])

  // 新增餐食（午餐）
  const handleAddLunchMeal = useCallback(
    (day?: number) => {
      const actualDay = day ?? getNextMealDay('午餐')
      const newItem: CostItem = {
        id: Date.now().toString(),
        name: `Day ${actualDay} 午餐 - `,
        quantity: 1,
        unit_price: 0,
        total: 0,
        note: '',
      }

      setCategories(prev =>
        prev.map(cat => {
          if (cat.id === 'meals') {
            return {
              ...cat,
              items: [...cat.items, newItem],
            }
          }
          return cat
        })
      )
    },
    [setCategories, getNextMealDay]
  )

  // 新增餐食（晚餐）
  const handleAddDinnerMeal = useCallback(
    (day?: number) => {
      const actualDay = day ?? getNextMealDay('晚餐')
      const newItem: CostItem = {
        id: Date.now().toString(),
        name: `Day ${actualDay} 晚餐 - `,
        quantity: 1,
        unit_price: 0,
        total: 0,
        note: '',
      }

      setCategories(prev =>
        prev.map(cat => {
          if (cat.id === 'meals') {
            return {
              ...cat,
              items: [...cat.items, newItem],
            }
          }
          return cat
        })
      )
    },
    [setCategories, getNextMealDay]
  )

  return {
    handleAddLunchMeal,
    handleAddDinnerMeal,
  }
}
