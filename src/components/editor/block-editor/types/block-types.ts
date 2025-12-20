/**
 * 區塊編輯器 - 類型定義
 *
 * 設計理念：
 * 1. 每個區塊獨立可管理
 * 2. 區塊可重新排序
 * 3. 區塊可選擇性顯示/隱藏
 * 4. 支援版本控制
 */

import type {
  FlightInfo,
  Feature,
  FocusCard,
  DailyItinerary,
  LeaderInfo,
  MeetingPoint,
  HotelInfo,
  PricingDetails,
  PriceTier,
  FAQ,
  CoverStyleType,
  FlightStyleType,
  ItineraryStyleType,
  FeaturesStyleType,
  ImagePositionSettings,
  HeroStatCard,
  TourCountry,
} from '@/components/editor/tour-form/types'

// ============================================================
// 區塊類型定義
// ============================================================

/**
 * 區塊類型枚舉
 */
export type BlockType =
  | 'COVER'           // 封面區塊
  | 'FLIGHT'          // 航班資訊
  | 'FEATURES'        // 行程特色
  | 'FOCUS_CARDS'     // 精選景點
  | 'LEADER_MEETING'  // 領隊與集合
  | 'HOTELS'          // 飯店資訊
  | 'DAILY_ITINERARY' // 每日行程
  | 'PRICING'         // 團費明細
  | 'PRICE_TIERS'     // 價格方案
  | 'FAQS'            // 常見問題
  | 'NOTICES'         // 提醒事項
  | 'CANCELLATION'    // 取消政策

/**
 * 區塊中繼資料
 */
export interface BlockMeta {
  id: string           // 區塊唯一 ID
  type: BlockType      // 區塊類型
  order: number        // 排序順序
  visible: boolean     // 是否顯示
  collapsed?: boolean  // 編輯器中是否收合
}

// ============================================================
// 各區塊資料結構
// ============================================================

/**
 * 封面區塊資料
 */
export interface CoverBlockData {
  tagline: string
  title: string
  subtitle: string
  description: string
  departureDate: string
  tourCode: string
  country: string
  city: string
  countries?: TourCountry[]
  coverImage?: string
  coverImagePosition?: ImagePositionSettings
  coverStyle?: CoverStyleType
  price?: string | null
  priceNote?: string | null
  heroStatCard2?: HeroStatCard
  heroStatCard3?: HeroStatCard
}

/**
 * 航班區塊資料
 */
export interface FlightBlockData {
  outboundFlight: FlightInfo
  returnFlight: FlightInfo
  flightStyle?: FlightStyleType
}

/**
 * 行程特色區塊資料
 */
export interface FeaturesBlockData {
  features: Feature[]
  featuresStyle?: FeaturesStyleType
}

/**
 * 精選景點區塊資料
 */
export interface FocusCardsBlockData {
  focusCards: FocusCard[]
}

/**
 * 領隊與集合區塊資料
 */
export interface LeaderMeetingBlockData {
  leader: LeaderInfo
  meetingPoints: MeetingPoint[]
}

/**
 * 飯店區塊資料
 */
export interface HotelsBlockData {
  hotels: HotelInfo[]
}

/**
 * 每日行程區塊資料
 */
export interface DailyItineraryBlockData {
  itinerarySubtitle: string
  dailyItinerary: DailyItinerary[]
  itineraryStyle?: ItineraryStyleType
}

/**
 * 團費明細區塊資料
 */
export interface PricingBlockData {
  pricingDetails: PricingDetails
}

/**
 * 價格方案區塊資料
 */
export interface PriceTiersBlockData {
  priceTiers: PriceTier[]
}

/**
 * 常見問題區塊資料
 */
export interface FAQsBlockData {
  faqs: FAQ[]
}

/**
 * 提醒事項區塊資料
 */
export interface NoticesBlockData {
  notices: string[]
}

/**
 * 取消政策區塊資料
 */
export interface CancellationBlockData {
  cancellationPolicy: string[]
}

// ============================================================
// 區塊聯合類型
// ============================================================

/**
 * 區塊資料類型映射
 */
export interface BlockDataMap {
  COVER: CoverBlockData
  FLIGHT: FlightBlockData
  FEATURES: FeaturesBlockData
  FOCUS_CARDS: FocusCardsBlockData
  LEADER_MEETING: LeaderMeetingBlockData
  HOTELS: HotelsBlockData
  DAILY_ITINERARY: DailyItineraryBlockData
  PRICING: PricingBlockData
  PRICE_TIERS: PriceTiersBlockData
  FAQS: FAQsBlockData
  NOTICES: NoticesBlockData
  CANCELLATION: CancellationBlockData
}

/**
 * 泛型區塊定義
 */
export interface Block<T extends BlockType = BlockType> {
  meta: BlockMeta & { type: T }
  data: BlockDataMap[T]
}

/**
 * 所有區塊的聯合類型
 */
export type AnyBlock =
  | Block<'COVER'>
  | Block<'FLIGHT'>
  | Block<'FEATURES'>
  | Block<'FOCUS_CARDS'>
  | Block<'LEADER_MEETING'>
  | Block<'HOTELS'>
  | Block<'DAILY_ITINERARY'>
  | Block<'PRICING'>
  | Block<'PRICE_TIERS'>
  | Block<'FAQS'>
  | Block<'NOTICES'>
  | Block<'CANCELLATION'>

// ============================================================
// 區塊編輯器狀態
// ============================================================

/**
 * 編輯器狀態
 */
export interface BlockEditorState {
  blocks: AnyBlock[]
  selectedBlockId: string | null
  isDirty: boolean
  autoSaveStatus: 'idle' | 'saving' | 'saved' | 'error'
}

/**
 * 編輯器動作
 */
export type BlockEditorAction =
  | { type: 'ADD_BLOCK'; payload: { blockType: BlockType; afterId?: string } }
  | { type: 'REMOVE_BLOCK'; payload: { blockId: string } }
  | { type: 'UPDATE_BLOCK'; payload: { blockId: string; data: Partial<BlockDataMap[BlockType]> } }
  | { type: 'MOVE_BLOCK'; payload: { blockId: string; direction: 'up' | 'down' } }
  | { type: 'TOGGLE_VISIBILITY'; payload: { blockId: string } }
  | { type: 'SELECT_BLOCK'; payload: { blockId: string | null } }
  | { type: 'REORDER_BLOCKS'; payload: { blocks: AnyBlock[] } }
  | { type: 'SET_BLOCKS'; payload: { blocks: AnyBlock[] } }
  | { type: 'SET_DIRTY'; payload: { isDirty: boolean } }
  | { type: 'SET_AUTOSAVE_STATUS'; payload: { status: 'idle' | 'saving' | 'saved' | 'error' } }

// ============================================================
// 區塊配置（用於工具箱）
// ============================================================

/**
 * 區塊配置
 */
export interface BlockConfig {
  type: BlockType
  label: string
  icon: string
  description: string
  defaultData: BlockDataMap[BlockType]
  canAdd: boolean      // 是否可以新增（某些區塊只能有一個）
  canRemove: boolean   // 是否可以刪除
  canReorder: boolean  // 是否可以重新排序
  maxCount?: number    // 最大數量限制
}

/**
 * 區塊配置註冊表
 */
export const BLOCK_CONFIGS: Record<BlockType, BlockConfig> = {
  COVER: {
    type: 'COVER',
    label: '封面',
    icon: 'Image',
    description: '行程封面與基本資訊',
    defaultData: {
      tagline: '',
      title: '',
      subtitle: '',
      description: '',
      departureDate: '',
      tourCode: '',
      country: '',
      city: '',
      coverStyle: 'original',
    },
    canAdd: false,
    canRemove: false,
    canReorder: false,
    maxCount: 1,
  },
  FLIGHT: {
    type: 'FLIGHT',
    label: '航班資訊',
    icon: 'Plane',
    description: '往返航班資訊',
    defaultData: {
      outboundFlight: {
        airline: '',
        flightNumber: '',
        departureAirport: '',
        departureTime: '',
        arrivalAirport: '',
        arrivalTime: '',
      },
      returnFlight: {
        airline: '',
        flightNumber: '',
        departureAirport: '',
        departureTime: '',
        arrivalAirport: '',
        arrivalTime: '',
      },
      flightStyle: 'original',
    },
    canAdd: false,
    canRemove: false,
    canReorder: true,
    maxCount: 1,
  },
  FEATURES: {
    type: 'FEATURES',
    label: '行程特色',
    icon: 'Star',
    description: '行程亮點與特色',
    defaultData: {
      features: [],
      featuresStyle: 'original',
    },
    canAdd: false,
    canRemove: false,
    canReorder: true,
    maxCount: 1,
  },
  FOCUS_CARDS: {
    type: 'FOCUS_CARDS',
    label: '精選景點',
    icon: 'MapPin',
    description: '精選景點照片牆',
    defaultData: {
      focusCards: [],
    },
    canAdd: false,
    canRemove: false,
    canReorder: true,
    maxCount: 1,
  },
  LEADER_MEETING: {
    type: 'LEADER_MEETING',
    label: '領隊與集合',
    icon: 'Users',
    description: '領隊資訊與集合地點',
    defaultData: {
      leader: { name: '', domesticPhone: '', overseasPhone: '' },
      meetingPoints: [{ time: '', location: '' }],
    },
    canAdd: false,
    canRemove: false,
    canReorder: true,
    maxCount: 1,
  },
  HOTELS: {
    type: 'HOTELS',
    label: '飯店資訊',
    icon: 'Building',
    description: '住宿飯店介紹',
    defaultData: {
      hotels: [],
    },
    canAdd: false,
    canRemove: false,
    canReorder: true,
    maxCount: 1,
  },
  DAILY_ITINERARY: {
    type: 'DAILY_ITINERARY',
    label: '每日行程',
    icon: 'Calendar',
    description: '每日行程安排',
    defaultData: {
      itinerarySubtitle: '',
      dailyItinerary: [],
      itineraryStyle: 'original',
    },
    canAdd: false,
    canRemove: false,
    canReorder: true,
    maxCount: 1,
  },
  PRICING: {
    type: 'PRICING',
    label: '團費明細',
    icon: 'DollarSign',
    description: '費用包含與不含',
    defaultData: {
      pricingDetails: {
        included_items: [],
        excluded_items: [],
        notes: [],
      },
    },
    canAdd: true,
    canRemove: true,
    canReorder: true,
    maxCount: 1,
  },
  PRICE_TIERS: {
    type: 'PRICE_TIERS',
    label: '價格方案',
    icon: 'Tag',
    description: '多人數價格方案',
    defaultData: {
      priceTiers: [],
    },
    canAdd: true,
    canRemove: true,
    canReorder: true,
    maxCount: 1,
  },
  FAQS: {
    type: 'FAQS',
    label: '常見問題',
    icon: 'HelpCircle',
    description: 'FAQ 問答',
    defaultData: {
      faqs: [],
    },
    canAdd: true,
    canRemove: true,
    canReorder: true,
    maxCount: 1,
  },
  NOTICES: {
    type: 'NOTICES',
    label: '提醒事項',
    icon: 'AlertCircle',
    description: '行前注意事項',
    defaultData: {
      notices: [],
    },
    canAdd: true,
    canRemove: true,
    canReorder: true,
    maxCount: 1,
  },
  CANCELLATION: {
    type: 'CANCELLATION',
    label: '取消政策',
    icon: 'XCircle',
    description: '退費與取消規定',
    defaultData: {
      cancellationPolicy: [],
    },
    canAdd: true,
    canRemove: true,
    canReorder: true,
    maxCount: 1,
  },
}

// ============================================================
// 工具函數
// ============================================================

/**
 * 建立新區塊
 */
export function createBlock<T extends BlockType>(
  type: T,
  order: number,
  data?: Partial<BlockDataMap[T]>
): Block<T> {
  const config = BLOCK_CONFIGS[type]
  return {
    meta: {
      id: `block-${type.toLowerCase()}-${Date.now()}`,
      type,
      order,
      visible: true,
      collapsed: false,
    },
    data: {
      ...config.defaultData,
      ...data,
    } as BlockDataMap[T],
  }
}

/**
 * 取得區塊顯示標籤
 */
export function getBlockLabel(type: BlockType): string {
  return BLOCK_CONFIGS[type].label
}

/**
 * 取得區塊圖示名稱
 */
export function getBlockIcon(type: BlockType): string {
  return BLOCK_CONFIGS[type].icon
}

/**
 * 檢查區塊類型是否可以新增
 */
export function canAddBlock(type: BlockType, currentBlocks: AnyBlock[]): boolean {
  const config = BLOCK_CONFIGS[type]
  if (!config.canAdd) return false

  const currentCount = currentBlocks.filter(b => b.meta.type === type).length
  if (config.maxCount && currentCount >= config.maxCount) return false

  return true
}
