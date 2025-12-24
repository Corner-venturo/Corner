import { TourFormData } from '@/components/editor/tour-form/types'

export interface DayDateInfo {
  day: number
  month: string
  monthShort: string
  year: number
}

// 計算 dayLabel - 處理建議方案編號
export function calculateDayLabels(itinerary: TourFormData['dailyItinerary']): string[] {
  const labels: string[] = []
  let currentDayNumber = 0
  let alternativeCount = 0

  for (let i = 0; i < itinerary.length; i++) {
    const day = itinerary[i]
    if (day.isAlternative) {
      alternativeCount++
      const suffix = String.fromCharCode(65 + alternativeCount)
      labels.push(`Day ${currentDayNumber}-${suffix}`)
    } else {
      currentDayNumber++
      alternativeCount = 0
      labels.push(`Day ${currentDayNumber}`)
    }
  }
  return labels
}

// 根據出發日期計算該天日期
export function calculateDayDate(
  departureDate: string | undefined,
  actualDayNumber: number
): DayDateInfo | null {
  if (!departureDate || isNaN(actualDayNumber) || actualDayNumber < 1) return null
  try {
    const date = new Date(departureDate)
    if (isNaN(date.getTime())) return null
    date.setDate(date.getDate() + (actualDayNumber - 1))
    const day = date.getDate()
    const month = date.getMonth()
    const year = date.getFullYear()
    if (isNaN(day) || isNaN(month)) return null
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
    const monthsFull = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    return { day, month: monthsFull[month], monthShort: months[month], year }
  } catch {
    return null
  }
}

// 判斷是否為最後一天
export function isLastMainDay(
  itinerary: TourFormData['dailyItinerary'],
  currentIndex: number
): boolean {
  let lastMainDayIndex = -1
  for (let i = itinerary.length - 1; i >= 0; i--) {
    if (!itinerary[i].isAlternative) {
      lastMainDayIndex = i
      break
    }
  }
  if (currentIndex === lastMainDayIndex) return true
  if (itinerary[currentIndex].isAlternative) {
    for (let i = currentIndex - 1; i >= 0; i--) {
      if (!itinerary[i].isAlternative) {
        return i === lastMainDayIndex
      }
    }
  }
  return false
}

// 處理圖片邏輯
export function getDayImages(
  day: TourFormData['dailyItinerary'][0]
): string[] {
  const dayImages = day.showDailyImages === true && day.images && day.images.length > 0 ? day.images : []
  const activityImages = day.activities?.filter(a => a.image).map(a => a.image!) || []
  const normalizedDayImages = dayImages.map(img => typeof img === 'string' ? img : img.url)
  const allImages: string[] = normalizedDayImages.length > 0 ? normalizedDayImages : activityImages
  return allImages
}
