/**
 * 頁面模板定義
 * Page Template Definitions
 */

import type { CanvasElement } from '../canvas-editor/types'

// ============= 區塊類型 =============

export type RegionType =
  | 'text'           // 文字區塊
  | 'image'          // 圖片區塊
  | 'map'            // 地圖
  | 'qrcode'         // QR Code
  | 'weather'        // 天氣資訊
  | 'decoration'     // 裝飾
  | 'icon'           // 圖標
  | 'divider'        // 分隔線
  | 'card'           // 卡片容器
  | 'timeline'       // 時間軸
  | 'grid'           // 網格容器

export type TextVariant =
  | 'title'          // 大標題
  | 'subtitle'       // 副標題
  | 'heading'        // 區塊標題
  | 'body'           // 內文
  | 'caption'        // 說明文字
  | 'label'          // 標籤
  | 'page-number'    // 頁碼

// ============= 區塊定義 =============

export interface TemplateRegion {
  id: string
  type: RegionType

  // 位置與尺寸 (百分比，相對於頁面)
  x: number          // 0-100
  y: number          // 0-100
  width: number      // 0-100
  height: number     // 0-100

  // 資料綁定
  dataBinding?: string  // 綁定的資料路徑，如 'day.title', 'activities[0].image'

  // 文字專用
  textVariant?: TextVariant
  textAlign?: 'left' | 'center' | 'right'

  // 圖片專用
  objectFit?: 'cover' | 'contain' | 'fill'

  // 裝飾專用
  decorationType?: 'pattern' | 'stamp' | 'divider' | 'frame'
  decorationId?: string

  // 樣式覆寫
  style?: {
    backgroundColor?: string
    borderRadius?: number
    padding?: number
    opacity?: number
  }

  // 條件顯示
  showIf?: string    // 條件表達式，如 'activities.length > 0'

  // 子區塊（用於 card, grid 等容器）
  children?: TemplateRegion[]
}

// ============= 頁面模板 =============

export type PageType =
  | 'cover'
  | 'blank'
  | 'contents'
  | 'overview-left'
  | 'overview-right'
  | 'daily-left'
  | 'daily-right'
  | 'accommodation'
  | 'info'
  | 'notes'
  | 'back-cover'

export interface PageTemplate {
  id: string
  type: PageType
  name: string
  description: string

  // 頁面基本設定
  background?: string  // 背景顏色或圖片

  // 區塊定義
  regions: TemplateRegion[]

  // 適用條件
  conditions?: {
    minActivities?: number
    maxActivities?: number
    hasImages?: boolean
    hasMeals?: boolean
    hasHotel?: boolean
  }

  // 優先級（同條件時選擇優先級高的）
  priority?: number
}

// ============= 封面模板 =============

export const COVER_FULLBLEED: PageTemplate = {
  id: 'cover-fullbleed',
  type: 'cover',
  name: '滿版封面',
  description: '全幅背景圖片，文字覆蓋',
  regions: [
    // 背景圖
    {
      id: 'bg-image',
      type: 'image',
      x: 0, y: 0, width: 100, height: 100,
      dataBinding: 'coverImage',
      objectFit: 'cover',
    },
    // 漸層遮罩
    {
      id: 'overlay',
      type: 'decoration',
      x: 0, y: 50, width: 100, height: 50,
      decorationType: 'pattern',
      decorationId: 'gradient-bottom',
      style: { opacity: 0.8 },
    },
    // 目的地標題
    {
      id: 'destination',
      type: 'text',
      x: 10, y: 65, width: 80, height: 15,
      dataBinding: 'city',
      textVariant: 'title',
      textAlign: 'center',
    },
    // 國家
    {
      id: 'country',
      type: 'text',
      x: 10, y: 58, width: 80, height: 8,
      dataBinding: 'country',
      textVariant: 'subtitle',
      textAlign: 'center',
    },
    // 日期
    {
      id: 'dates',
      type: 'text',
      x: 10, y: 80, width: 80, height: 5,
      dataBinding: 'travelDates',
      textVariant: 'caption',
      textAlign: 'center',
    },
    // 公司 Logo
    {
      id: 'logo',
      type: 'image',
      x: 40, y: 90, width: 20, height: 8,
      dataBinding: 'companyLogo',
      objectFit: 'contain',
    },
  ],
}

export const COVER_FRAMED: PageTemplate = {
  id: 'cover-framed',
  type: 'cover',
  name: '相框封面',
  description: '圖片在相框內，周圍有邊框裝飾',
  regions: [
    // 背景
    {
      id: 'bg',
      type: 'decoration',
      x: 0, y: 0, width: 100, height: 100,
      decorationType: 'pattern',
      decorationId: 'subtle-pattern',
    },
    // 相框
    {
      id: 'frame',
      type: 'decoration',
      x: 10, y: 15, width: 80, height: 50,
      decorationType: 'frame',
      decorationId: 'elegant-frame',
    },
    // 圖片
    {
      id: 'main-image',
      type: 'image',
      x: 12, y: 17, width: 76, height: 46,
      dataBinding: 'coverImage',
      objectFit: 'cover',
      style: { borderRadius: 4 },
    },
    // 標題
    {
      id: 'title',
      type: 'text',
      x: 10, y: 70, width: 80, height: 10,
      dataBinding: 'city',
      textVariant: 'title',
      textAlign: 'center',
    },
    // 副標題
    {
      id: 'subtitle',
      type: 'text',
      x: 10, y: 80, width: 80, height: 5,
      dataBinding: 'travelDates',
      textVariant: 'subtitle',
      textAlign: 'center',
    },
    // 裝飾線
    {
      id: 'divider',
      type: 'divider',
      x: 30, y: 78, width: 40, height: 2,
      decorationType: 'divider',
      decorationId: 'ornament-line',
    },
  ],
}

// ============= 目錄模板 =============

export const CONTENTS_SIMPLE: PageTemplate = {
  id: 'contents-simple',
  type: 'contents',
  name: '簡約目錄',
  description: '清晰的行程日期列表',
  regions: [
    // 標題
    {
      id: 'title',
      type: 'text',
      x: 10, y: 8, width: 80, height: 8,
      textVariant: 'title',
      textAlign: 'center',
      dataBinding: '"目錄"',
    },
    // 英文副標
    {
      id: 'subtitle',
      type: 'text',
      x: 10, y: 16, width: 80, height: 4,
      textVariant: 'caption',
      textAlign: 'center',
      dataBinding: '"CONTENTS"',
    },
    // 分隔線
    {
      id: 'divider',
      type: 'divider',
      x: 35, y: 22, width: 30, height: 1,
    },
    // 行程列表區域（動態生成）
    {
      id: 'day-list',
      type: 'timeline',
      x: 15, y: 28, width: 70, height: 65,
      dataBinding: 'dailyItinerary',
    },
    // 頁碼
    {
      id: 'page-number',
      type: 'text',
      x: 45, y: 95, width: 10, height: 3,
      textVariant: 'page-number',
      textAlign: 'center',
      dataBinding: '"03"',
    },
  ],
}

// ============= 總攬頁模板 =============

export const OVERVIEW_LEFT_FLIGHT: PageTemplate = {
  id: 'overview-left-flight',
  type: 'overview-left',
  name: '總攬左頁 - 航班資訊',
  description: '航班、集合地點、領隊資訊',
  regions: [
    // 標題
    {
      id: 'title',
      type: 'text',
      x: 8, y: 6, width: 50, height: 6,
      textVariant: 'heading',
      dataBinding: '"行程總攬"',
    },
    {
      id: 'subtitle',
      type: 'text',
      x: 8, y: 12, width: 50, height: 3,
      textVariant: 'caption',
      dataBinding: '"TRIP OVERVIEW"',
    },
    // 航班資訊卡片
    {
      id: 'flight-card',
      type: 'card',
      x: 8, y: 18, width: 84, height: 25,
      children: [
        {
          id: 'flight-icon',
          type: 'icon',
          x: 3, y: 15, width: 8, height: 30,
          dataBinding: '"plane"',
        },
        {
          id: 'flight-title',
          type: 'text',
          x: 15, y: 10, width: 40, height: 20,
          textVariant: 'label',
          dataBinding: '"航班資訊"',
        },
        {
          id: 'outbound',
          type: 'text',
          x: 15, y: 35, width: 80, height: 25,
          textVariant: 'body',
          dataBinding: 'flightInfo.outbound',
        },
        {
          id: 'inbound',
          type: 'text',
          x: 15, y: 65, width: 80, height: 25,
          textVariant: 'body',
          dataBinding: 'flightInfo.inbound',
        },
      ],
    },
    // 集合資訊
    {
      id: 'meeting-card',
      type: 'card',
      x: 8, y: 46, width: 84, height: 18,
      children: [
        {
          id: 'meeting-icon',
          type: 'icon',
          x: 3, y: 20, width: 8, height: 40,
          dataBinding: '"map-pin"',
        },
        {
          id: 'meeting-title',
          type: 'text',
          x: 15, y: 15, width: 40, height: 25,
          textVariant: 'label',
          dataBinding: '"集合地點"',
        },
        {
          id: 'meeting-info',
          type: 'text',
          x: 15, y: 45, width: 80, height: 45,
          textVariant: 'body',
          dataBinding: 'meetingPoint',
        },
      ],
    },
    // 領隊資訊
    {
      id: 'leader-card',
      type: 'card',
      x: 8, y: 67, width: 84, height: 18,
      children: [
        {
          id: 'leader-icon',
          type: 'icon',
          x: 3, y: 20, width: 8, height: 40,
          dataBinding: '"user"',
        },
        {
          id: 'leader-title',
          type: 'text',
          x: 15, y: 15, width: 40, height: 25,
          textVariant: 'label',
          dataBinding: '"領隊資訊"',
        },
        {
          id: 'leader-name',
          type: 'text',
          x: 15, y: 45, width: 40, height: 25,
          textVariant: 'body',
          dataBinding: 'leader.name',
        },
        {
          id: 'leader-phone',
          type: 'text',
          x: 55, y: 45, width: 40, height: 25,
          textVariant: 'body',
          dataBinding: 'leader.phone',
        },
      ],
    },
    // 頁碼
    {
      id: 'page-number',
      type: 'text',
      x: 5, y: 95, width: 10, height: 3,
      textVariant: 'page-number',
      dataBinding: '"04"',
    },
  ],
}

export const OVERVIEW_RIGHT_SCHEDULE: PageTemplate = {
  id: 'overview-right-schedule',
  type: 'overview-right',
  name: '總攬右頁 - 行程總覽',
  description: '每日行程簡要列表',
  regions: [
    // 標題
    {
      id: 'title',
      type: 'text',
      x: 8, y: 6, width: 50, height: 6,
      textVariant: 'heading',
      dataBinding: '"行程總攬"',
    },
    {
      id: 'subtitle',
      type: 'text',
      x: 8, y: 12, width: 50, height: 3,
      textVariant: 'caption',
      dataBinding: '"ITINERARY OVERVIEW"',
    },
    // 時間軸
    {
      id: 'timeline',
      type: 'timeline',
      x: 8, y: 18, width: 84, height: 75,
      dataBinding: 'dailyItinerary',
    },
    // 頁碼
    {
      id: 'page-number',
      type: 'text',
      x: 85, y: 95, width: 10, height: 3,
      textVariant: 'page-number',
      textAlign: 'right',
      dataBinding: '"05"',
    },
  ],
}

// ============= 每日行程模板 =============

export const DAILY_LEFT_LARGE_IMAGE: PageTemplate = {
  id: 'daily-left-large-image',
  type: 'daily-left',
  name: '每日左頁 - 大圖版',
  description: '適合 1-2 個景點，大圖展示',
  conditions: {
    maxActivities: 2,
    hasImages: true,
  },
  priority: 10,
  regions: [
    // 日期標籤
    {
      id: 'day-badge',
      type: 'card',
      x: 5, y: 5, width: 15, height: 12,
      style: { borderRadius: 8 },
      children: [
        {
          id: 'day-label',
          type: 'text',
          x: 10, y: 15, width: 80, height: 30,
          textVariant: 'caption',
          textAlign: 'center',
          dataBinding: '"DAY"',
        },
        {
          id: 'day-number',
          type: 'text',
          x: 10, y: 45, width: 80, height: 45,
          textVariant: 'title',
          textAlign: 'center',
          dataBinding: 'dayNumber',
        },
      ],
    },
    // 日期
    {
      id: 'date',
      type: 'text',
      x: 22, y: 6, width: 40, height: 4,
      textVariant: 'caption',
      dataBinding: 'date',
    },
    // 標題
    {
      id: 'title',
      type: 'text',
      x: 22, y: 10, width: 70, height: 6,
      textVariant: 'heading',
      dataBinding: 'day.title',
    },
    // 主圖
    {
      id: 'main-image',
      type: 'image',
      x: 5, y: 20, width: 90, height: 45,
      dataBinding: 'day.activities[0].image',
      objectFit: 'cover',
      style: { borderRadius: 12 },
    },
    // 景點說明
    {
      id: 'description',
      type: 'text',
      x: 5, y: 68, width: 90, height: 25,
      textVariant: 'body',
      dataBinding: 'day.activities[0].description',
    },
    // 頁碼
    {
      id: 'page-number',
      type: 'text',
      x: 5, y: 95, width: 10, height: 3,
      textVariant: 'page-number',
      dataBinding: 'pageNumber',
    },
  ],
}

export const DAILY_LEFT_COMPACT: PageTemplate = {
  id: 'daily-left-compact',
  type: 'daily-left',
  name: '每日左頁 - 緊湊版',
  description: '適合 3-5 個景點，緊湊展示',
  conditions: {
    minActivities: 3,
  },
  priority: 5,
  regions: [
    // 日期標籤
    {
      id: 'day-badge',
      type: 'card',
      x: 5, y: 5, width: 12, height: 10,
      children: [
        {
          id: 'day-label',
          type: 'text',
          x: 10, y: 20, width: 80, height: 30,
          textVariant: 'caption',
          textAlign: 'center',
          dataBinding: '"DAY"',
        },
        {
          id: 'day-number',
          type: 'text',
          x: 10, y: 50, width: 80, height: 40,
          textVariant: 'heading',
          textAlign: 'center',
          dataBinding: 'dayNumber',
        },
      ],
    },
    // 日期與標題
    {
      id: 'date',
      type: 'text',
      x: 20, y: 5, width: 30, height: 3,
      textVariant: 'caption',
      dataBinding: 'date',
    },
    {
      id: 'title',
      type: 'text',
      x: 20, y: 9, width: 75, height: 5,
      textVariant: 'heading',
      dataBinding: 'day.title',
    },
    // 時間軸行程
    {
      id: 'timeline',
      type: 'timeline',
      x: 5, y: 18, width: 90, height: 75,
      dataBinding: 'day.activities',
    },
    // 頁碼
    {
      id: 'page-number',
      type: 'text',
      x: 5, y: 95, width: 10, height: 3,
      textVariant: 'page-number',
      dataBinding: 'pageNumber',
    },
  ],
}

export const DAILY_RIGHT_SPOTS: PageTemplate = {
  id: 'daily-right-spots',
  type: 'daily-right',
  name: '每日右頁 - 景點介紹',
  description: '景點圖片與說明',
  regions: [
    // 標題
    {
      id: 'title',
      type: 'text',
      x: 8, y: 6, width: 50, height: 5,
      textVariant: 'heading',
      dataBinding: '"景點介紹"',
    },
    {
      id: 'subtitle',
      type: 'text',
      x: 8, y: 11, width: 50, height: 3,
      textVariant: 'caption',
      dataBinding: '"HIGHLIGHTS"',
    },
    // 景點網格
    {
      id: 'spots-grid',
      type: 'grid',
      x: 5, y: 16, width: 90, height: 78,
      dataBinding: 'day.activities',
    },
    // 頁碼
    {
      id: 'page-number',
      type: 'text',
      x: 85, y: 95, width: 10, height: 3,
      textVariant: 'page-number',
      textAlign: 'right',
      dataBinding: 'pageNumber',
    },
  ],
}

// ============= 住宿頁模板 =============

export const ACCOMMODATION_LIST: PageTemplate = {
  id: 'accommodation-list',
  type: 'accommodation',
  name: '住宿總覽',
  description: '所有住宿資訊列表',
  regions: [
    // 標題
    {
      id: 'title',
      type: 'text',
      x: 8, y: 6, width: 50, height: 6,
      textVariant: 'heading',
      dataBinding: '"住宿資訊"',
    },
    {
      id: 'subtitle',
      type: 'text',
      x: 8, y: 12, width: 50, height: 3,
      textVariant: 'caption',
      dataBinding: '"ACCOMMODATIONS"',
    },
    // 住宿列表
    {
      id: 'hotel-list',
      type: 'grid',
      x: 5, y: 18, width: 90, height: 75,
      dataBinding: 'accommodations',
    },
    // 頁碼
    {
      id: 'page-number',
      type: 'text',
      x: 45, y: 95, width: 10, height: 3,
      textVariant: 'page-number',
      textAlign: 'center',
      dataBinding: 'pageNumber',
    },
  ],
}

// ============= 實用資訊頁模板 =============

export const INFO_PAGE: PageTemplate = {
  id: 'info-page',
  type: 'info',
  name: '實用資訊',
  description: '天氣、匯率、緊急聯絡',
  regions: [
    // 標題
    {
      id: 'title',
      type: 'text',
      x: 8, y: 6, width: 50, height: 6,
      textVariant: 'heading',
      dataBinding: '"實用資訊"',
    },
    // 天氣
    {
      id: 'weather-card',
      type: 'card',
      x: 5, y: 15, width: 42, height: 25,
      children: [
        {
          id: 'weather-title',
          type: 'text',
          x: 8, y: 10, width: 84, height: 20,
          textVariant: 'label',
          dataBinding: '"天氣預報"',
        },
        {
          id: 'weather-content',
          type: 'weather',
          x: 8, y: 35, width: 84, height: 55,
          dataBinding: 'weather',
        },
      ],
    },
    // 匯率
    {
      id: 'currency-card',
      type: 'card',
      x: 53, y: 15, width: 42, height: 25,
      children: [
        {
          id: 'currency-title',
          type: 'text',
          x: 8, y: 10, width: 84, height: 20,
          textVariant: 'label',
          dataBinding: '"參考匯率"',
        },
        {
          id: 'currency-content',
          type: 'text',
          x: 8, y: 35, width: 84, height: 55,
          textVariant: 'body',
          dataBinding: 'currency',
        },
      ],
    },
    // 緊急聯絡
    {
      id: 'emergency-card',
      type: 'card',
      x: 5, y: 45, width: 90, height: 20,
      children: [
        {
          id: 'emergency-title',
          type: 'text',
          x: 5, y: 15, width: 90, height: 25,
          textVariant: 'label',
          dataBinding: '"緊急聯絡"',
        },
        {
          id: 'emergency-content',
          type: 'text',
          x: 5, y: 45, width: 90, height: 45,
          textVariant: 'body',
          dataBinding: 'emergencyContacts',
        },
      ],
    },
    // QR Code
    {
      id: 'qrcode',
      type: 'qrcode',
      x: 35, y: 70, width: 30, height: 22,
      dataBinding: 'itineraryUrl',
    },
    // 頁碼
    {
      id: 'page-number',
      type: 'text',
      x: 45, y: 95, width: 10, height: 3,
      textVariant: 'page-number',
      textAlign: 'center',
      dataBinding: 'pageNumber',
    },
  ],
}

// ============= 模板集合 =============

export const ALL_PAGE_TEMPLATES: PageTemplate[] = [
  // 封面
  COVER_FULLBLEED,
  COVER_FRAMED,
  // 目錄
  CONTENTS_SIMPLE,
  // 總攬
  OVERVIEW_LEFT_FLIGHT,
  OVERVIEW_RIGHT_SCHEDULE,
  // 每日行程
  DAILY_LEFT_LARGE_IMAGE,
  DAILY_LEFT_COMPACT,
  DAILY_RIGHT_SPOTS,
  // 住宿
  ACCOMMODATION_LIST,
  // 實用資訊
  INFO_PAGE,
]

// 根據頁面類型取得模板
export function getTemplatesByType(type: PageType): PageTemplate[] {
  return ALL_PAGE_TEMPLATES.filter(t => t.type === type)
}

// 根據條件選擇最佳模板
export function selectBestTemplate(
  type: PageType,
  context: {
    activityCount?: number
    hasImages?: boolean
    hasMeals?: boolean
    hasHotel?: boolean
  }
): PageTemplate {
  const templates = getTemplatesByType(type)

  // 過濾符合條件的模板
  const eligible = templates.filter(t => {
    if (!t.conditions) return true

    const { minActivities, maxActivities, hasImages, hasMeals, hasHotel } = t.conditions

    if (minActivities && (context.activityCount || 0) < minActivities) return false
    if (maxActivities && (context.activityCount || 0) > maxActivities) return false
    if (hasImages !== undefined && context.hasImages !== hasImages) return false
    if (hasMeals !== undefined && context.hasMeals !== hasMeals) return false
    if (hasHotel !== undefined && context.hasHotel !== hasHotel) return false

    return true
  })

  // 按優先級排序，取最高的
  eligible.sort((a, b) => (b.priority || 0) - (a.priority || 0))

  return eligible[0] || templates[0]
}
