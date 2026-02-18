/**
 * 統一權限配置系統
 * 約定大於配置：根據路由自動推斷權限需求
 */

import { logger } from '@/lib/utils/logger'

export interface PermissionConfig {
  id: string
  label: string
  category: string
  routes: string[]
  description?: string
}

/**
 * 功能權限配置
 * 一處定義，處處生效
 */
export const FEATURE_PERMISSIONS: PermissionConfig[] = [
  {
    id: 'super_admin',
    label: '超級管理員',
    category: '全部',
    routes: ['*'], // 所有路由
    description: '擁有系統最高權限，包含所有功能',
  },
  {
    id: 'admin',
    label: '系統管理員',
    category: '全部',
    routes: ['*'], // 所有路由（含 settings）
    description: '擁有系統所有權限（含系統管理功能）',
  },
  {
    id: 'calendar',
    label: '行事曆',
    category: '全部',
    routes: ['/calendar'],
    description: '查看和管理行事曆',
  },
  {
    id: 'workspace',
    label: '工作空間',
    category: '全部',
    routes: ['/workspace'],
    description: '個人工作空間',
  },
  {
    id: 'todos',
    label: '待辦事項',
    category: '全部',
    routes: ['/todos'],
    description: '管理個人待辦事項',
  },
  {
    id: 'timebox',
    label: '時間管理',
    category: '全部',
    routes: ['/timebox'],
    description: '時間箱管理功能',
  },
  {
    id: 'quotes',
    label: '報價管理',
    category: '全部',
    routes: ['/quotes'],
    description: '建立和管理報價單',
  },
  {
    id: 'itinerary',
    label: '行程管理',
    category: '全部',
    routes: ['/itinerary'],
    description: '行程表建立和管理',
  },
  {
    id: 'tours',
    label: '旅遊團管理',
    category: '全部',
    routes: ['/tours'],
    description: '旅遊團建立和管理',
  },
  {
    id: 'orders',
    label: '訂單管理',
    category: '全部',
    routes: ['/orders'],
    description: '訂單處理和管理',
  },
  {
    id: 'customers',
    label: '客戶管理',
    category: '全部',
    routes: ['/customers'],
    description: '客戶資料管理',
  },
  {
    id: 'visas',
    label: '簽證管理',
    category: '全部',
    routes: ['/visas'],
    description: '簽證申請和管理',
  },
  {
    id: 'accounting',
    label: '記帳管理',
    category: '全部',
    routes: ['/accounting'],
    description: '日常記帳功能',
  },
  {
    id: 'payments',
    label: '收款管理',
    category: '全部',
    routes: ['/finance/payments'],
    description: '收款管理',
  },
  {
    id: 'requests',
    label: '請款管理',
    category: '全部',
    routes: ['/finance/requests'],
    description: '請款管理',
  },
  {
    id: 'disbursement',
    label: '出納管理',
    category: '全部',
    routes: ['/finance/treasury'],
    description: '出納和現金流管理',
  },
  {
    id: 'finance_reports',
    label: '財務報表',
    category: '全部',
    routes: ['/finance/reports'],
    description: '財務報表查看',
  },
  // 會計傳票已移除 (V2)
  {
    id: 'hr',
    label: '人資管理',
    category: '全部',
    routes: ['/hr'],
    description: '員工和人事管理',
  },
  {
    id: 'database',
    label: '資料管理',
    category: '全部',
    routes: ['/database'],
    description: '系統資料庫管理',
  },
  {
    id: 'settings',
    label: '系統設定',
    category: '全部',
    routes: ['/settings'],
    description: '系統設定和配置',
  },
  {
    id: 'reports',
    label: '報表管理',
    category: '全部',
    routes: ['/reports'],
    description: '各類報表查看',
  },
  {
    id: 'manifestation',
    label: '顯化魔法',
    category: '全部',
    routes: ['/manifestation'],
    description: '顯化魔法功能',
  },
  // 確認單管理已整合到團的操作中，不再需要獨立權限
  // {
  //   id: 'confirmations',
  //   label: '確認單管理',
  //   category: '全部',
  //   routes: ['/confirmations'],
  //   description: '確認單建立和管理',
  // },
  {
    id: 'esims',
    label: 'eSIM 管理',
    category: '全部',
    routes: ['/esims'],
    description: 'eSIM 申請和管理',
  },
  {
    id: 'company_assets',
    label: '公司資產管理',
    category: '全部',
    routes: ['/database/company-assets'],
    description: '公司 Logo、印章等資產管理',
  },
]

/**
 * 根據路由路徑獲取所需權限
 */
export function getRequiredPermissions(pathname: string): string[] {
  const requiredPermissions: string[] = []

  for (const permission of FEATURE_PERMISSIONS) {
    // 系統管理員有所有權限
    if (permission.id === 'admin') continue

    // 檢查路由是否匹配
    const hasAccess = permission.routes.some(route => {
      if (route === '*') return true
      return pathname.startsWith(route)
    })

    if (hasAccess) {
      requiredPermissions.push(permission.id)
    }
  }

  return requiredPermissions
}

/**
 * 檢查用戶是否有權限訪問指定路由
 */
export function hasPermissionForRoute(userPermissions: string[], pathname: string): boolean {
  // 超級管理員和系統管理員有所有權限
  if (userPermissions.includes('super_admin') || userPermissions.includes('admin')) {
    return true
  }

  // 公開路由不需要權限
  const publicRoutes = ['/', '/login', '/404', '/unauthorized']
  if (publicRoutes.includes(pathname)) {
    return true
  }

  // 獲取所需權限
  const requiredPermissions = getRequiredPermissions(pathname)

  // 安全原則：若無法匹配到任何權限配置，預設拒絕訪問
  // 這可以防止新增路由時忘記設定權限導致的漏洞
  if (requiredPermissions.length === 0) {
    // 記錄未配置的路由以便追蹤
    logger.warn(`[permissions] 路由 ${pathname} 未配置權限，預設拒絕訪問`)
    return false
  }

  // 檢查用戶是否有任一所需權限
  return requiredPermissions.some(permission => userPermissions.includes(permission))
}

/**
 * 為向後兼容保留的權限清單
 * 從 FEATURE_PERMISSIONS 自動生成
 */
export const SYSTEM_PERMISSIONS = FEATURE_PERMISSIONS.map(permission => ({
  id: permission.id,
  label: permission.label,
  category: permission.category,
}))

/**
 * 獲取所有權限類別
 */
export function getPermissionCategories(): string[] {
  const categories = FEATURE_PERMISSIONS.map(p => p.category)
  return [...new Set(categories)]
}

/**
 * 根據類別獲取權限
 */
export function getPermissionsByCategory(category: string): PermissionConfig[] {
  return FEATURE_PERMISSIONS.filter(p => p.category === category)
}
