/**
 * 報價 ↔ 行程同步 — E2E 整合測試
 *
 * 報價建立住宿項目 → 同步到行程
 * 行程改餐廳 → 同步回報價
 * 版本管理（建新版本、比較差異）
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('swr', () => ({ default: vi.fn(), mutate: vi.fn() }))
vi.mock('@/lib/utils/logger', () => ({
  logger: { log: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

// ---- 型別定義 ----
interface CostItem {
  id: string; name: string; quantity: number | null
  unit_price: number; total: number; day?: number
  room_type?: string
}

interface CostCategory {
  id: string; name: string; items: CostItem[]; total: number
}

interface QuoteVersion {
  id: string; version: number; categories: CostCategory[]
  total_cost: number; group_size: number
  participant_counts: {
    adult: number; child_with_bed: number; child_no_bed: number
    single_room: number; infant: number
  }
  selling_prices: {
    adult: number; child_with_bed: number; child_no_bed: number
    single_room: number; infant: number
  }
  created_at: string
}

interface Quote {
  id: string; name: string; status: string; version: number
  tour_id: string | null; itinerary_id: string | null
  categories: CostCategory[]; total_cost: number
  versions: QuoteVersion[]
}

interface DailyItineraryDay {
  dayLabel: string; date: string; title: string
  meals: { breakfast: string; lunch: string; dinner: string }
  accommodation: string
}

interface Itinerary {
  id: string; tour_id: string | null
  daily_itinerary: DailyItineraryDay[]
}

// ---- 同步邏輯（從 itinerary-quote-sync.ts 提取核心邏輯） ----

function convertDailyItineraryToMeals(dailyItinerary: DailyItineraryDay[]): CostItem[] {
  const items: CostItem[] = []
  for (let i = 0; i < dailyItinerary.length; i++) {
    const day = dailyItinerary[i]
    const dayNum = i + 1
    if (day.meals?.breakfast && day.meals.breakfast !== '飯店早餐') {
      items.push({ id: `meal-${dayNum}-b`, name: `Day${dayNum} 早餐：${day.meals.breakfast}`, quantity: null, unit_price: 0, total: 0, day: dayNum })
    }
    if (day.meals?.lunch) {
      items.push({ id: `meal-${dayNum}-l`, name: `Day${dayNum} 午餐：${day.meals.lunch}`, quantity: null, unit_price: 0, total: 0, day: dayNum })
    }
    if (day.meals?.dinner) {
      items.push({ id: `meal-${dayNum}-d`, name: `Day${dayNum} 晚餐：${day.meals.dinner}`, quantity: null, unit_price: 0, total: 0, day: dayNum })
    }
  }
  return items
}

function convertDailyItineraryToAccommodation(dailyItinerary: DailyItineraryDay[]): CostItem[] {
  const items: CostItem[] = []
  const getActualHotelName = (accommodation: string): string => {
    const match = accommodation.match(/^同上\s*\((.+)\)$/)
    return match ? match[1] : accommodation
  }
  for (let i = 0; i < dailyItinerary.length; i++) {
    const day = dailyItinerary[i]
    const dayNum = i + 1
    if (i === dailyItinerary.length - 1) break // 最後一天不住宿
    if (!day.accommodation) continue
    const hotelName = getActualHotelName(day.accommodation)
    items.push({ id: `acc-${dayNum}`, name: hotelName, quantity: null, unit_price: 0, total: 0, day: dayNum })
  }
  return items
}

function syncItineraryToQuoteCategories(
  existingCategories: CostCategory[],
  dailyItinerary: DailyItineraryDay[]
): CostCategory[] {
  const newMealsItems = convertDailyItineraryToMeals(dailyItinerary)
  const newAccommodationItems = convertDailyItineraryToAccommodation(dailyItinerary)

  const updatedCategories = existingCategories.map(cat => {
    if (cat.id === 'meals') {
      const itemsWithPrices = newMealsItems.map(newItem => {
        const match = newItem.name.match(/Day(\d+)\s*(早餐|午餐|晚餐)/)
        if (match) {
          const existing = cat.items.find(old => old.name.startsWith(`Day${match[1]} ${match[2]}`))
          if (existing) return { ...newItem, unit_price: existing.unit_price, total: existing.total }
        }
        return newItem
      })
      return { ...cat, items: itemsWithPrices, total: itemsWithPrices.reduce((s, i) => s + i.total, 0) }
    }
    if (cat.id === 'accommodation') {
      const itemsWithPrices = newAccommodationItems.map(newItem => {
        const existing = cat.items.find(old => old.day === newItem.day)
        if (existing) return { ...newItem, unit_price: existing.unit_price, total: existing.total, room_type: existing.room_type }
        return newItem
      })
      return { ...cat, items: itemsWithPrices, total: itemsWithPrices.reduce((s, i) => s + i.total, 0) }
    }
    return cat
  })

  // 新增缺少的分類
  if (!updatedCategories.find(c => c.id === 'meals') && newMealsItems.length > 0) {
    updatedCategories.push({ id: 'meals', name: '餐飲', items: newMealsItems, total: 0 })
  }
  if (!updatedCategories.find(c => c.id === 'accommodation') && newAccommodationItems.length > 0) {
    updatedCategories.push({ id: 'accommodation', name: '住宿', items: newAccommodationItems, total: 0 })
  }

  return updatedCategories
}

function createNewVersion(quote: Quote): QuoteVersion {
  return {
    id: `v${quote.version + 1}`,
    version: quote.version + 1,
    categories: JSON.parse(JSON.stringify(quote.categories)),
    total_cost: quote.total_cost,
    group_size: 0,
    participant_counts: { adult: 0, child_with_bed: 0, child_no_bed: 0, single_room: 0, infant: 0 },
    selling_prices: { adult: 0, child_with_bed: 0, child_no_bed: 0, single_room: 0, infant: 0 },
    created_at: new Date().toISOString(),
  }
}

function compareVersions(v1: QuoteVersion, v2: QuoteVersion): {
  addedItems: string[]; removedItems: string[]; priceChanges: Array<{ item: string; oldPrice: number; newPrice: number }>
} {
  const v1Items = new Map<string, CostItem>()
  const v2Items = new Map<string, CostItem>()
  for (const cat of v1.categories) for (const item of cat.items) v1Items.set(item.name, item)
  for (const cat of v2.categories) for (const item of cat.items) v2Items.set(item.name, item)

  const addedItems: string[] = []
  const removedItems: string[] = []
  const priceChanges: Array<{ item: string; oldPrice: number; newPrice: number }> = []

  for (const [name] of v2Items) {
    if (!v1Items.has(name)) addedItems.push(name)
  }
  for (const [name] of v1Items) {
    if (!v2Items.has(name)) removedItems.push(name)
  }
  for (const [name, v2Item] of v2Items) {
    const v1Item = v1Items.get(name)
    if (v1Item && v1Item.total !== v2Item.total) {
      priceChanges.push({ item: name, oldPrice: v1Item.total, newPrice: v2Item.total })
    }
  }
  return { addedItems, removedItems, priceChanges }
}

// ---- 測試 ----

describe('報價 ↔ 行程同步', () => {
  let quote: Quote
  let itinerary: Itinerary

  beforeEach(() => {
    vi.clearAllMocks()

    quote = {
      id: 'q1', name: '清邁五日遊報價', status: 'proposed', version: 1,
      tour_id: 't1', itinerary_id: 'it1', total_cost: 0,
      categories: [
        { id: 'accommodation', name: '住宿', items: [
          { id: 'ai1', name: '清邁文華酒店', quantity: null, unit_price: 3000, total: 12000, day: 1 },
          { id: 'ai2', name: '清邁文華酒店', quantity: null, unit_price: 3000, total: 12000, day: 2 },
        ], total: 24000 },
        { id: 'meals', name: '餐飲', items: [
          { id: 'mi1', name: 'Day1 午餐：鳳飛飛豬腳', quantity: null, unit_price: 200, total: 200, day: 1 },
          { id: 'mi2', name: 'Day1 晚餐：千人火鍋', quantity: null, unit_price: 500, total: 500, day: 1 },
        ], total: 700 },
        { id: 'transport', name: '交通', items: [
          { id: 'ti1', name: '機場接送', quantity: 1, unit_price: 5000, total: 5000 },
        ], total: 5000 },
      ],
      versions: [],
    }

    itinerary = {
      id: 'it1', tour_id: 't1',
      daily_itinerary: [
        { dayLabel: 'Day 1', date: '2026-03-01', title: '抵達清邁',
          meals: { breakfast: '飯店早餐', lunch: '鳳飛飛豬腳', dinner: '千人火鍋' },
          accommodation: '清邁文華酒店' },
        { dayLabel: 'Day 2', date: '2026-03-02', title: '素帖山',
          meals: { breakfast: '飯店早餐', lunch: '泰北料理', dinner: '河畔餐廳' },
          accommodation: '同上 (清邁文華酒店)' },
        { dayLabel: 'Day 3', date: '2026-03-03', title: '回程',
          meals: { breakfast: '飯店早餐', lunch: '機場便當', dinner: '' },
          accommodation: '' },
      ],
    }
  })

  describe('報價建立住宿項目 → 同步到行程', () => {
    it('住宿項目數量 = 天數 - 1（最後一天不住宿）', () => {
      const accItems = convertDailyItineraryToAccommodation(itinerary.daily_itinerary)
      expect(accItems).toHaveLength(2) // 3天行程，住2晚
      expect(accItems[0].name).toBe('清邁文華酒店')
      expect(accItems[1].name).toBe('清邁文華酒店') // 「同上」被解析
    })

    it('「同上 (xxx)」格式被正確解析為實際飯店名', () => {
      const accItems = convertDailyItineraryToAccommodation(itinerary.daily_itinerary)
      expect(accItems[1].name).toBe('清邁文華酒店')
      expect(accItems[1].name).not.toContain('同上')
    })

    it('飯店早餐不列入餐飲項目', () => {
      const mealItems = convertDailyItineraryToMeals(itinerary.daily_itinerary)
      const breakfasts = mealItems.filter(i => i.name.includes('早餐'))
      expect(breakfasts).toHaveLength(0) // 全部都是飯店早餐，不列入
    })

    it('空住宿天不生成項目', () => {
      itinerary.daily_itinerary[0].accommodation = ''
      const accItems = convertDailyItineraryToAccommodation(itinerary.daily_itinerary)
      expect(accItems).toHaveLength(1) // 只有 Day2
    })
  })

  describe('行程改餐廳 → 同步回報價', () => {
    it('改午餐 → 報價餐飲項目更新，保留已填價格', () => {
      // 行程改午餐
      itinerary.daily_itinerary[0].meals.lunch = '改去 Huen Phen'

      const updated = syncItineraryToQuoteCategories(quote.categories, itinerary.daily_itinerary)
      const meals = updated.find(c => c.id === 'meals')!
      const day1Lunch = meals.items.find(i => i.name.includes('Day1 午餐'))!

      expect(day1Lunch.name).toBe('Day1 午餐：改去 Huen Phen')
      // 舊的 Day1 午餐有 200 的 total，同步後因名稱前綴相同而保留
      expect(day1Lunch.total).toBe(200)
    })

    it('新增餐 → 報價新增項目（價格為 0）', () => {
      // Day2 本來沒有在報價裡，同步後會新增
      const updated = syncItineraryToQuoteCategories(quote.categories, itinerary.daily_itinerary)
      const meals = updated.find(c => c.id === 'meals')!
      const day2Lunch = meals.items.find(i => i.name.includes('Day2 午餐'))

      expect(day2Lunch).toBeDefined()
      expect(day2Lunch!.name).toBe('Day2 午餐：泰北料理')
      expect(day2Lunch!.total).toBe(0) // 新項目價格為 0
    })

    it('刪除餐（空字串）→ 報價移除該項目', () => {
      itinerary.daily_itinerary[0].meals.dinner = ''
      const updated = syncItineraryToQuoteCategories(quote.categories, itinerary.daily_itinerary)
      const meals = updated.find(c => c.id === 'meals')!
      const day1Dinner = meals.items.find(i => i.name.includes('Day1 晚餐'))
      expect(day1Dinner).toBeUndefined()
    })

    it('交通等非同步分類不受影響', () => {
      const updated = syncItineraryToQuoteCategories(quote.categories, itinerary.daily_itinerary)
      const transport = updated.find(c => c.id === 'transport')!
      expect(transport.items).toHaveLength(1)
      expect(transport.items[0].total).toBe(5000)
    })
  })

  describe('住宿同步 — 保留價格', () => {
    it('換飯店 → 名稱更新但保留同天數的價格', () => {
      itinerary.daily_itinerary[0].accommodation = '清邁四季酒店'
      const updated = syncItineraryToQuoteCategories(quote.categories, itinerary.daily_itinerary)
      const acc = updated.find(c => c.id === 'accommodation')!

      expect(acc.items[0].name).toBe('清邁四季酒店')
      expect(acc.items[0].total).toBe(12000) // 保留 day=1 的價格
    })

    it('新增住宿天 → 價格為 0', () => {
      itinerary.daily_itinerary = [
        ...itinerary.daily_itinerary.slice(0, 2),
        { dayLabel: 'Day 3', date: '2026-03-03', title: '延伸',
          meals: { breakfast: '飯店早餐', lunch: '', dinner: '' },
          accommodation: '清邁希爾頓' },
        { dayLabel: 'Day 4', date: '2026-03-04', title: '回程',
          meals: { breakfast: '飯店早餐', lunch: '', dinner: '' },
          accommodation: '' },
      ]
      const updated = syncItineraryToQuoteCategories(quote.categories, itinerary.daily_itinerary)
      const acc = updated.find(c => c.id === 'accommodation')!
      expect(acc.items).toHaveLength(3)
      expect(acc.items[2].name).toBe('清邁希爾頓')
      expect(acc.items[2].total).toBe(0)
    })
  })

  describe('版本管理', () => {
    it('建新版本 → 版本號遞增', () => {
      const newVer = createNewVersion(quote)
      expect(newVer.version).toBe(2)
      expect(newVer.categories).toEqual(quote.categories)
    })

    it('建新版本 → 深拷貝（修改不影響原版）', () => {
      const newVer = createNewVersion(quote)
      newVer.categories[0].items[0].total = 99999
      expect(quote.categories[0].items[0].total).toBe(12000)
    })

    it('比較版本差異 — 新增項目', () => {
      const v1: QuoteVersion = {
        id: 'v1', version: 1, total_cost: 0, group_size: 0,
        participant_counts: { adult: 0, child_with_bed: 0, child_no_bed: 0, single_room: 0, infant: 0 },
        selling_prices: { adult: 0, child_with_bed: 0, child_no_bed: 0, single_room: 0, infant: 0 },
        categories: [{ id: 'meals', name: '餐飲', items: [
          { id: 'mi1', name: 'Day1 午餐：鳳飛飛豬腳', quantity: null, unit_price: 200, total: 200, day: 1 },
        ], total: 200 }],
        created_at: '2026-01-01T00:00:00Z',
      }
      const v2: QuoteVersion = {
        ...v1, id: 'v2', version: 2,
        categories: [{ id: 'meals', name: '餐飲', items: [
          { id: 'mi1', name: 'Day1 午餐：鳳飛飛豬腳', quantity: null, unit_price: 200, total: 200, day: 1 },
          { id: 'mi2', name: 'Day1 晚餐：千人火鍋', quantity: null, unit_price: 500, total: 500, day: 1 },
        ], total: 700 }],
      }

      const diff = compareVersions(v1, v2)
      expect(diff.addedItems).toContain('Day1 晚餐：千人火鍋')
      expect(diff.removedItems).toHaveLength(0)
    })

    it('比較版本差異 — 移除項目', () => {
      const v1: QuoteVersion = {
        id: 'v1', version: 1, total_cost: 0, group_size: 0,
        participant_counts: { adult: 0, child_with_bed: 0, child_no_bed: 0, single_room: 0, infant: 0 },
        selling_prices: { adult: 0, child_with_bed: 0, child_no_bed: 0, single_room: 0, infant: 0 },
        categories: [{ id: 'meals', name: '餐飲', items: [
          { id: 'mi1', name: 'Day1 午餐：鳳飛飛豬腳', quantity: null, unit_price: 200, total: 200, day: 1 },
          { id: 'mi2', name: 'Day1 晚餐：千人火鍋', quantity: null, unit_price: 500, total: 500, day: 1 },
        ], total: 700 }],
        created_at: '2026-01-01T00:00:00Z',
      }
      const v2: QuoteVersion = {
        ...v1, id: 'v2', version: 2,
        categories: [{ id: 'meals', name: '餐飲', items: [
          { id: 'mi1', name: 'Day1 午餐：鳳飛飛豬腳', quantity: null, unit_price: 200, total: 200, day: 1 },
        ], total: 200 }],
      }

      const diff = compareVersions(v1, v2)
      expect(diff.removedItems).toContain('Day1 晚餐：千人火鍋')
    })

    it('比較版本差異 — 價格變更', () => {
      const v1: QuoteVersion = {
        id: 'v1', version: 1, total_cost: 0, group_size: 0,
        participant_counts: { adult: 0, child_with_bed: 0, child_no_bed: 0, single_room: 0, infant: 0 },
        selling_prices: { adult: 0, child_with_bed: 0, child_no_bed: 0, single_room: 0, infant: 0 },
        categories: [{ id: 'accommodation', name: '住宿', items: [
          { id: 'ai1', name: '清邁文華酒店', quantity: null, unit_price: 3000, total: 12000, day: 1 },
        ], total: 12000 }],
        created_at: '2026-01-01T00:00:00Z',
      }
      const v2: QuoteVersion = {
        ...v1, id: 'v2', version: 2,
        categories: [{ id: 'accommodation', name: '住宿', items: [
          { id: 'ai1', name: '清邁文華酒店', quantity: null, unit_price: 5000, total: 20000, day: 1 },
        ], total: 20000 }],
      }

      const diff = compareVersions(v1, v2)
      expect(diff.priceChanges).toHaveLength(1)
      expect(diff.priceChanges[0]).toEqual({ item: '清邁文華酒店', oldPrice: 12000, newPrice: 20000 })
    })
  })

  describe('邊界情況', () => {
    it('空行程 → 不生成任何項目', () => {
      const meals = convertDailyItineraryToMeals([])
      const acc = convertDailyItineraryToAccommodation([])
      expect(meals).toHaveLength(0)
      expect(acc).toHaveLength(0)
    })

    it('單天行程 → 無住宿（最後一天）', () => {
      const singleDay: DailyItineraryDay[] = [{
        dayLabel: 'Day 1', date: '2026-03-01', title: '一日遊',
        meals: { breakfast: '', lunch: '午餐店', dinner: '' },
        accommodation: '酒店',
      }]
      const acc = convertDailyItineraryToAccommodation(singleDay)
      expect(acc).toHaveLength(0) // 只有一天 = 最後一天
    })

    it('報價無 meals/accommodation 分類 → 同步時自動新增', () => {
      const emptyCategories: CostCategory[] = [
        { id: 'transport', name: '交通', items: [], total: 0 },
      ]
      const updated = syncItineraryToQuoteCategories(emptyCategories, itinerary.daily_itinerary)

      expect(updated.find(c => c.id === 'meals')).toBeDefined()
      expect(updated.find(c => c.id === 'accommodation')).toBeDefined()
      expect(updated.find(c => c.id === 'transport')).toBeDefined()
    })

    it('所有餐都是飯店早餐且無午晚餐 → 不建餐飲分類', () => {
      const hotelOnlyDays: DailyItineraryDay[] = [
        { dayLabel: 'Day 1', date: '2026-03-01', title: 'Day1',
          meals: { breakfast: '飯店早餐', lunch: '', dinner: '' },
          accommodation: '酒店' },
        { dayLabel: 'Day 2', date: '2026-03-02', title: 'Day2',
          meals: { breakfast: '飯店早餐', lunch: '', dinner: '' },
          accommodation: '' },
      ]
      const emptyCategories: CostCategory[] = []
      const updated = syncItineraryToQuoteCategories(emptyCategories, hotelOnlyDays)
      expect(updated.find(c => c.id === 'meals')).toBeUndefined()
    })
  })
})
