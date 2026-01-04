/**
 * 時間計算工具
 * 用於行程時間規劃
 */

import { formatDate } from '@/lib/utils/format-date'
import type { DailyTimeSlot, FlightConstraint, SchedulingConfig } from './types'
import { DEFAULT_SCHEDULING_CONFIG } from './types'

/**
 * 將時間字串轉換為分鐘數（從午夜開始）
 * @param time 時間字串 (HH:mm)
 * @returns 分鐘數
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * 將分鐘數轉換為時間字串
 * @param minutes 分鐘數
 * @returns 時間字串 (HH:mm)
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60) % 24
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

/**
 * 計算兩個時間之間的分鐘數
 * @param startTime 開始時間 (HH:mm)
 * @param endTime 結束時間 (HH:mm)
 * @returns 分鐘數
 */
export function calculateDurationMinutes(startTime: string, endTime: string): number {
  return timeToMinutes(endTime) - timeToMinutes(startTime)
}

/**
 * 增加分鐘數到時間
 * @param time 時間字串 (HH:mm)
 * @param minutes 要增加的分鐘數
 * @returns 新時間字串
 */
export function addMinutesToTime(time: string, minutes: number): string {
  return minutesToTime(timeToMinutes(time) + minutes)
}

/**
 * 獲取週幾的中文名稱
 * @param date Date 物件
 * @returns 週幾
 */
export function getDayOfWeekChinese(date: Date): string {
  const days = ['日', '一', '二', '三', '四', '五', '六']
  return days[date.getDay()]
}

/**
 * 格式化日期為 MM/DD (週幾)
 * @param date Date 物件
 * @returns 格式化的日期字串
 */
export function formatDisplayDate(date: Date): string {
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${month}/${day} (${getDayOfWeekChinese(date)})`
}

/**
 * 計算每日可用時間區塊
 * @param numDays 天數
 * @param departureDate 出發日期 (YYYY-MM-DD)
 * @param outboundFlight 去程航班
 * @param returnFlight 回程航班
 * @param config 配置
 * @returns 每日時間區塊
 */
export function calculateDailyTimeSlots(
  numDays: number,
  departureDate: string,
  outboundFlight: FlightConstraint,
  returnFlight: FlightConstraint,
  config: SchedulingConfig = DEFAULT_SCHEDULING_CONFIG
): DailyTimeSlot[] {
  const slots: DailyTimeSlot[] = []
  const startDate = new Date(departureDate)

  for (let day = 0; day < numDays; day++) {
    const currentDate = new Date(startDate)
    currentDate.setDate(startDate.getDate() + day)

    const isFirstDay = day === 0
    const isLastDay = day === numDays - 1

    let startTime: string
    let endTime: string

    if (isFirstDay) {
      // 第一天：航班抵達後 + 緩衝時間
      const arrivalMinutes = timeToMinutes(outboundFlight.arrivalTime)
      const startMinutes = arrivalMinutes + config.postArrivalBuffer
      startTime = minutesToTime(startMinutes)
      endTime = config.defaultDayEnd
    } else if (isLastDay) {
      // 最後一天：起飛前 - 緩衝時間
      startTime = config.defaultDayStart
      const departureMinutes = timeToMinutes(returnFlight.departureTime)
      const endMinutes = departureMinutes - config.preDepartureBuffer
      endTime = minutesToTime(Math.min(endMinutes, timeToMinutes(config.defaultDayEnd)))
    } else {
      // 中間天：使用預設時間
      startTime = config.defaultDayStart
      endTime = config.defaultDayEnd
    }

    const availableMinutes = calculateDurationMinutes(startTime, endTime)

    slots.push({
      dayNumber: day + 1,
      date: formatDate(currentDate),
      displayDate: formatDisplayDate(currentDate),
      availableMinutes: Math.max(0, availableMinutes),
      startTime,
      endTime,
      isFirstDay,
      isLastDay,
    })
  }

  return slots
}

/**
 * 計算每日實際可用於行程的時間（扣除用餐）
 * @param slot 時間區塊
 * @param config 配置
 * @returns 可用於行程的分鐘數
 */
export function calculateUsableTime(
  slot: DailyTimeSlot,
  config: SchedulingConfig = DEFAULT_SCHEDULING_CONFIG
): number {
  let usable = slot.availableMinutes

  const startMinutes = timeToMinutes(slot.startTime)
  const endMinutes = timeToMinutes(slot.endTime)
  const lunchMinutes = timeToMinutes(config.lunchTime)
  const dinnerMinutes = timeToMinutes(config.dinnerTime)

  // 扣除午餐時間（如果在時間範圍內）
  if (startMinutes < lunchMinutes + config.mealDuration && endMinutes > lunchMinutes) {
    usable -= config.mealDuration
  }

  // 扣除晚餐時間（如果在時間範圍內）
  if (startMinutes < dinnerMinutes + config.mealDuration && endMinutes > dinnerMinutes) {
    usable -= config.mealDuration
  }

  return Math.max(0, usable)
}

/**
 * 計算某時間點加上行程後的結束時間
 * @param startTime 開始時間 (HH:mm)
 * @param durationMinutes 行程時間（分鐘）
 * @param config 配置
 * @returns 結束時間（考慮用餐時間）
 */
export function calculateEndTimeWithMeals(
  startTime: string,
  durationMinutes: number,
  config: SchedulingConfig = DEFAULT_SCHEDULING_CONFIG
): string {
  let currentMinutes = timeToMinutes(startTime)
  let remaining = durationMinutes

  const lunchStart = timeToMinutes(config.lunchTime)
  const lunchEnd = lunchStart + config.mealDuration
  const dinnerStart = timeToMinutes(config.dinnerTime)
  const dinnerEnd = dinnerStart + config.mealDuration

  // 簡化：如果跨過用餐時間，加上用餐時間
  while (remaining > 0) {
    // 檢查是否進入午餐時間
    if (currentMinutes < lunchStart && currentMinutes + remaining >= lunchStart) {
      const untilLunch = lunchStart - currentMinutes
      remaining -= untilLunch
      currentMinutes = lunchEnd
      continue
    }

    // 檢查是否進入晚餐時間
    if (currentMinutes < dinnerStart && currentMinutes + remaining >= dinnerStart) {
      const untilDinner = dinnerStart - currentMinutes
      remaining -= untilDinner
      currentMinutes = dinnerEnd
      continue
    }

    // 正常推進
    currentMinutes += remaining
    remaining = 0
  }

  return minutesToTime(currentMinutes)
}
