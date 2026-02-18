import { describe, it, expect } from 'vitest'
import {
  MENU_ITEMS,
  MENU_CATEGORIES,
  MENU_HREF_TO_ID_MAP,
  getMenuItemsByCategory,
  getHideableMenuItems,
  getMenuItemById,
  isMenuItemHidden,
} from './menu-items'

describe('MENU_ITEMS', () => {
  it('is a non-empty array', () => {
    expect(MENU_ITEMS.length).toBeGreaterThan(0)
  })

  it('all items have required fields', () => {
    for (const item of MENU_ITEMS) {
      expect(item.id).toBeTruthy()
      expect(item.label).toBeTruthy()
      expect(item.category).toBeTruthy()
      expect(typeof item.canHide).toBe('boolean')
    }
  })

  it('has unique IDs', () => {
    const ids = MENU_ITEMS.map(i => i.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('core items cannot be hidden', () => {
    const coreItems = MENU_ITEMS.filter(i => i.category === 'core')
    expect(coreItems.length).toBeGreaterThan(0)
    for (const item of coreItems) {
      expect(item.canHide).toBe(false)
    }
  })
})

describe('getMenuItemsByCategory', () => {
  it('returns business items', () => {
    const items = getMenuItemsByCategory('business')
    expect(items.length).toBeGreaterThan(0)
    expect(items.every(i => i.category === 'business')).toBe(true)
  })

  it('returns core items', () => {
    const items = getMenuItemsByCategory('core')
    expect(items.length).toBeGreaterThan(0)
  })

  it('returns finance items', () => {
    const items = getMenuItemsByCategory('finance')
    expect(items.length).toBeGreaterThan(0)
  })

  it('returns hr items', () => {
    const items = getMenuItemsByCategory('hr')
    expect(items.length).toBeGreaterThan(0)
  })

  it('returns settings items', () => {
    const items = getMenuItemsByCategory('settings')
    expect(items.length).toBeGreaterThan(0)
  })
})

describe('getHideableMenuItems', () => {
  it('returns only items with canHide=true', () => {
    const items = getHideableMenuItems()
    expect(items.every(i => i.canHide)).toBe(true)
  })

  it('does not include core unhideable items', () => {
    const items = getHideableMenuItems()
    expect(items.find(i => i.id === 'dashboard')).toBeUndefined()
  })

  it('has fewer items than total', () => {
    expect(getHideableMenuItems().length).toBeLessThan(MENU_ITEMS.length)
  })
})

describe('getMenuItemById', () => {
  it('finds dashboard', () => {
    expect(getMenuItemById('dashboard')).toBeDefined()
    expect(getMenuItemById('dashboard')!.label).toBe('儀表板')
  })

  it('finds tours', () => {
    expect(getMenuItemById('tours')).toBeDefined()
  })

  it('returns undefined for non-existent id', () => {
    expect(getMenuItemById('nonexistent')).toBeUndefined()
  })
})

describe('isMenuItemHidden', () => {
  it('returns true when item is hidden', () => {
    expect(isMenuItemHidden('/tours', ['tours'])).toBe(true)
  })

  it('returns false when item is not hidden', () => {
    expect(isMenuItemHidden('/tours', ['orders'])).toBe(false)
  })

  it('returns false for unknown href', () => {
    expect(isMenuItemHidden('/unknown-page', ['tours'])).toBe(false)
  })

  it('returns false for empty hidden list', () => {
    expect(isMenuItemHidden('/tours', [])).toBe(false)
  })

  it('works with finance sub-routes', () => {
    expect(isMenuItemHidden('/finance/payments', ['payments'])).toBe(true)
  })
})

describe('MENU_CATEGORIES', () => {
  it('has all expected categories', () => {
    expect(MENU_CATEGORIES.core).toBe('核心功能')
    expect(MENU_CATEGORIES.business).toBe('業務管理')
    expect(MENU_CATEGORIES.finance).toBe('財務管理')
    expect(MENU_CATEGORIES.hr).toBe('人力資源')
    expect(MENU_CATEGORIES.settings).toBe('系統設定')
  })
})

describe('MENU_HREF_TO_ID_MAP', () => {
  it('maps / to dashboard', () => {
    expect(MENU_HREF_TO_ID_MAP['/']).toBe('dashboard')
  })

  it('maps /tours to tours', () => {
    expect(MENU_HREF_TO_ID_MAP['/tours']).toBe('tours')
  })

  it('has entries for all major routes', () => {
    expect(Object.keys(MENU_HREF_TO_ID_MAP).length).toBeGreaterThan(10)
  })
})
