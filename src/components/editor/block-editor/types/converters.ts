/**
 * 區塊編輯器 - 資料轉換工具
 *
 * 提供 LocalTourData ⟷ Blocks 的雙向轉換
 */

import type { TourFormData } from '@/components/editor/tour-form/types'
import type {
  AnyBlock,
  BlockType,
  CoverBlockData,
  FlightBlockData,
  FeaturesBlockData,
  FocusCardsBlockData,
  LeaderMeetingBlockData,
  HotelsBlockData,
  DailyItineraryBlockData,
  PricingBlockData,
  PriceTiersBlockData,
  FAQsBlockData,
  NoticesBlockData,
  CancellationBlockData,
} from './block-types'
import { createBlock } from './block-types'

// ============================================================
// LocalTourData → Blocks 轉換
// ============================================================

/**
 * 預設區塊順序
 */
const DEFAULT_BLOCK_ORDER: BlockType[] = [
  'COVER',
  'FLIGHT',
  'FEATURES',
  'FOCUS_CARDS',
  'LEADER_MEETING',
  'HOTELS',
  'DAILY_ITINERARY',
  'PRICING',
  'PRICE_TIERS',
  'FAQS',
  'NOTICES',
  'CANCELLATION',
]

/**
 * 將 TourFormData 轉換為區塊陣列
 */
export function tourDataToBlocks(data: TourFormData): AnyBlock[] {
  const blocks: AnyBlock[] = []
  let order = 0

  // 1. 封面區塊（必要）
  blocks.push(createBlock('COVER', order++, {
    tagline: data.tagline,
    title: data.title,
    subtitle: data.subtitle,
    description: data.description,
    departureDate: data.departureDate,
    tourCode: data.tourCode,
    country: data.country,
    city: data.city,
    countries: data.countries,
    coverImage: data.coverImage,
    coverImagePosition: data.coverImagePosition,
    coverStyle: data.coverStyle,
    price: data.price,
    priceNote: data.priceNote,
    heroStatCard2: data.heroStatCard2,
    heroStatCard3: data.heroStatCard3,
  } as CoverBlockData))

  // 2. 航班區塊
  const flightBlock = createBlock('FLIGHT', order++, {
    outboundFlight: data.outboundFlight,
    returnFlight: data.returnFlight,
    flightStyle: data.flightStyle,
  } as FlightBlockData)
  // 如果是國內無航班，設為隱藏
  if (data.flightStyle === 'none') {
    flightBlock.meta.visible = false
  }
  blocks.push(flightBlock)

  // 3. 行程特色區塊
  const featuresBlock = createBlock('FEATURES', order++, {
    features: data.features,
    featuresStyle: data.featuresStyle,
  } as FeaturesBlockData)
  featuresBlock.meta.visible = data.showFeatures !== false
  blocks.push(featuresBlock)

  // 4. 精選景點區塊
  const focusCardsBlock = createBlock('FOCUS_CARDS', order++, {
    focusCards: data.focusCards,
  } as FocusCardsBlockData)
  focusCardsBlock.meta.visible = data.focusCards.length > 0
  blocks.push(focusCardsBlock)

  // 5. 領隊與集合區塊
  const leaderMeetingBlock = createBlock('LEADER_MEETING', order++, {
    leader: data.leader,
    meetingPoints: data.meetingPoints,
  } as LeaderMeetingBlockData)
  leaderMeetingBlock.meta.visible = data.showLeaderMeeting !== false
  blocks.push(leaderMeetingBlock)

  // 6. 飯店區塊
  const hotelsBlock = createBlock('HOTELS', order++, {
    hotels: data.hotels,
  } as HotelsBlockData)
  hotelsBlock.meta.visible = data.showHotels !== false
  blocks.push(hotelsBlock)

  // 7. 每日行程區塊（必要）
  blocks.push(createBlock('DAILY_ITINERARY', order++, {
    itinerarySubtitle: data.itinerarySubtitle,
    dailyItinerary: data.dailyItinerary,
    itineraryStyle: data.itineraryStyle,
  } as DailyItineraryBlockData))

  // 8. 團費明細區塊
  if (data.pricingDetails) {
    const pricingBlock = createBlock('PRICING', order++, {
      pricingDetails: data.pricingDetails,
    } as PricingBlockData)
    pricingBlock.meta.visible = data.showPricingDetails !== false
    blocks.push(pricingBlock)
  }

  // 9. 價格方案區塊
  if (data.priceTiers && data.priceTiers.length > 0) {
    const priceTiersBlock = createBlock('PRICE_TIERS', order++, {
      priceTiers: data.priceTiers,
    } as PriceTiersBlockData)
    priceTiersBlock.meta.visible = data.showPriceTiers !== false
    blocks.push(priceTiersBlock)
  }

  // 10. 常見問題區塊
  if (data.faqs && data.faqs.length > 0) {
    const faqsBlock = createBlock('FAQS', order++, {
      faqs: data.faqs,
    } as FAQsBlockData)
    faqsBlock.meta.visible = data.showFaqs !== false
    blocks.push(faqsBlock)
  }

  // 11. 提醒事項區塊
  if (data.notices && data.notices.length > 0) {
    const noticesBlock = createBlock('NOTICES', order++, {
      notices: data.notices,
    } as NoticesBlockData)
    noticesBlock.meta.visible = data.showNotices !== false
    blocks.push(noticesBlock)
  }

  // 12. 取消政策區塊
  if (data.cancellationPolicy && data.cancellationPolicy.length > 0) {
    const cancellationBlock = createBlock('CANCELLATION', order++, {
      cancellationPolicy: data.cancellationPolicy,
    } as CancellationBlockData)
    cancellationBlock.meta.visible = data.showCancellationPolicy !== false
    blocks.push(cancellationBlock)
  }

  return blocks
}

// ============================================================
// Blocks → LocalTourData 轉換
// ============================================================

/**
 * 從區塊陣列中取得特定類型的區塊
 */
function getBlockByType<T extends BlockType>(blocks: AnyBlock[], type: T): AnyBlock | undefined {
  return blocks.find(b => b.meta.type === type)
}

/**
 * 將區塊陣列轉換回 TourFormData
 */
export function blocksToTourData(blocks: AnyBlock[]): TourFormData {
  // 取得各區塊
  const coverBlock = getBlockByType(blocks, 'COVER')
  const flightBlock = getBlockByType(blocks, 'FLIGHT')
  const featuresBlock = getBlockByType(blocks, 'FEATURES')
  const focusCardsBlock = getBlockByType(blocks, 'FOCUS_CARDS')
  const leaderMeetingBlock = getBlockByType(blocks, 'LEADER_MEETING')
  const hotelsBlock = getBlockByType(blocks, 'HOTELS')
  const dailyItineraryBlock = getBlockByType(blocks, 'DAILY_ITINERARY')
  const pricingBlock = getBlockByType(blocks, 'PRICING')
  const priceTiersBlock = getBlockByType(blocks, 'PRICE_TIERS')
  const faqsBlock = getBlockByType(blocks, 'FAQS')
  const noticesBlock = getBlockByType(blocks, 'NOTICES')
  const cancellationBlock = getBlockByType(blocks, 'CANCELLATION')

  // 取得各區塊資料
  const coverData = (coverBlock?.data || {}) as CoverBlockData
  const flightData = (flightBlock?.data || {}) as FlightBlockData
  const featuresData = (featuresBlock?.data || {}) as FeaturesBlockData
  const focusCardsData = (focusCardsBlock?.data || {}) as FocusCardsBlockData
  const leaderMeetingData = (leaderMeetingBlock?.data || {}) as LeaderMeetingBlockData
  const hotelsData = (hotelsBlock?.data || {}) as HotelsBlockData
  const dailyItineraryData = (dailyItineraryBlock?.data || {}) as DailyItineraryBlockData
  const pricingData = (pricingBlock?.data || {}) as PricingBlockData
  const priceTiersData = (priceTiersBlock?.data || {}) as PriceTiersBlockData
  const faqsData = (faqsBlock?.data || {}) as FAQsBlockData
  const noticesData = (noticesBlock?.data || {}) as NoticesBlockData
  const cancellationData = (cancellationBlock?.data || {}) as CancellationBlockData

  return {
    // 封面區塊
    tagline: coverData.tagline || '',
    title: coverData.title || '',
    subtitle: coverData.subtitle || '',
    description: coverData.description || '',
    departureDate: coverData.departureDate || '',
    tourCode: coverData.tourCode || '',
    country: coverData.country || '',
    city: coverData.city || '',
    countries: coverData.countries,
    coverImage: coverData.coverImage,
    coverImagePosition: coverData.coverImagePosition,
    coverStyle: coverData.coverStyle,
    price: coverData.price,
    priceNote: coverData.priceNote,
    heroStatCard2: coverData.heroStatCard2,
    heroStatCard3: coverData.heroStatCard3,

    // 航班區塊
    outboundFlight: flightData.outboundFlight || {
      airline: '',
      flightNumber: '',
      departureAirport: '',
      departureTime: '',
      arrivalAirport: '',
      arrivalTime: '',
    },
    returnFlight: flightData.returnFlight || {
      airline: '',
      flightNumber: '',
      departureAirport: '',
      departureTime: '',
      arrivalAirport: '',
      arrivalTime: '',
    },
    flightStyle: flightData.flightStyle,

    // 行程特色區塊
    features: featuresData.features || [],
    featuresStyle: featuresData.featuresStyle,
    showFeatures: featuresBlock?.meta.visible ?? true,

    // 精選景點區塊
    focusCards: focusCardsData.focusCards || [],

    // 領隊與集合區塊
    leader: leaderMeetingData.leader || { name: '', domesticPhone: '', overseasPhone: '' },
    meetingPoints: leaderMeetingData.meetingPoints || [{ time: '', location: '' }],
    showLeaderMeeting: leaderMeetingBlock?.meta.visible ?? true,

    // 飯店區塊
    hotels: hotelsData.hotels || [],
    showHotels: hotelsBlock?.meta.visible ?? true,

    // 每日行程區塊
    itinerarySubtitle: dailyItineraryData.itinerarySubtitle || '',
    dailyItinerary: dailyItineraryData.dailyItinerary || [],
    itineraryStyle: dailyItineraryData.itineraryStyle,

    // 團費明細區塊
    pricingDetails: pricingData.pricingDetails,
    showPricingDetails: pricingBlock?.meta.visible ?? false,

    // 價格方案區塊
    priceTiers: priceTiersData.priceTiers,
    showPriceTiers: priceTiersBlock?.meta.visible ?? false,

    // 常見問題區塊
    faqs: faqsData.faqs,
    showFaqs: faqsBlock?.meta.visible ?? false,

    // 提醒事項區塊
    notices: noticesData.notices,
    showNotices: noticesBlock?.meta.visible ?? false,

    // 取消政策區塊
    cancellationPolicy: cancellationData.cancellationPolicy,
    showCancellationPolicy: cancellationBlock?.meta.visible ?? false,
  }
}

// ============================================================
// 建立預設區塊
// ============================================================

/**
 * 建立預設的區塊陣列（空白行程）
 */
export function createDefaultBlocks(): AnyBlock[] {
  const blocks: AnyBlock[] = []
  let order = 0

  // 必要區塊
  blocks.push(createBlock('COVER', order++))
  blocks.push(createBlock('FLIGHT', order++))
  blocks.push(createBlock('FEATURES', order++))
  blocks.push(createBlock('FOCUS_CARDS', order++))
  blocks.push(createBlock('LEADER_MEETING', order++))
  blocks.push(createBlock('HOTELS', order++))
  blocks.push(createBlock('DAILY_ITINERARY', order++))

  return blocks
}

/**
 * 重新排序區塊
 */
export function reorderBlocks(blocks: AnyBlock[]): AnyBlock[] {
  return blocks.map((block, index) => ({
    ...block,
    meta: {
      ...block.meta,
      order: index,
    },
  } as AnyBlock))
}
