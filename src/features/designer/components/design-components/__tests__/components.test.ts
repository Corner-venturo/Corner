/**
 * 設計元件生成函數測試
 *
 * 驗證：
 * 1. 每個元件能正常生成元素
 * 2. 元素座標在 A5 畫布範圍內（559×794）
 * 3. 文字大小可讀（>=7）
 * 4. 資料綁定正確
 * 5. 兩種風格（japanese / modern）都能正確生成
 */
import { describe, it, expect } from 'vitest'
import { ALL_COMPONENTS, getComponentsByCategory, getComponentById, searchComponents } from '../registry'
import type { ComponentStyle } from '../types'

const A5_WIDTH = 559
const BLEED = 32
const CONTENT_WIDTH = A5_WIDTH - BLEED * 2

const DEFAULT_OPTIONS = {
  width: CONTENT_WIDTH,
  x: BLEED,
  y: 100,
}

describe('設計元件註冊表', () => {
  it('應有 16 個元件', () => {
    expect(ALL_COMPONENTS.length).toBe(16)
  })

  it('每個元件有唯一 ID', () => {
    const ids = ALL_COMPONENTS.map(c => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('getComponentsByCategory 回傳正確分類', () => {
    expect(getComponentsByCategory('cover').length).toBe(2)
    expect(getComponentsByCategory('itinerary').length).toBe(3)
    expect(getComponentsByCategory('info').length).toBe(4)
    expect(getComponentsByCategory('layout').length).toBe(4)
    expect(getComponentsByCategory('utility').length).toBe(3)
  })

  it('getComponentById 能找到元件', () => {
    expect(getComponentById('full-cover')?.name).toBe('全頁封面')
    expect(getComponentById('nonexistent')).toBeUndefined()
  })

  it('searchComponents 支援中文', () => {
    expect(searchComponents('飯店').length).toBeGreaterThan(0)
    expect(searchComponents('航班').length).toBeGreaterThan(0)
    expect(searchComponents('封面').length).toBeGreaterThan(0)
  })
})

describe('元件生成函數', () => {
  const styles: ComponentStyle[] = ['japanese', 'modern']

  ALL_COMPONENTS.forEach(component => {
    describe(component.name, () => {
      styles.forEach(style => {
        describe(`風格: ${style}`, () => {
          const opts = { ...DEFAULT_OPTIONS, style }

          it('能正常生成元素', () => {
            const elements = component.generate(opts)
            expect(elements.length).toBeGreaterThan(0)
          })

          it('每個元素有唯一 ID', () => {
            const elements = component.generate(opts)
            const ids = elements.map(e => e.id)
            expect(new Set(ids).size).toBe(ids.length)
          })

          it('元素座標在合理範圍', () => {
            const elements = component.generate(opts)
            for (const el of elements) {
              expect(el.x).toBeGreaterThanOrEqual(0)
              expect(el.y).toBeGreaterThanOrEqual(0)
              if ('width' in el && typeof el.width === 'number') {
                expect(el.x + el.width).toBeLessThanOrEqual(A5_WIDTH + 1)
              }
            }
          })

          it('文字大小可讀', () => {
            const elements = component.generate(opts)
            for (const el of elements) {
              if (el.type === 'text' && 'style' in el) {
                const textEl = el as { style: { fontSize: number } }
                expect(textEl.style.fontSize).toBeGreaterThanOrEqual(7)
              }
            }
          })
        })
      })
    })
  })
})

describe('風格差異', () => {
  it('japanese 和 modern 使用不同色盤', () => {
    const comp = getComponentById('full-cover')!
    const jpElements = comp.generate({ ...DEFAULT_OPTIONS, style: 'japanese' })
    const mdElements = comp.generate({ ...DEFAULT_OPTIONS, style: 'modern' })

    // 找裝飾線元素，顏色應不同
    const jpLine = jpElements.find(e => e.name === '裝飾線') as { fill: string }
    const mdLine = mdElements.find(e => e.name === '裝飾線') as { fill: string }
    expect(jpLine.fill).toBe('#c9aa7c') // gold
    expect(mdLine.fill).toBe('#2563eb') // blue
  })

  it('不帶 style 預設為 japanese', () => {
    const comp = getComponentById('page-header')!
    const defaultElements = comp.generate(DEFAULT_OPTIONS)
    const jpElements = comp.generate({ ...DEFAULT_OPTIONS, style: 'japanese' })
    const defaultLine = defaultElements.find(e => e.name === '頁眉底線') as { fill: string }
    const jpLine = jpElements.find(e => e.name === '頁眉底線') as { fill: string }
    expect(defaultLine.fill).toBe(jpLine.fill)
  })
})

describe('資料綁定', () => {
  it('全頁封面帶入 tourName', () => {
    const comp = getComponentById('full-cover')!
    const elements = comp.generate({
      ...DEFAULT_OPTIONS,
      data: { tourName: '大阪三日遊' },
    })
    const title = elements.find(e => e.name === '主標題')
    expect(title).toBeDefined()
    expect((title as { content: string }).content).toBe('大阪三日遊')
  })

  it('航班卡帶入去程回程', () => {
    const comp = getComponentById('flight-card')!
    const elements = comp.generate({
      ...DEFAULT_OPTIONS,
      data: { outbound: '去程｜BR100', returnFlight: '回程｜BR101' },
    })
    const outbound = elements.find(e => e.name === '去程航班')
    expect((outbound as { content: string }).content).toBe('去程｜BR100')
  })

  it('飯店卡帶入名稱地址', () => {
    const comp = getComponentById('hotel-card')!
    const elements = comp.generate({
      ...DEFAULT_OPTIONS,
      data: { hotelName: '大阪希爾頓', address: '大阪市北区' },
    })
    const name = elements.find(e => e.name === '飯店名稱')
    expect((name as { content: string }).content).toBe('大阪希爾頓')
  })

  it('每日行程帶入天數標題', () => {
    const comp = getComponentById('daily-card')!
    const elements = comp.generate({
      ...DEFAULT_OPTIONS,
      data: { dayNumber: 3, title: '大阪城公園' },
    })
    const title = elements.find(e => e.name === '行程標題')
    expect((title as { content: string }).content).toBe('大阪城公園')
  })

  it('景點卡片帶入名稱描述', () => {
    const comp = getComponentById('attraction-card')!
    const elements = comp.generate({
      ...DEFAULT_OPTIONS,
      data: { attractionName: '金閣寺', attractionDesc: '京都名勝' },
    })
    const name = elements.find(e => e.name === '景點名稱')
    expect((name as { content: string }).content).toBe('金閣寺')
  })

  it('餐食卡片帶入三餐', () => {
    const comp = getComponentById('meal-card')!
    const elements = comp.generate({
      ...DEFAULT_OPTIONS,
      data: { breakfast: '飯店自助餐', lunch: '拉麵', dinner: '燒肉' },
    })
    const mealEls = elements.filter(e => e.type === 'text' && e.name !== '餐食標題')
    expect(mealEls.length).toBe(3)
  })
})
