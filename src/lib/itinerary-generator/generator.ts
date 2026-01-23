/**
 * 行程自動生成器
 * 使用規則引擎自動排程行程
 */

import type { Attraction } from '@/features/attractions/types'
import type {
  GenerateItineraryRequest,
  GenerateItineraryResult,
  DailyItineraryDay,
  DailyActivity,
  DailyMeals,
  DailyTimeSlot,
  SchedulingConfig,
  AttractionWithDistance,
  AccommodationPlan,
  ItineraryStyle,
} from './types'
import { DEFAULT_SCHEDULING_CONFIG } from './types'

// 風格對應的每日景點數量
const STYLE_ATTRACTIONS_PER_DAY: Record<ItineraryStyle, { min: number; max: number }> = {
  relax: { min: 2, max: 3 },
  adventure: { min: 3, max: 5 },
  culture: { min: 2, max: 4 },
  food: { min: 3, max: 4 },
}

// 風格對應的景點類型優先順序
const STYLE_CATEGORY_PRIORITY: Record<ItineraryStyle, string[]> = {
  relax: ['景點', '咖啡廳', '公園', '溫泉'],
  adventure: ['戶外', '自然', '體驗', '景點'],
  culture: ['寺廟', '神社', '博物館', '古蹟', '景點'],
  food: ['餐廳', '市場', '小吃', '景點'],
}
import {
  optimizeAttractionOrder,
  calculateDistancesBetweenAttractions,
  estimateTravelTime,
} from './geo-utils'
import {
  calculateDailyTimeSlots,
  calculateUsableTime,
  addMinutesToTime,
  timeToMinutes,
} from './time-utils'

// 預設景點停留時間（分鐘）
const DEFAULT_ATTRACTION_DURATION = 90

// 預設餐食描述
const DEFAULT_MEALS: DailyMeals = {
  breakfast: '飯店內享用',
  lunch: '當地特色餐廳',
  dinner: '當地特色餐廳',
}

// 第一天餐食（通常沒早餐）
const FIRST_DAY_MEALS: DailyMeals = {
  breakfast: '機上享用',
  lunch: '當地特色餐廳',
  dinner: '當地特色餐廳',
}

// 最後一天餐食
const LAST_DAY_MEALS: DailyMeals = {
  breakfast: '飯店內享用',
  lunch: '機場或機上享用',
  dinner: '-',
}

/**
 * 將景點轉換為行程活動
 */
function attractionToActivity(attraction: Attraction): DailyActivity {
  return {
    icon: getCategoryIcon(attraction.category || '景點'),
    title: attraction.name,
    description: attraction.notes || attraction.description || `探索${attraction.name}`,
    image: attraction.thumbnail || attraction.images?.[0],
  }
}

/**
 * 根據分類取得圖示
 */
function getCategoryIcon(category: string): string {
  switch (category) {
    case '景點':
      return '🏛️'
    case '餐廳':
      return '🍽️'
    case '購物':
      return '🛍️'
    case '交通':
      return '🚗'
    case '住宿':
      return '🏨'
    default:
      return '📍'
  }
}

/**
 * 生成「放鬆享受」的建議活動
 */
function createRelaxActivity(dayNumber: number): DailyActivity {
  const suggestions = [
    { title: '自由探索', desc: '放慢腳步，隨意漫步在街道上，發現當地的小驚喜' },
    { title: '咖啡時光', desc: '找一間舒適的咖啡廳，品味當地咖啡，享受悠閒時光' },
    { title: '在地市場巡禮', desc: '逛逛傳統市場，體驗最道地的在地生活' },
    { title: '飯店設施放鬆', desc: '享用飯店泳池、SPA 等設施，徹底放鬆身心' },
    { title: '街頭美食探險', desc: '品嚐路邊小吃，發掘隱藏版美食' },
  ]
  const suggestion = suggestions[(dayNumber - 1) % suggestions.length]
  return {
    icon: '🌿',
    title: suggestion.title,
    description: suggestion.desc,
  }
}

/**
 * 生成每日行程
 */
function generateDailyItinerary(
  timeSlot: DailyTimeSlot,
  attractions: AttractionWithDistance[],
  config: SchedulingConfig
): { itinerary: DailyItineraryDay; usedAttractions: number } {
  const activities: DailyActivity[] = []
  let currentTime = timeSlot.startTime
  let usedAttractions = 0
  const usableTime = calculateUsableTime(timeSlot, config)

  // 計算可用時間（扣除用餐時間）
  let remainingTime = usableTime
  let attractionIndex = 0

  while (remainingTime > 0 && attractionIndex < attractions.length) {
    const attraction = attractions[attractionIndex]
    const duration = attraction.duration_minutes || DEFAULT_ATTRACTION_DURATION
    const travelTime = attraction.travelTimeMinutes || config.minTravelTime

    // 計算這個景點需要的總時間
    const totalNeeded = duration + (attractionIndex > 0 ? travelTime : 0)

    if (totalNeeded <= remainingTime) {
      activities.push(attractionToActivity(attraction))
      remainingTime -= totalNeeded
      usedAttractions++
      currentTime = addMinutesToTime(currentTime, totalNeeded)
    } else {
      // 剩餘時間不夠，跳過這個景點
      break
    }

    attractionIndex++
  }

  // 如果沒有景點或還有很多剩餘時間，加入放鬆活動
  if (activities.length === 0 || remainingTime > 120) {
    activities.push(createRelaxActivity(timeSlot.dayNumber))
  }

  // 決定餐食
  let meals: DailyMeals
  if (timeSlot.isFirstDay) {
    meals = FIRST_DAY_MEALS
  } else if (timeSlot.isLastDay) {
    meals = LAST_DAY_MEALS
  } else {
    meals = { ...DEFAULT_MEALS }
  }

  // 建立行程
  const itinerary: DailyItineraryDay = {
    dayLabel: `Day ${timeSlot.dayNumber}`,
    date: timeSlot.displayDate,
    title: generateDayTitle(activities, timeSlot),
    highlight: activities[0]?.title || '自由活動',
    description: generateDayDescription(activities, timeSlot),
    activities,
    recommendations: generateRecommendations(activities),
    meals,
    accommodation: timeSlot.isLastDay ? '返回溫暖的家' : '當地精選飯店',
    images: [],
  }

  return { itinerary, usedAttractions }
}

/**
 * 生成每日標題
 */
function generateDayTitle(activities: DailyActivity[], timeSlot: DailyTimeSlot): string {
  if (timeSlot.isFirstDay) {
    return activities.length > 0 ? `抵達 → ${activities[0].title}` : '抵達目的地'
  }
  if (timeSlot.isLastDay) {
    return activities.length > 0 ? `${activities[0].title} → 返程` : '返回溫暖的家'
  }
  if (activities.length === 0) {
    return '自由探索日'
  }
  if (activities.length === 1) {
    return activities[0].title
  }
  return `${activities[0].title} → ${activities[activities.length - 1].title}`
}

/**
 * 生成每日描述
 */
function generateDayDescription(activities: DailyActivity[], timeSlot: DailyTimeSlot): string {
  if (timeSlot.isFirstDay) {
    return '抵達後開始精彩旅程，讓專屬包車帶您探索這座城市的魅力。'
  }
  if (timeSlot.isLastDay) {
    return '最後一天的精彩時光，把握機會留下美好回憶後，前往機場踏上歸途。'
  }
  if (activities.length <= 1) {
    return '放慢腳步，用自己的節奏感受這座城市的美好。'
  }
  return `今天我們將造訪 ${activities.length} 個精選景點，深入體驗在地風情。`
}

/**
 * 生成推薦事項
 */
function generateRecommendations(activities: DailyActivity[]): string[] {
  const recommendations: string[] = [
    '建議穿著舒適的步行鞋',
    '攜帶防曬用品和水',
  ]

  if (activities.some(a => a.icon === '🛍️')) {
    recommendations.push('準備足夠現金以便購物')
  }

  if (activities.some(a => a.icon === '🏛️')) {
    recommendations.push('參觀寺廟請穿著得體服裝')
  }

  return recommendations
}

/**
 * 根據住宿安排計算每天屬於哪個城市
 * 返回 dayNumber -> cityId 的映射
 */
function calculateDailyCityMapping(
  numDays: number,
  accommodations: AccommodationPlan[] | undefined,
  defaultCityId: string
): Map<number, { cityId: string; cityName: string }> {
  const mapping = new Map<number, { cityId: string; cityName: string }>()

  if (!accommodations || accommodations.length === 0) {
    // 沒有住宿安排，全部使用預設城市
    for (let day = 1; day <= numDays; day++) {
      mapping.set(day, { cityId: defaultCityId, cityName: '' })
    }
    return mapping
  }

  // 根據住宿安排分配每天的城市
  let currentDay = 1
  for (const acc of accommodations) {
    // 每個城市住 N 晚，對應 N+1 天的行程（住宿當晚 + 第二天整天）
    // 但最後一個城市只算住宿晚數
    for (let i = 0; i < acc.nights && currentDay <= numDays; i++) {
      mapping.set(currentDay, { cityId: acc.cityId, cityName: acc.cityName })
      currentDay++
    }
  }

  // 如果還有剩餘天數，使用最後一個城市
  const lastCity = accommodations[accommodations.length - 1]
  while (currentDay <= numDays) {
    mapping.set(currentDay, { cityId: lastCity.cityId, cityName: lastCity.cityName })
    currentDay++
  }

  return mapping
}

/**
 * 根據風格篩選和排序景點
 */
function filterAndSortByStyle(
  attractions: Attraction[],
  style: ItineraryStyle | undefined
): Attraction[] {
  if (!style) return attractions

  const priorities = STYLE_CATEGORY_PRIORITY[style]

  // 根據優先順序排序
  return [...attractions].sort((a, b) => {
    const aCategory = a.category || '其他'
    const bCategory = b.category || '其他'

    const aPriority = priorities.findIndex(p => aCategory.includes(p))
    const bPriority = priorities.findIndex(p => bCategory.includes(p))

    const aScore = aPriority === -1 ? 999 : aPriority
    const bScore = bPriority === -1 ? 999 : bPriority

    return aScore - bScore
  })
}

/**
 * 主要生成函數
 */
export async function generateItinerary(
  request: GenerateItineraryRequest,
  attractions: Attraction[],
  config: SchedulingConfig = DEFAULT_SCHEDULING_CONFIG
): Promise<GenerateItineraryResult> {
  const warnings: string[] = []

  // 1. 計算每日時間區塊
  const timeSlots = calculateDailyTimeSlots(
    request.numDays,
    request.departureDate,
    request.outboundFlight,
    request.returnFlight,
    config
  )

  // 2. 計算每天屬於哪個城市
  const dailyCityMapping = calculateDailyCityMapping(
    request.numDays,
    request.accommodations,
    request.cityId
  )

  // 3. 收集所有涉及的城市 ID
  const involvedCityIds = new Set<string>()
  involvedCityIds.add(request.cityId) // 入境城市
  if (request.accommodations) {
    request.accommodations.forEach(acc => involvedCityIds.add(acc.cityId))
  }

  // 4. 按城市分組景點
  const attractionsByCity = new Map<string, AttractionWithDistance[]>()
  for (const cityId of involvedCityIds) {
    let cityAttractions = attractions.filter(
      a => a.city_id === cityId && a.is_active
    )

    // 根據風格篩選和排序
    cityAttractions = filterAndSortByStyle(cityAttractions, request.style)

    // 優化景點順序
    const optimized = optimizeAttractionOrder(cityAttractions)

    // 計算距離
    const withDistance = calculateDistancesBetweenAttractions(
      optimized,
      undefined,
      undefined,
      config
    )

    attractionsByCity.set(cityId, withDistance)
  }

  // 5. 檢查景點數量
  let totalAttractionsInDb = 0
  for (const [cityId, cityAttractions] of attractionsByCity) {
    totalAttractionsInDb += cityAttractions.length
    if (cityAttractions.length === 0) {
      const cityName = request.accommodations?.find(a => a.cityId === cityId)?.cityName || '目的地'
      warnings.push(`${cityName}的景點資料較少，建議放慢腳步享受旅程`)
    }
  }

  // 6. 分配景點到每天（根據住宿城市）
  const dailyItinerary: DailyItineraryDay[] = []
  const cityAttractionPointers = new Map<string, number>() // 追蹤每個城市用到第幾個景點
  let totalAttractionsUsed = 0
  let suggestedRelaxDays = 0

  // 根據風格決定每天景點數量
  const styleConfig = request.style ? STYLE_ATTRACTIONS_PER_DAY[request.style] : { min: 2, max: 4 }

  for (const slot of timeSlots) {
    // 取得這一天的城市
    const dayCity = dailyCityMapping.get(slot.dayNumber)
    const cityId = dayCity?.cityId || request.cityId
    const cityName = dayCity?.cityName || ''

    // 取得該城市的景點
    const cityAttractions = attractionsByCity.get(cityId) || []
    const pointer = cityAttractionPointers.get(cityId) || 0

    // 取得這一天可用的景點
    const availableAttractions = cityAttractions.slice(pointer)

    const { itinerary, usedAttractions } = generateDailyItinerary(
      slot,
      availableAttractions,
      config
    )

    // 更新住宿資訊
    if (cityName && !slot.isLastDay) {
      itinerary.accommodation = `${cityName}精選飯店`
    }

    dailyItinerary.push(itinerary)
    cityAttractionPointers.set(cityId, pointer + usedAttractions)
    totalAttractionsUsed += usedAttractions

    // 檢查是否建議放鬆（景點不足）
    if (usedAttractions === 0) {
      suggestedRelaxDays++
    }
  }

  // 7. 計算總時間
  let totalDuration = 0
  for (const [, cityAttractions] of attractionsByCity) {
    const pointer = cityAttractionPointers.get(cityAttractions[0]?.city_id || '') || 0
    for (const attraction of cityAttractions.slice(0, pointer)) {
      totalDuration += attraction.duration_minutes || DEFAULT_ATTRACTION_DURATION
      if (attraction.travelTimeMinutes) {
        totalDuration += attraction.travelTimeMinutes
      }
    }
  }

  // 8. 生成警告
  if (totalAttractionsUsed < request.numDays * 2) {
    warnings.push(`景點較少，部分天數建議自由探索`)
  }

  // 檢查住宿安排
  if (request.accommodations && request.accommodations.length > 0) {
    const totalNights = request.accommodations.reduce((sum, a) => sum + a.nights, 0)
    const expectedNights = request.numDays - 1
    if (totalNights !== expectedNights) {
      warnings.push(`住宿晚數（${totalNights}）與行程夜數（${expectedNights}）不符`)
    }
  }

  return {
    success: true,
    dailyItinerary,
    stats: {
      totalAttractions: totalAttractionsUsed,
      totalDuration,
      attractionsInDb: totalAttractionsInDb,
      suggestedRelaxDays,
    },
    warnings,
  }
}
