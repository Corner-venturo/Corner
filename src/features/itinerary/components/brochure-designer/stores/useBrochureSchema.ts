/**
 * Brochure Schema Store
 * Zustand store for managing brochure schema state
 *
 * 職責：
 * 1. 管理 BrochureSchema 狀態
 * 2. 提供頁面 CRUD 操作
 * 3. 提供元素更新和覆寫操作
 * 4. 支援從 Itinerary 刷新資料
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { v4 as uuidv4 } from 'uuid'
import type {
  BrochureSchema,
  PageSchema,
  PageTemplateType,
  PageDataSnapshot,
  ElementOverride,
  BrochureSettings,
} from '../schema/types'
import type { CanvasElement, TextElement } from '../canvas-editor/types'
import { generatePageElements, createDataSnapshotFromItinerary } from '../schema/generateElements'
import { themeRegistry, type ThemeDefinition, type ApplyThemeOptions } from '../schema/themes'

// ============================================================================
// 類型定義
// ============================================================================

interface BrochureSchemaState {
  /** 當前手冊 Schema */
  schema: BrochureSchema | null

  /** 是否有未儲存的變更 */
  isDirty: boolean

  /** 是否正在載入 */
  isLoading: boolean

  /** 錯誤訊息 */
  error: string | null
}

interface BrochureSchemaActions {
  // ============================================================================
  // 手冊操作
  // ============================================================================

  /** 建立新手冊 */
  createBrochure: (name: string, itineraryId?: string) => void

  /** 載入手冊 */
  loadBrochure: (schema: BrochureSchema) => void

  /** 從行程表初始化手冊 */
  initializeFromItinerary: (itinerary: ItineraryData, name?: string) => void

  /** 清除手冊 */
  clearBrochure: () => void

  /** 更新手冊名稱 */
  updateBrochureName: (name: string) => void

  /** 標記為已儲存 */
  markAsSaved: () => void

  /** 套用主題 */
  applyTheme: (themeId: string, options?: Partial<ApplyThemeOptions>) => void

  /** 取得當前主題 */
  getCurrentTheme: () => ThemeDefinition | undefined

  // ============================================================================
  // 頁面操作
  // ============================================================================

  /** 新增頁面 */
  addPage: (pageType: PageTemplateType, dataSnapshot?: PageDataSnapshot, afterPageId?: string) => string

  /** 移除頁面 */
  removePage: (pageId: string) => void

  /** 複製頁面 */
  duplicatePage: (pageId: string) => string | null

  /** 重新排序頁面 */
  reorderPages: (pageIds: string[]) => void

  /** 選擇頁面 */
  selectPage: (pageId: string) => void

  /** 更新頁面資料快照 */
  updatePageDataSnapshot: (pageId: string, dataSnapshot: Partial<PageDataSnapshot>) => void

  /** 從來源刷新頁面 */
  refreshPageFromSource: (pageId: string, itinerary: ItineraryData) => void

  /** 刷新所有頁面 */
  refreshAllPagesFromSource: (itinerary: ItineraryData) => void

  // ============================================================================
  // 元素操作
  // ============================================================================

  /** 更新頁面元素 */
  updatePageElements: (pageId: string, elements: CanvasElement[]) => void

  /** 更新單一元素 */
  updateElement: (pageId: string, elementId: string, updates: Partial<CanvasElement>) => void

  /** 新增元素覆寫 */
  addElementOverride: (pageId: string, elementName: string, override: ElementOverride) => void

  /** 移除元素覆寫 */
  removeElementOverride: (pageId: string, elementName: string) => void

  /** 重置頁面元素（清除所有覆寫） */
  resetPageElements: (pageId: string) => void

  // ============================================================================
  // 工具方法
  // ============================================================================

  /** 取得當前頁面 */
  getCurrentPage: () => PageSchema | null

  /** 取得頁面 by ID */
  getPageById: (pageId: string) => PageSchema | null

  /** 取得下一頁 ID */
  getNextPageId: (currentPageId: string) => string | null

  /** 取得上一頁 ID */
  getPrevPageId: (currentPageId: string) => string | null
}

// ============================================================================
// 行程表資料類型（簡化版）
// ============================================================================

interface ItineraryData {
  id?: string
  title?: string
  country?: string
  city?: string
  tour_code?: string
  departure_date?: string
  cover_image?: string
  outbound_flight?: {
    airline?: string
    flightNumber?: string
    departureTime?: string
    departureAirport?: string
    arrivalTime?: string
    arrivalAirport?: string
  }
  return_flight?: {
    airline?: string
    flightNumber?: string
    departureTime?: string
    departureAirport?: string
    arrivalTime?: string
    arrivalAirport?: string
  }
  leader?: { name?: string; domesticPhone?: string }
  meeting_info?: { time?: string; location?: string }
  daily_itinerary?: Array<{
    title?: string
    highlight?: string
    activities?: Array<{ title: string; description?: string; image?: string }>
    images?: Array<string | { url: string }>
  }>
  hotels?: Array<{
    name: string
    image?: string
    address?: string
    phone?: string
    checkIn?: string
    checkOut?: string
    days?: number[]
  }>
}

// ============================================================================
// 預設設定
// ============================================================================

const DEFAULT_SETTINGS: BrochureSettings = {
  pageSize: { width: 559, height: 794 },
  bleed: { top: 3, right: 3, bottom: 3, left: 3 },
  themeId: 'classic',
  theme: {
    primaryColor: '#0d9488',
    accentColor: '#f97316',
    fontFamily: 'Noto Sans TC',
  },
}

// ============================================================================
// Store 實作
// ============================================================================

export const useBrochureSchema = create<BrochureSchemaState & BrochureSchemaActions>()(
  immer((set, get) => ({
    // 初始狀態
    schema: null,
    isDirty: false,
    isLoading: false,
    error: null,

    // ========================================================================
    // 手冊操作
    // ========================================================================

    createBrochure: (name, itineraryId) => {
      const now = new Date().toISOString()
      set(state => {
        state.schema = {
          id: uuidv4(),
          name,
          itineraryId,
          settings: DEFAULT_SETTINGS,
          pages: [],
          currentPageId: undefined,
          createdAt: now,
          updatedAt: now,
          version: 1,
        }
        state.isDirty = true
        state.error = null
      })
    },

    loadBrochure: (schema) => {
      set(state => {
        state.schema = schema
        state.isDirty = false
        state.error = null
      })
    },

    initializeFromItinerary: (itinerary, name) => {
      const now = new Date().toISOString()
      const brochureId = uuidv4()
      const pages: PageSchema[] = []
      const defaultThemeId = DEFAULT_SETTINGS.themeId || 'classic'

      // 建立頁面的輔助函數（使用主題系統生成元素）
      const createPage = (
        type: PageTemplateType,
        pageName: string,
        dataSnapshot: PageDataSnapshot,
        dayIndex?: number
      ): PageSchema => {
        const pageId = uuidv4()
        return {
          id: pageId,
          type,
          name: pageName,
          order: pages.length,
          dataSnapshot,
          sourceRef: itinerary.id ? {
            itineraryId: itinerary.id,
            lastSyncAt: now,
          } : undefined,
          elements: generatePageElements({
            pageType: type,
            dataSnapshot,
            themeId: defaultThemeId,
            settings: DEFAULT_SETTINGS,
          }),
          overrides: {},
          locked: false,
          visible: true,
        }
      }

      // 建立基礎資料快照
      const baseSnapshot = createDataSnapshotFromItinerary(itinerary, 'cover')

      // 1. 封面
      pages.push(createPage('cover', '封面', baseSnapshot))

      // 2. 空白頁（封面背面）
      pages.push(createPage('blank', '空白頁', {}))

      // 3. 目錄
      pages.push(createPage('contents', '目錄', baseSnapshot))

      // 4. 總攬（左右）
      const overviewSnapshot = createDataSnapshotFromItinerary(itinerary, 'overview-left')
      pages.push(createPage('overview-left', '總攬左', overviewSnapshot))

      const overviewRightSnapshot = createDataSnapshotFromItinerary(itinerary, 'overview-right')
      pages.push(createPage('overview-right', '總攬右', overviewRightSnapshot))

      // 5. 每日行程（根據天數動態生成）
      const dailyItinerary = itinerary.daily_itinerary || []
      dailyItinerary.forEach((_, dayIndex) => {
        const dayLeftSnapshot = createDataSnapshotFromItinerary(itinerary, 'day-left', dayIndex)
        pages.push(createPage('day-left', `Day ${dayIndex + 1} 左`, dayLeftSnapshot, dayIndex))

        const dayRightSnapshot = createDataSnapshotFromItinerary(itinerary, 'day-right', dayIndex)
        pages.push(createPage('day-right', `Day ${dayIndex + 1} 右`, dayRightSnapshot, dayIndex))
      })

      // 6. 住宿
      if (itinerary.hotels && itinerary.hotels.length > 0) {
        const accSnapshot = createDataSnapshotFromItinerary(itinerary, 'accommodation-left')
        pages.push(createPage('accommodation-left', '住宿左', accSnapshot))
        pages.push(createPage('accommodation-right', '住宿右', accSnapshot))
      }

      set(state => {
        state.schema = {
          id: brochureId,
          name: name || `${itinerary.city || '旅遊'} 手冊`,
          itineraryId: itinerary.id,
          settings: DEFAULT_SETTINGS,
          pages,
          currentPageId: pages[0]?.id,
          createdAt: now,
          updatedAt: now,
          version: 1,
        }
        state.isDirty = true
        state.error = null
      })
    },

    clearBrochure: () => {
      set(state => {
        state.schema = null
        state.isDirty = false
        state.error = null
      })
    },

    updateBrochureName: (name) => {
      set(state => {
        if (state.schema) {
          state.schema.name = name
          state.schema.updatedAt = new Date().toISOString()
          state.isDirty = true
        }
      })
    },

    markAsSaved: () => {
      set(state => {
        if (state.schema) {
          state.schema.updatedAt = new Date().toISOString()
          state.schema.version += 1
        }
        state.isDirty = false
      })
    },

    applyTheme: (themeId, options = {}) => {
      const theme = themeRegistry.getTheme(themeId)
      if (!theme) {
        console.warn(`[BrochureSchema] Theme "${themeId}" not found`)
        return
      }

      const { preserveOverrides = true, preserveDataSnapshots = true } = options

      set(state => {
        if (!state.schema) return

        // 更新設定
        state.schema.settings.themeId = themeId
        state.schema.settings.theme = {
          primaryColor: theme.style.colors.primary,
          accentColor: theme.style.colors.accent,
          fontFamily: theme.style.fonts.primary,
        }

        // 重新生成所有頁面的元素
        state.schema.pages.forEach((page: PageSchema) => {
          const layoutGenerator = theme.layouts[page.type as keyof typeof theme.layouts]
          if (!layoutGenerator) return

          // 保留或清除資料快照
          const dataSnapshot = preserveDataSnapshots ? page.dataSnapshot : {}

          // 使用主題的 layout generator 生成新元素
          const newElements = layoutGenerator(
            dataSnapshot,
            theme.style,
            state.schema!.settings
          )

          // 套用覆寫（如果保留）
          if (preserveOverrides && Object.keys(page.overrides).length > 0) {
            page.elements = newElements.map((el: CanvasElement) => {
              const override = page.overrides[el.name]
              if (!override) return el
              return {
                ...el,
                ...override,
                style: el.type === 'text' && override.style
                  ? { ...(el as TextElement).style, ...override.style }
                  : (el as TextElement).style,
              } as CanvasElement
            })
          } else {
            page.elements = newElements
            if (!preserveOverrides) {
              page.overrides = {}
            }
          }
        })

        state.schema.updatedAt = new Date().toISOString()
        state.isDirty = true
      })
    },

    getCurrentTheme: () => {
      const { schema } = get()
      if (!schema) return undefined
      return themeRegistry.getTheme(schema.settings.themeId || 'classic')
    },

    // ========================================================================
    // 頁面操作
    // ========================================================================

    addPage: (pageType, dataSnapshot = {}, afterPageId) => {
      const pageId = uuidv4()

      set(state => {
        if (!state.schema) return

        const newPage: PageSchema = {
          id: pageId,
          type: pageType,
          name: getPageTypeName(pageType),
          order: state.schema.pages.length,
          dataSnapshot,
          elements: generatePageElements({
            pageType,
            dataSnapshot,
            themeId: state.schema.settings.themeId,
            settings: state.schema.settings,
          }),
          overrides: {},
          locked: false,
          visible: true,
        }

        if (afterPageId) {
          const afterIndex = state.schema.pages.findIndex((p: PageSchema) => p.id === afterPageId)
          if (afterIndex !== -1) {
            state.schema.pages.splice(afterIndex + 1, 0, newPage)
            // 重新計算 order
            state.schema.pages.forEach((p: PageSchema, i: number) => { p.order = i })
          } else {
            state.schema.pages.push(newPage)
          }
        } else {
          state.schema.pages.push(newPage)
        }

        state.schema.updatedAt = new Date().toISOString()
        state.isDirty = true
      })

      return pageId
    },

    removePage: (pageId) => {
      set(state => {
        if (!state.schema) return

        const index = state.schema.pages.findIndex((p: PageSchema) => p.id === pageId)
        if (index === -1) return

        state.schema.pages.splice(index, 1)
        state.schema.pages.forEach((p: PageSchema, i: number) => { p.order = i })

        // 如果刪除的是當前頁面，選擇相鄰頁面
        if (state.schema.currentPageId === pageId) {
          state.schema.currentPageId = state.schema.pages[Math.min(index, state.schema.pages.length - 1)]?.id
        }

        state.schema.updatedAt = new Date().toISOString()
        state.isDirty = true
      })
    },

    duplicatePage: (pageId) => {
      const { schema } = get()
      if (!schema) return null

      const page = schema.pages.find(p => p.id === pageId)
      if (!page) return null

      const newPageId = uuidv4()

      set(state => {
        if (!state.schema) return

        const index = state.schema.pages.findIndex((p: PageSchema) => p.id === pageId)
        const newPage: PageSchema = {
          ...JSON.parse(JSON.stringify(page)),
          id: newPageId,
          name: `${page.name} (複本)`,
          order: index + 1,
        }

        // 重新生成元素 ID
        newPage.elements = newPage.elements.map((el: CanvasElement) => ({
          ...el,
          id: `${el.type}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        }))

        state.schema.pages.splice(index + 1, 0, newPage)
        state.schema.pages.forEach((p: PageSchema, i: number) => { p.order = i })
        state.schema.updatedAt = new Date().toISOString()
        state.isDirty = true
      })

      return newPageId
    },

    reorderPages: (pageIds) => {
      set(state => {
        if (!state.schema) return

        const orderedPages = pageIds
          .map(id => state.schema!.pages.find((p: PageSchema) => p.id === id))
          .filter((p): p is PageSchema => p !== undefined)

        orderedPages.forEach((p: PageSchema, i: number) => { p.order = i })
        state.schema.pages = orderedPages
        state.schema.updatedAt = new Date().toISOString()
        state.isDirty = true
      })
    },

    selectPage: (pageId) => {
      set(state => {
        if (state.schema) {
          state.schema.currentPageId = pageId
        }
      })
    },

    updatePageDataSnapshot: (pageId, dataSnapshot) => {
      set(state => {
        if (!state.schema) return

        const page = state.schema.pages.find((p: PageSchema) => p.id === pageId)
        if (!page) return

        page.dataSnapshot = { ...page.dataSnapshot, ...dataSnapshot }

        // 重新生成元素（使用主題系統）
        page.elements = generatePageElements({
          pageType: page.type,
          dataSnapshot: page.dataSnapshot,
          overrides: page.overrides,
          themeId: state.schema.settings.themeId,
          settings: state.schema.settings,
        })

        state.schema.updatedAt = new Date().toISOString()
        state.isDirty = true
      })
    },

    refreshPageFromSource: (pageId, itinerary) => {
      set(state => {
        if (!state.schema) return

        const page = state.schema.pages.find((p: PageSchema) => p.id === pageId)
        if (!page) return

        // 取得 dayIndex（如果是每日行程頁）
        const dayIndex = page.dataSnapshot.day?.dayIndex

        // 重新建立資料快照
        page.dataSnapshot = createDataSnapshotFromItinerary(itinerary, page.type, dayIndex)

        // 更新來源參考
        if (itinerary.id) {
          page.sourceRef = {
            itineraryId: itinerary.id,
            lastSyncAt: new Date().toISOString(),
          }
        }

        // 重新生成元素（使用主題系統，保留覆寫）
        page.elements = generatePageElements({
          pageType: page.type,
          dataSnapshot: page.dataSnapshot,
          overrides: page.overrides,
          themeId: state.schema.settings.themeId,
          settings: state.schema.settings,
        })

        state.schema.updatedAt = new Date().toISOString()
        state.isDirty = true
      })
    },

    refreshAllPagesFromSource: (itinerary) => {
      const { schema } = get()
      if (!schema) return

      schema.pages.forEach(page => {
        get().refreshPageFromSource(page.id, itinerary)
      })
    },

    // ========================================================================
    // 元素操作
    // ========================================================================

    updatePageElements: (pageId, elements) => {
      set(state => {
        if (!state.schema) return

        const page = state.schema.pages.find((p: PageSchema) => p.id === pageId)
        if (!page) return

        page.elements = elements
        state.schema.updatedAt = new Date().toISOString()
        state.isDirty = true
      })
    },

    updateElement: (pageId, elementId, updates) => {
      set(state => {
        if (!state.schema) return

        const page = state.schema.pages.find((p: PageSchema) => p.id === pageId)
        if (!page) return

        const element = page.elements.find((e: CanvasElement) => e.id === elementId)
        if (!element) return

        Object.assign(element, updates)
        state.schema.updatedAt = new Date().toISOString()
        state.isDirty = true
      })
    },

    addElementOverride: (pageId, elementName, override) => {
      set(state => {
        if (!state.schema) return

        const page = state.schema.pages.find((p: PageSchema) => p.id === pageId)
        if (!page) return

        page.overrides[elementName] = {
          ...page.overrides[elementName],
          ...override,
        }

        // 套用覆寫到元素
        const element = page.elements.find((e: CanvasElement) => e.name === elementName)
        if (element) {
          Object.assign(element, override)
        }

        state.schema.updatedAt = new Date().toISOString()
        state.isDirty = true
      })
    },

    removeElementOverride: (pageId, elementName) => {
      set(state => {
        if (!state.schema) return

        const page = state.schema.pages.find((p: PageSchema) => p.id === pageId)
        if (!page) return

        delete page.overrides[elementName]

        // 重新生成元素
        page.elements = generatePageElements({
          pageType: page.type,
          dataSnapshot: page.dataSnapshot,
          overrides: page.overrides,
          themeId: state.schema.settings.themeId,
          settings: state.schema.settings,
        })

        state.schema.updatedAt = new Date().toISOString()
        state.isDirty = true
      })
    },

    resetPageElements: (pageId) => {
      set(state => {
        if (!state.schema) return

        const page = state.schema.pages.find((p: PageSchema) => p.id === pageId)
        if (!page) return

        page.overrides = {}
        page.elements = generatePageElements({
          pageType: page.type,
          dataSnapshot: page.dataSnapshot,
          themeId: state.schema.settings.themeId,
          settings: state.schema.settings,
        })

        state.schema.updatedAt = new Date().toISOString()
        state.isDirty = true
      })
    },

    // ========================================================================
    // 工具方法
    // ========================================================================

    getCurrentPage: () => {
      const { schema } = get()
      if (!schema || !schema.currentPageId) return null
      return schema.pages.find(p => p.id === schema.currentPageId) || null
    },

    getPageById: (pageId) => {
      const { schema } = get()
      if (!schema) return null
      return schema.pages.find(p => p.id === pageId) || null
    },

    getNextPageId: (currentPageId) => {
      const { schema } = get()
      if (!schema) return null

      const index = schema.pages.findIndex(p => p.id === currentPageId)
      if (index === -1 || index >= schema.pages.length - 1) return null

      return schema.pages[index + 1].id
    },

    getPrevPageId: (currentPageId) => {
      const { schema } = get()
      if (!schema) return null

      const index = schema.pages.findIndex(p => p.id === currentPageId)
      if (index <= 0) return null

      return schema.pages[index - 1].id
    },
  }))
)

// ============================================================================
// 輔助函數
// ============================================================================

function getPageTypeName(type: PageTemplateType): string {
  const names: Record<PageTemplateType, string> = {
    'cover': '封面',
    'blank': '空白頁',
    'contents': '目錄',
    'overview-left': '總攬左',
    'overview-right': '總攬右',
    'day-left': '每日行程左',
    'day-right': '每日行程右',
    'accommodation-left': '住宿左',
    'accommodation-right': '住宿右',
    'custom': '自訂頁面',
  }
  return names[type] || '頁面'
}

// ============================================================================
// Selectors
// ============================================================================

/** 取得當前頁面 */
export const useCurrentPage = () => useBrochureSchema(state => {
  if (!state.schema || !state.schema.currentPageId) return null
  return state.schema.pages.find(p => p.id === state.schema?.currentPageId) || null
})

/** 取得所有頁面 */
export const usePages = () => useBrochureSchema(state => state.schema?.pages || [])

/** 取得頁面數量 */
export const usePageCount = () => useBrochureSchema(state => state.schema?.pages.length || 0)

/** 取得是否有未儲存變更 */
export const useIsDirty = () => useBrochureSchema(state => state.isDirty)

/** 取得手冊名稱 */
export const useBrochureName = () => useBrochureSchema(state => state.schema?.name || '')
