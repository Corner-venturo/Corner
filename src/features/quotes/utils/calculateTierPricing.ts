import {
  CostCategory,
  ParticipantCounts,
  IdentityCosts,
  CostItem,
} from '../types'

/**
 * 計算檻次表的各身份成本
 *
 * @param categories - 原始的費用分類資料
 * @param newParticipantCounts - 新的人數分布
 * @returns 重新計算後的各身份成本
 */
export function calculateTierPricingCosts(
  categories: CostCategory[],
  newParticipantCounts: ParticipantCounts
): IdentityCosts {
  const costs: IdentityCosts = {
    adult: 0,
    child_with_bed: 0,
    child_no_bed: 0,
    single_room: 0,
    infant: 0,
  }

  // 計算新的總人數（不含嬰兒）
  const totalParticipants =
    newParticipantCounts.adult +
    newParticipantCounts.child_with_bed +
    newParticipantCounts.child_no_bed +
    newParticipantCounts.single_room

  // 計算住宿總成本
  const accommodationCategory = categories.find(cat => cat.id === 'accommodation')
  if (accommodationCategory) {
    const accommodationItems = accommodationCategory.items.filter(item => item.day !== undefined)
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
        const firstRoomType = dayItems[0]
        const roomTotal = firstRoomType.total || 0

        // 成人和小孩 = 房型1小計
        costs.adult += roomTotal
        costs.child_with_bed += roomTotal

        // 單人房 = 房型1單價（全額）
        const roomPrice = firstRoomType.unit_price || 0
        costs.single_room += roomPrice
      }
    })
  }

  // 處理其他類別
  categories.forEach(category => {
    if (category.id === 'accommodation') return // 已處理

    category.items.forEach(item => {
      if (category.id === 'transport') {
        // 交通類別
        if (item.name === '成人機票') {
          costs.adult += item.adult_price || 0
          costs.single_room += item.adult_price || 0
        } else if (item.name === '小孩機票') {
          costs.child_with_bed += item.child_price || 0
          costs.child_no_bed += item.child_price || 0
        } else if (item.name === '嬰兒機票') {
          costs.infant += item.infant_price || 0
        } else {
          const itemCost = item.unit_price || 0
          costs.adult += itemCost
          costs.child_with_bed += itemCost
          costs.single_room += itemCost
        }
      } else if (
        category.id === 'meals' ||
        category.id === 'activities' ||
        category.id === 'others'
      ) {
        // 餐飲、活動、其他
        const itemCost = item.unit_price || 0
        costs.adult += itemCost
        costs.child_with_bed += itemCost
        costs.single_room += itemCost
      } else if (category.id === 'group-transport' || category.id === 'guide') {
        // 團體分攤、領隊導遊 - 關鍵：用新的總人數重新計算分攤費用
        const totalCost = item.unit_price * item.quantity
        const costPerPerson = totalParticipants > 0 ? totalCost / totalParticipants : 0

        costs.adult += costPerPerson
        costs.child_with_bed += costPerPerson
        costs.child_no_bed += costPerPerson
        costs.single_room += costPerPerson
      }
    })
  })

  return costs
}
