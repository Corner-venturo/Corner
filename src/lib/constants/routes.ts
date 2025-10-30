/**
 * Routes Constants
 * 路由相關常數
 */

// Public Routes (不需登入)
export const PUBLIC_ROUTES = ['/login', '/unauthorized'] as const

// Admin Only Routes
export const ADMIN_ROUTES = ['/hr', '/settings', '/database'] as const

// Finance Routes
export const FINANCE_ROUTES = [
  '/finance',
  '/finance/payments',
  '/finance/requests',
  '/finance/reports',
  '/finance/treasury',
] as const

// API Routes
export const API_ROUTES = {
  HEALTH: '/api/health',
  HEALTH_DETAILED: '/api/health/detailed',
  LOG_ERROR: '/api/log-error',
  WORKSPACES: '/api/workspaces',
} as const

export type PublicRoute = (typeof PUBLIC_ROUTES)[number]
export type AdminRoute = (typeof ADMIN_ROUTES)[number]
export type FinanceRoute = (typeof FINANCE_ROUTES)[number]
