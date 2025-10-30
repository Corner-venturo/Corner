import { useCallback } from 'react'
import { CostItem, CostCategory } from '../types'

interface UseCategoryOperationsProps {
  categories: CostCategory[]
  setCategories: React.Dispatch<React.SetStateAction<CostCategory[]>>
  accommodationDays: number
  setAccommodationDays: (days: number) => void
  groupSize: number
  groupSizeForGuide: number
}

export const useCategoryOperations = ({
  categories,
  setCategories,
  accommodationDays,
  setAccommodationDays,
  groupSize,
  groupSizeForGuide,
}: UseCategoryOperationsProps) => {
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

  const handleAddRow = useCallback(
    (category_id: string) => {
      if (category_id === 'accommodation') {
        // 住宿用專用函數
        handleAddAccommodationRoomType()
        return
      }

      const newItem: CostItem = {
        id: Date.now().toString(),
        name: '',
        quantity: 0,
        unit_price: 0,
        total: 0,
        note: '',
      }

      setCategories(prev =>
        prev.map(cat => {
          if (cat.id === category_id) {
            return {
              ...cat,
              items: [...cat.items, newItem],
            }
          }
          return cat
        })
      )
    },
    [handleAddAccommodationRoomType, setCategories]
  )

  // 使用特定的 categories 來計算領隊費用
  const calculateGuideWithCategories = useCallback((categories: CostCategory[]) => {
    // 1. 計算住宿每日第一個房型的單價總和
    const accommodationCategory = categories.find(cat => cat.id === 'accommodation')
    let dailyFirstRoomCost = 0

    if (accommodationCategory && accommodationCategory.items.length > 0) {
      const accommodationItems = accommodationCategory.items.filter(item => item.day !== undefined)
      const groupedByDay: Record<number, CostItem[]> = {}

      // 按天分組
      accommodationItems.forEach(item => {
        const day = item.day!
        if (!groupedByDay[day]) groupedByDay[day] = []
        groupedByDay[day].push(item)
      })

      // 計算每天第一個房型的單價
      Object.keys(groupedByDay).forEach(dayStr => {
        const dayItems = groupedByDay[Number(dayStr)]
        if (dayItems.length > 0) {
          dailyFirstRoomCost += dayItems[0].unit_price || 0
        }
      })
    }

    // 2. 計算成人機票費用
    const transportCategory = categories.find(cat => cat.id === 'transport')
    let adultTicketCost = 0

    if (transportCategory && transportCategory.items.length > 0) {
      const adultTicket = transportCategory.items.find(item => item.name === '成人機票')
      if (adultTicket) {
        adultTicketCost = adultTicket.adult_price || 0
      }
    }

    // 3. 領隊總成本 = 住宿第一房型總和 + 成人機票費用（不除法）
    const totalGuideCost = dailyFirstRoomCost + adultTicketCost

    return totalGuideCost
  }, [])

  // 更新所有領隊分攤項目
  const updateGuideItems = useCallback(
    (categories: CostCategory[]) => {
      // 重新計算領隊費用
      const totalGuideCost = calculateGuideWithCategories(categories)

      return categories.map(cat => {
        if (cat.id === 'group-transport') {
          const updatedItems = cat.items.map(item => {
            if (item.name === '領隊分攤') {
              const effectiveQuantity = item.quantity && item.quantity !== 1 ? item.quantity : 1
              return {
                ...item,
                unit_price: totalGuideCost,
                total:
                  groupSizeForGuide > 0
                    ? Math.ceil((totalGuideCost * effectiveQuantity) / groupSizeForGuide)
                    : 0,
              }
            }
            return item
          })

          return {
            ...cat,
            items: updatedItems,
            total: updatedItems.reduce((sum, item) => sum + item.total, 0),
          }
        }
        return cat
      })
    },
    [calculateGuideWithCategories, groupSizeForGuide]
  )

  // 新增導遊項目
  const handleAddGuideRow = useCallback(
    (category_id: string) => {
      const totalGuideCost = calculateGuideWithCategories(categories)

      const newItem: CostItem = {
        id: Date.now().toString(),
        name: '領隊分攤',
        quantity: 1,
        unit_price: totalGuideCost,
        total: groupSizeForGuide > 0 ? Math.ceil(totalGuideCost / groupSizeForGuide) : 0,
        note: '自動計算：住宿第一房型 + 成人機票',
      }

      setCategories(prev =>
        prev.map(cat => {
          if (cat.id === category_id) {
            return {
              ...cat,
              items: [...cat.items, newItem],
            }
          }
          return cat
        })
      )
    },
    [categories, calculateGuideWithCategories, groupSizeForGuide, setCategories]
  )

  // 新增成人機票
  const handleAddAdultTicket = useCallback(
    (category_id: string) => {
      const newItem: CostItem = {
        id: Date.now().toString(),
        name: '成人機票',
        quantity: 0,
        unit_price: 0,
        total: 0,
        note: '',
        pricing_type: 'by_identity',
        adult_price: 0,
      }

      setCategories(prev =>
        prev.map(cat => {
          if (cat.id === category_id) {
            return {
              ...cat,
              items: [...cat.items, newItem],
            }
          }
          return cat
        })
      )
    },
    [setCategories]
  )

  // 新增小孩機票
  const handleAddChildTicket = useCallback(
    (category_id: string) => {
      const newItem: CostItem = {
        id: Date.now().toString(),
        name: '小孩機票',
        quantity: 0,
        unit_price: 0,
        total: 0,
        note: '',
        pricing_type: 'by_identity',
        child_price: 0,
      }

      setCategories(prev =>
        prev.map(cat => {
          if (cat.id === category_id) {
            return {
              ...cat,
              items: [...cat.items, newItem],
            }
          }
          return cat
        })
      )
    },
    [setCategories]
  )

  // 新增嬰兒機票
  const handleAddInfantTicket = useCallback(
    (category_id: string) => {
      const newItem: CostItem = {
        id: Date.now().toString(),
        name: '嬰兒機票',
        quantity: 0,
        unit_price: 0,
        total: 0,
        note: '',
        pricing_type: 'by_identity',
        infant_price: 0,
      }

      setCategories(prev =>
        prev.map(cat => {
          if (cat.id === category_id) {
            return {
              ...cat,
              items: [...cat.items, newItem],
            }
          }
          return cat
        })
      )
    },
    [setCategories]
  )

  // 住宿：新增天數
  const handleAddAccommodationDay = useCallback(() => {
    const newDayCount = accommodationDays + 1
    setAccommodationDays(newDayCount)

    // 新增一天，預設加一個空房型
    const timestamp = Date.now()
    const newItem: CostItem = {
      id: `accommodation-day${newDayCount}-${timestamp}`,
      name: '',
      quantity: 0,
      unit_price: 0,
      total: 0,
      note: '',
      day: newDayCount,
      room_type: '',
    }

    setCategories(prev =>
      prev.map(cat => {
        if (cat.id === 'accommodation') {
          return {
            ...cat,
            items: [...cat.items, newItem],
          }
        }
        return cat
      })
    )
  }, [accommodationDays, setAccommodationDays, setCategories])

  const handleUpdateItem = useCallback(
    (category_id: string, itemId: string, field: keyof CostItem, value: unknown) => {
      setCategories(prev => {
        const newCategories = prev.map(cat => {
          if (cat.id === category_id) {
            const updatedItems = cat.items.map(item => {
              if (item.id === itemId) {
                const updatedItem = { ...item, [field]: value }
                // 自動計算總價
                if (
                  field === 'quantity' ||
                  field === 'unit_price' ||
                  field === 'is_group_cost' ||
                  field === 'adult_price' ||
                  field === 'child_price' ||
                  field === 'infant_price'
                ) {
                  // 數量預設為 1，只有當用戶輸入時才使用輸入值
                  const effectiveQuantity =
                    updatedItem.quantity === 0 ? 1 : updatedItem.quantity || 1

                  // 成人、小孩、嬰兒機票：顯示對應票價在小計欄位
                  if (updatedItem.name === '成人機票') {
                    updatedItem.total = updatedItem.adult_price || 0
                  } else if (updatedItem.name === '小孩機票') {
                    updatedItem.total = updatedItem.child_price || 0
                  } else if (updatedItem.name === '嬰兒機票') {
                    updatedItem.total = updatedItem.infant_price || 0
                  } else if (category_id === 'accommodation') {
                    // 住宿特殊邏輯：小計 = 單價 ÷ 人數
                    updatedItem.total =
                      effectiveQuantity > 0
                        ? Math.ceil((updatedItem.unit_price || 0) / effectiveQuantity)
                        : 0
                  } else if (
                    (category_id === 'transport' || category_id === 'guide') &&
                    updatedItem.is_group_cost &&
                    groupSize > 1
                  ) {
                    // 交通和領隊導遊的團體分攤邏輯：小計 = (數量 × 單價) ÷ 團體人數
                    const total_cost = effectiveQuantity * (updatedItem.unit_price || 0)
                    updatedItem.total = Math.ceil(total_cost / groupSize)
                  } else if (category_id === 'group-transport') {
                    // 團體分攤分類：自動執行團體分攤邏輯
                    if (updatedItem.name === '領隊分攤') {
                      // 領隊分攤：(單價 × 數量) ÷ 人數（不含嬰兒）
                      const guideTotalCost = (updatedItem.unit_price || 0) * effectiveQuantity
                      updatedItem.total =
                        groupSizeForGuide > 0 ? Math.ceil(guideTotalCost / groupSizeForGuide) : 0
                    } else if (groupSizeForGuide > 1) {
                      // 其他團體分攤項目：執行一般團體分攤邏輯（不含嬰兒）
                      const total_cost = effectiveQuantity * (updatedItem.unit_price || 0)
                      updatedItem.total = Math.ceil(total_cost / groupSizeForGuide)
                    } else {
                      // 人數為1時，不分攤
                      updatedItem.total = Math.ceil(
                        effectiveQuantity * (updatedItem.unit_price || 0)
                      )
                    }
                  } else {
                    // 一般邏輯：小計 = 數量 × 單價
                    updatedItem.total = Math.ceil(effectiveQuantity * (updatedItem.unit_price || 0))
                  }
                }
                return updatedItem
              }
              return item
            })

            return {
              ...cat,
              items: updatedItems,
              total: updatedItems.reduce((sum, item) => sum + item.total, 0),
            }
          }
          return cat
        })

        // 如果有住宿或交通數據變更，需要更新所有領隊分攤項目
        if (category_id === 'accommodation' || category_id === 'transport') {
          return updateGuideItems(newCategories)
        }

        return newCategories
      })
    },
    [groupSize, groupSizeForGuide, setCategories, updateGuideItems]
  )

  const handleRemoveItem = useCallback(
    (category_id: string, itemId: string) => {
      setCategories(prev =>
        prev.map(cat => {
          if (cat.id === category_id) {
            const updatedItems = cat.items.filter(item => item.id !== itemId)

            // 如果是住宿類別，需要重新計算天數並重新編號
            if (category_id === 'accommodation' && updatedItems.length > 0) {
              // 取得所有唯一的天數
              const uniqueDays = Array.from(
                new Set(updatedItems.map(item => item.day).filter(d => d !== undefined))
              )
              uniqueDays.sort((a, b) => a! - b!)

              // 重新編號天數（從 1 開始）
              const reorderedItems = updatedItems.map(item => {
                const oldDay = item.day
                const newDay = uniqueDays.findIndex(d => d === oldDay) + 1
                return {
                  ...item,
                  day: newDay,
                }
              })

              // 更新 accommodationDays 為實際天數
              const actualDays = Math.max(...reorderedItems.map(item => item.day || 0))
              setAccommodationDays(actualDays)

              return {
                ...cat,
                items: reorderedItems,
                total: reorderedItems.reduce((sum, item) => sum + item.total, 0),
              }
            }

            return {
              ...cat,
              items: updatedItems,
              total: updatedItems.reduce((sum, item) => sum + item.total, 0),
            }
          }
          return cat
        })
      )
    },
    [setAccommodationDays, setCategories]
  )

  return {
    handleAddRow,
    handleAddGuideRow,
    handleAddAdultTicket,
    handleAddChildTicket,
    handleAddInfantTicket,
    handleAddAccommodationDay,
    handleAddAccommodationRoomType,
    handleUpdateItem,
    handleRemoveItem,
    calculateGuideWithCategories,
    updateGuideItems,
  }
}
