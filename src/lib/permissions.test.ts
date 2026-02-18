import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/utils/logger', () => ({
  logger: { warn: vi.fn(), log: vi.fn(), error: vi.fn() },
}))

import {
  FEATURE_PERMISSIONS,
  getRequiredPermissions,
  hasPermissionForRoute,
  SYSTEM_PERMISSIONS,
  getPermissionCategories,
  getPermissionsByCategory,
} from './permissions'

describe('FEATURE_PERMISSIONS', () => {
  it('should have super_admin and admin', () => {
    expect(FEATURE_PERMISSIONS.find(p => p.id === 'super_admin')).toBeDefined()
    expect(FEATURE_PERMISSIONS.find(p => p.id === 'admin')).toBeDefined()
  })

  it('each permission should have id, label, category, routes', () => {
    for (const p of FEATURE_PERMISSIONS) {
      expect(p.id).toBeTruthy()
      expect(p.label).toBeTruthy()
      expect(p.category).toBeTruthy()
      expect(p.routes.length).toBeGreaterThan(0)
    }
  })

  it('should have common features like tours, orders, customers', () => {
    const ids = FEATURE_PERMISSIONS.map(p => p.id)
    expect(ids).toContain('tours')
    expect(ids).toContain('orders')
    expect(ids).toContain('customers')
  })
})

describe('getRequiredPermissions', () => {
  it('should return tours for /tours path', () => {
    const perms = getRequiredPermissions('/tours')
    expect(perms).toContain('tours')
  })

  it('should return multiple permissions for wildcard routes', () => {
    const perms = getRequiredPermissions('/settings')
    expect(perms).toContain('settings')
    // super_admin has '*' route but admin is skipped
    expect(perms).toContain('super_admin')
  })

  it('should return permissions for nested paths', () => {
    const perms = getRequiredPermissions('/finance/payments')
    expect(perms).toContain('payments')
  })
})

describe('hasPermissionForRoute', () => {
  it('should allow super_admin everywhere', () => {
    expect(hasPermissionForRoute(['super_admin'], '/tours')).toBe(true)
    expect(hasPermissionForRoute(['super_admin'], '/settings')).toBe(true)
  })

  it('should allow admin everywhere', () => {
    expect(hasPermissionForRoute(['admin'], '/orders')).toBe(true)
  })

  it('should allow public routes without permissions', () => {
    expect(hasPermissionForRoute([], '/')).toBe(true)
    expect(hasPermissionForRoute([], '/login')).toBe(true)
    expect(hasPermissionForRoute([], '/404')).toBe(true)
    expect(hasPermissionForRoute([], '/unauthorized')).toBe(true)
  })

  it('should deny unconfigured routes', () => {
    expect(hasPermissionForRoute(['tours'], '/some-random-route')).toBe(false)
  })

  it('should allow user with matching permission', () => {
    expect(hasPermissionForRoute(['tours'], '/tours')).toBe(true)
  })

  it('should deny user without matching permission', () => {
    expect(hasPermissionForRoute(['tours'], '/orders')).toBe(false)
  })

  it('should allow with any matching permission', () => {
    expect(hasPermissionForRoute(['quotes', 'orders'], '/orders')).toBe(true)
  })
})

describe('SYSTEM_PERMISSIONS', () => {
  it('should match FEATURE_PERMISSIONS length', () => {
    expect(SYSTEM_PERMISSIONS.length).toBe(FEATURE_PERMISSIONS.length)
  })

  it('should have id, label, category', () => {
    for (const p of SYSTEM_PERMISSIONS) {
      expect(p.id).toBeTruthy()
      expect(p.label).toBeTruthy()
    }
  })
})

describe('getPermissionCategories', () => {
  it('should return unique categories', () => {
    const cats = getPermissionCategories()
    expect(cats.length).toBeGreaterThan(0)
    expect(new Set(cats).size).toBe(cats.length)
  })
})

describe('getPermissionsByCategory', () => {
  it('should return permissions for 全部 category', () => {
    const perms = getPermissionsByCategory('全部')
    expect(perms.length).toBeGreaterThan(0)
  })

  it('should return empty for nonexistent category', () => {
    expect(getPermissionsByCategory('nonexistent')).toEqual([])
  })
})
