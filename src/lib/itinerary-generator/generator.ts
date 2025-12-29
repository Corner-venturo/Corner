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
} from './types'
import { DEFAULT_SCHEDULING_CONFIG } from './types'
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

  // 2. 篩選並優化景點順序
  const cityAttractions = attractions.filter(
    a => a.city_id === request.cityId && a.is_active
  )

  if (cityAttractions.length === 0) {
    warnings.push('資料庫中沒有此城市的景點資料，建議放慢腳步享受旅程')
  }

  // 3. 優化景點順序
  const optimizedAttractions = optimizeAttractionOrder(cityAttractions)

  // 4. 計算景點間的距離和車程
  const attractionsWithDistance = calculateDistancesBetweenAttractions(
    optimizedAttractions,
    undefined,
    undefined,
    config
  )

  // 5. 分配景點到每天
  const dailyItinerary: DailyItineraryDay[] = []
  let attractionPointer = 0
  let totalAttractionsUsed = 0
  let suggestedRelaxDays = 0

  for (const slot of timeSlots) {
    // 取得這一天可用的景點
    const availableAttractions = attractionsWithDistance.slice(attractionPointer)

    const { itinerary, usedAttractions } = generateDailyItinerary(
      slot,
      availableAttractions,
      config
    )

    dailyItinerary.push(itinerary)
    attractionPointer += usedAttractions
    totalAttractionsUsed += usedAttractions

    // 檢查是否建議放鬆（景點不足）
    if (usedAttractions === 0) {
      suggestedRelaxDays++
    }
  }

  // 6. 計算總時間
  let totalDuration = 0
  for (const attraction of attractionsWithDistance.slice(0, totalAttractionsUsed)) {
    totalDuration += attraction.duration_minutes || DEFAULT_ATTRACTION_DURATION
    if (attraction.travelTimeMinutes) {
      totalDuration += attraction.travelTimeMinutes
    }
  }

  // 7. 生成警告
  if (totalAttractionsUsed < request.numDays * 2) {
    warnings.push(`此城市景點較少，部分天數建議自由探索`)
  }

  if (attractionPointer < attractionsWithDistance.length) {
    warnings.push(`還有 ${attractionsWithDistance.length - attractionPointer} 個景點未能安排，可考慮延長行程`)
  }

  return {
    success: true,
    dailyItinerary,
    stats: {
      totalAttractions: totalAttractionsUsed,
      totalDuration,
      attractionsInDb: cityAttractions.length,
      suggestedRelaxDays,
    },
    warnings,
  }
}
