/**
 * 地理計算工具
 * 用於景點距離計算和車程估算
 */

import type { Attraction } from '@/features/attractions/types'
import type { AttractionWithDistance, SchedulingConfig } from './types'
import { DEFAULT_SCHEDULING_CONFIG } from './types'

/**
 * 計算兩點之間的距離（Haversine 公式）
 * @param lat1 緯度1
 * @param lon1 經度1
 * @param lat2 緯度2
 * @param lon2 經度2
 * @returns 距離（公里）
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // 地球半徑（公里）
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * 估算車程時間（分鐘）
 * @param distanceKm 距離（公里）
 * @param config 配置
 * @returns 車程時間（分鐘）
 */
export function estimateTravelTime(
  distanceKm: number,
  config: SchedulingConfig = DEFAULT_SCHEDULING_CONFIG
): number {
  const rawTime = (distanceKm / config.avgSpeedKmh) * 60
  return Math.max(config.minTravelTime, Math.round(rawTime))
}

/**
 * 計算景點之間的距離並排序
 * @param attractions 景點列表
 * @param startLat 起始緯度（可選，例如機場）
 * @param startLon 起始經度（可選）
 * @param config 配置
 * @returns 帶距離資訊的景點列表
 */
export function calculateDistancesBetweenAttractions(
  attractions: Attraction[],
  startLat?: number,
  startLon?: number,
  config: SchedulingConfig = DEFAULT_SCHEDULING_CONFIG
): AttractionWithDistance[] {
  if (attractions.length === 0) return []

  const result: AttractionWithDistance[] = []
  let prevLat = startLat
  let prevLon = startLon

  for (const attraction of attractions) {
    const attractionWithDistance: AttractionWithDistance = { ...attraction }

    if (
      prevLat !== undefined &&
      prevLon !== undefined &&
      attraction.latitude &&
      attraction.longitude
    ) {
      const distance = calculateDistance(
        prevLat,
        prevLon,
        attraction.latitude,
        attraction.longitude
      )
      attractionWithDistance.distanceFromPrevious = Math.round(distance * 10) / 10
      attractionWithDistance.travelTimeMinutes = estimateTravelTime(distance, config)
    }

    result.push(attractionWithDistance)

    // 更新上一個位置
    if (attraction.latitude && attraction.longitude) {
      prevLat = attraction.latitude
      prevLon = attraction.longitude
    }
  }

  return result
}

/**
 * 根據距離篩選附近景點
 * @param centerLat 中心緯度
 * @param centerLon 中心經度
 * @param attractions 所有景點
 * @param radiusKm 半徑（公里）
 * @returns 在範圍內的景點（按距離排序）
 */
export function filterNearbyAttractions(
  centerLat: number,
  centerLon: number,
  attractions: Attraction[],
  radiusKm: number = 10
): AttractionWithDistance[] {
  const nearby: AttractionWithDistance[] = []

  for (const attraction of attractions) {
    if (!attraction.latitude || !attraction.longitude) continue

    const distance = calculateDistance(
      centerLat,
      centerLon,
      attraction.latitude,
      attraction.longitude
    )

    if (distance <= radiusKm) {
      nearby.push({
        ...attraction,
        distanceFromPrevious: Math.round(distance * 10) / 10,
        travelTimeMinutes: estimateTravelTime(distance),
      })
    }
  }

  // 按距離排序
  return nearby.sort((a, b) =>
    (a.distanceFromPrevious || 0) - (b.distanceFromPrevious || 0)
  )
}

/**
 * 使用貪婪演算法優化景點順序（最短路徑近似）
 * @param attractions 景點列表
 * @param startLat 起始緯度
 * @param startLon 起始經度
 * @returns 優化後的景點順序
 */
export function optimizeAttractionOrder(
  attractions: Attraction[],
  startLat?: number,
  startLon?: number
): Attraction[] {
  if (attractions.length <= 1) return [...attractions]

  const validAttractions = attractions.filter(a => a.latitude && a.longitude)
  if (validAttractions.length === 0) return [...attractions]

  const result: Attraction[] = []
  const remaining = [...validAttractions]

  let currentLat = startLat ?? validAttractions[0].latitude!
  let currentLon = startLon ?? validAttractions[0].longitude!

  while (remaining.length > 0) {
    // 找最近的景點
    let minDistance = Infinity
    let nearestIndex = 0

    for (let i = 0; i < remaining.length; i++) {
      const attraction = remaining[i]
      const distance = calculateDistance(
        currentLat,
        currentLon,
        attraction.latitude!,
        attraction.longitude!
      )
      if (distance < minDistance) {
        minDistance = distance
        nearestIndex = i
      }
    }

    // 加入結果並更新當前位置
    const nearest = remaining.splice(nearestIndex, 1)[0]
    result.push(nearest)
    currentLat = nearest.latitude!
    currentLon = nearest.longitude!
  }

  return result
}

/**
 * 計算總行程距離
 * @param attractions 景點列表（已排序）
 * @returns 總距離（公里）
 */
export function calculateTotalDistance(attractions: Attraction[]): number {
  let total = 0

  for (let i = 1; i < attractions.length; i++) {
    const prev = attractions[i - 1]
    const curr = attractions[i]

    if (prev.latitude && prev.longitude && curr.latitude && curr.longitude) {
      total += calculateDistance(
        prev.latitude,
        prev.longitude,
        curr.latitude,
        curr.longitude
      )
    }
  }

  return Math.round(total * 10) / 10
}
