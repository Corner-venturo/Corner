/**
 * 手冊模板引擎
 * 
 * 現在用 React 元件，不再用 Canvas/generateElements
 * 
 * 使用方式：
 * ```tsx
 * import { CornerTravel, JapaneseStyle } from '@/features/designer/components/brochure-templates'
 * 
 * <CornerTravel.Brochure data={data} />
 * <JapaneseStyle.Cover data={data} />
 * ```
 */

// 保留國家預設（注意事項依國家不同）
export {
  getMemoSettingsByCountry,
  getCountryCodeFromName,
  calculateMemoPageCount,
  getMemoItemsForPage,
  countryNames,
} from '../definitions/country-presets'

export type {
  MemoSettings,
  CountryCode,
  MemoItem,
  SeasonInfo,
  MemoInfoItem,
} from '../definitions/types'

// 行程資料轉換（從 DB 資料轉成元件 props）
export interface BrochureData {
  destination?: string
  mainTitle?: string
  subTitle?: string
  travelDates?: string
  coverImage?: string
  companyName?: string
  leaderName?: string
  leaderPhone?: string
  outboundFlight?: string
  returnFlight?: string
  dailyItineraries?: Array<{
    dayNumber: number
    date?: string
    title: string
    activities?: string[]
    meals?: {
      breakfast?: string
      lunch?: string
      dinner?: string
    }
    accommodation?: string
  }>
  hotels?: Array<{
    name: string
    nameEn?: string
    address?: string
    phone?: string
    checkIn?: string
    checkOut?: string
    image?: string
    nights?: number
  }>
}

/**
 * 從行程表資料轉換成手冊元件資料
 */
export function itineraryToBrochureData(itinerary: {
  title?: string
  subtitle?: string
  cover_image?: string
  country?: string
  city?: string
  departure_date?: string
  return_date?: string
  days?: Array<{
    day_number: number
    date?: string
    title?: string
    activities?: Array<{ name?: string }>
    meals?: { breakfast?: string; lunch?: string; dinner?: string }
    accommodation?: string
  }>
  leader?: { name?: string; phone?: string }
  flights?: { outbound?: string; return?: string }
}): BrochureData {
  const formatDate = (date?: string) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).replace(/\//g, '.')
  }

  return {
    destination: [itinerary.city, itinerary.country].filter(Boolean).join(', '),
    mainTitle: itinerary.title,
    subTitle: itinerary.subtitle,
    travelDates: itinerary.departure_date && itinerary.return_date
      ? `${formatDate(itinerary.departure_date)} - ${formatDate(itinerary.return_date)}`
      : undefined,
    coverImage: itinerary.cover_image,
    leaderName: itinerary.leader?.name,
    leaderPhone: itinerary.leader?.phone,
    outboundFlight: itinerary.flights?.outbound,
    returnFlight: itinerary.flights?.return,
    dailyItineraries: itinerary.days?.map(day => ({
      dayNumber: day.day_number,
      date: day.date,
      title: day.title || '',
      activities: day.activities?.map(a => a.name).filter(Boolean) as string[],
      meals: day.meals,
      accommodation: day.accommodation,
    })),
  }
}

// 尺寸設定
export const PAGE_SIZES = {
  A5: { width: 148, height: 210, name: 'A5' },
  A4: { width: 210, height: 297, name: 'A4' },
  Letter: { width: 216, height: 279, name: 'Letter' },
} as const

export type PageSize = typeof PAGE_SIZES[keyof typeof PAGE_SIZES]
