import { useMemo } from 'react'
import {
  CostCategory,
  ParticipantCounts,
  SellingPrices,
  IdentityCosts,
  IdentityProfits,
  AccommodationSummaryItem,
  CostItem,
} from '../types'

interface UseQuoteCalculationsProps {
  categories: CostCategory[]
  participantCounts: ParticipantCounts
  sellingPrices: SellingPrices
}

export const useQuoteCalculations = ({
  categories,
  participantCounts,
  sellingPrices,
}: UseQuoteCalculationsProps) => {
  // 計算住宿的房型位置平均費用
  const accommodationSummary = useMemo<AccommodationSummaryItem[]>(() => {
    const accommodationCategory = categories.find(cat => cat.id === 'accommodation')
    if (!accommodationCategory || accommodationCategory.items.length === 0) return []

    const accommodationItems = accommodationCategory.items.filter(item => item.day !== undefined)
    const groupedByDay: Record<number, CostItem[]> = {}

    // 按天分組
    accommodationItems.forEach(item => {
      const day = item.day!
      if (!groupedByDay[day]) groupedByDay[day] = []
      groupedByDay[day].push(item)
    })

    const days = Object.keys(groupedByDay)
      .map(d => Number(d))
      .sort((a, b) => a - b)
    if (days.length === 0) return []

    // 找出最大房型數量
    const maxRoomTypes = Math.max(...days.map(day => groupedByDay[day].length))
    const roomTypeSummaries: AccommodationSummaryItem[] = []

    // 按房型位置計算
    for (let roomIndex = 0; roomIndex < maxRoomTypes; roomIndex++) {
      let total_cost = 0
      let roomTypeName = ''
      let validDays = 0
      let totalCapacity = 0
      let capacityCount = 0

      days.forEach(day => {
        const dayItems = groupedByDay[day]
        if (dayItems[roomIndex]) {
          total_cost += dayItems[roomIndex].total
          validDays++
          if (!roomTypeName && dayItems[roomIndex].name) {
            roomTypeName = dayItems[roomIndex].name
          }
          // 記錄人數
          if (dayItems[roomIndex].quantity && dayItems[roomIndex].quantity > 0) {
            totalCapacity += dayItems[roomIndex].quantity
            capacityCount++
          }
        }
      })

      if (validDays > 0) {
        // 計算平均人數，如果沒有填寫則預設為2
        const avgCapacity = capacityCount > 0 ? Math.round(totalCapacity / capacityCount) : 2

        roomTypeSummaries.push({
          name: roomTypeName || `房型${roomIndex + 1}`,
          total_cost,
          averageCost: total_cost / validDays,
          days: validDays,
          capacity: avgCapacity,
        })
      }
    }

    return roomTypeSummaries
  }, [categories])

  // 住宿總成本 = 房型一總成本 + 房型二總成本 + ...
  const accommodationTotal = useMemo(
    () => accommodationSummary.reduce((sum, room) => sum + room.total_cost, 0),
    [accommodationSummary]
  )

  // 更新住宿分類的總計為房型加總
  const updatedCategories = useMemo(
    () =>
      categories.map(cat => {
        if (cat.id === 'accommodation') {
          return { ...cat, total: accommodationTotal }
        }
        return cat
      }),
    [categories, accommodationTotal]
  )

  // 計算各身份的總成本
  const identityCosts = useMemo<IdentityCosts>(() => {
    const costs: IdentityCosts = {
      adult: 0,
      child_with_bed: 0,
      child_no_bed: 0,
      single_room: 0,
      infant: 0,
    }

    updatedCategories.forEach(category => {
      if (category.id === 'accommodation') {
        // 住宿特殊處理：只計算每天的第一個房型
        const accommodationItems = category.items.filter(item => item.day !== undefined)
        const groupedByDay: Record<number, CostItem[]> = {}

        // 按天分組
        accommodationItems.forEach(item => {
          const day = item.day!
          if (!groupedByDay[day]) groupedByDay[day] = []
          groupedByDay[day].push(item)
        })

        // 只取每天的第一個房型
        Object.keys(groupedByDay).forEach(dayStr => {
          const dayItems = groupedByDay[Number(dayStr)]
          if (dayItems.length > 0) {
            const firstRoomType = dayItems[0] // 只取第一個房型
            const roomTotal = firstRoomType.total || 0 // 使用小計（已經除過人數）

            // 成人和小孩 = 房型1小計（每人住宿費）
            costs.adult += roomTotal
            costs.child_with_bed += roomTotal

            // 單人房 = 房型1單價（全額）
            const roomPrice = firstRoomType.unit_price || 0
            costs.single_room += roomPrice
          }
        })
      } else {
        // 其他類別照常計算
        category.items.forEach(item => {
          if (category.id === 'transport') {
            // 交通類別：依照項目名稱區分身份
            if (item.name === '成人機票') {
              // 成人機票：只加給成人和單人房
              costs.adult += item.adult_price || 0
              costs.single_room += item.adult_price || 0
            } else if (item.name === '小孩機票') {
              // 小孩機票：只加給小孩（佔床、不佔床）
              costs.child_with_bed += item.child_price || 0
              costs.child_no_bed += item.child_price || 0
            } else if (item.name === '嬰兒機票') {
              // 嬰兒機票：只加給嬰兒
              costs.infant += item.infant_price || 0
            } else {
              // 其他交通費用（遊覽車等統一價）：成人、小孩佔床、單人房
              const itemCost = item.unit_price || 0
              costs.adult += itemCost
              costs.child_with_bed += itemCost
              costs.single_room += itemCost
              // 不佔床和嬰兒不含一般交通
            }
          } else if (
            category.id === 'meals' ||
            category.id === 'activities' ||
            category.id === 'others'
          ) {
            // 餐飲、活動、其他：成人、小朋友佔床、單人房有，不佔床和嬰兒沒有
            const itemCost = item.unit_price || 0
            costs.adult += itemCost
            costs.child_with_bed += itemCost
            // 不佔床不含餐飲和活動
            costs.single_room += itemCost
            // 嬰兒不含餐飲和活動
          } else if (category.id === 'group-transport' || category.id === 'guide') {
            // 團體分攤、領隊導遊：不含嬰兒的身份分攤
            const itemCost = item.total || 0
            costs.adult += itemCost
            costs.child_with_bed += itemCost
            costs.child_no_bed += itemCost
            costs.single_room += itemCost
            // 嬰兒不分攤導遊費用
          }
        })
      }
    })

    return costs
  }, [updatedCategories])

  // 計算總成本（每個身份成本 × 人數）
  const total_cost = useMemo(
    () =>
      identityCosts.adult * participantCounts.adult +
      identityCosts.child_with_bed * participantCounts.child_with_bed +
      identityCosts.child_no_bed * participantCounts.child_no_bed +
      identityCosts.single_room * participantCounts.single_room +
      identityCosts.infant * participantCounts.infant,
    [identityCosts, participantCounts]
  )

  // 計算各身份的利潤
  const identityProfits = useMemo<IdentityProfits>(
    () => ({
      adult: sellingPrices.adult - identityCosts.adult,
      child_with_bed: sellingPrices.child_with_bed - identityCosts.child_with_bed,
      child_no_bed: sellingPrices.child_no_bed - identityCosts.child_no_bed,
      single_room: sellingPrices.single_room - identityCosts.single_room,
      infant: sellingPrices.infant - identityCosts.infant,
    }),
    [sellingPrices, identityCosts]
  )

  return {
    accommodationSummary,
    accommodationTotal,
    updatedCategories,
    identityCosts,
    identityProfits,
    total_cost,
  }
}
