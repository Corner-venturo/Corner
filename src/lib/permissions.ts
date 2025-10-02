/**
 * 統一權限配置系統
 * 約定大於配置：根據路由自動推斷權限需求
 */

export interface PermissionConfig {
  id: string;
  label: string;
  category: string;
  routes: string[];
  description?: string;
}

/**
 * 功能權限配置
 * 一處定義，處處生效
 */
export const FEATURE_PERMISSIONS: PermissionConfig[] = [
  // 系統管理
  {
    id: 'super_admin',
    label: '超級管理員',
    category: '系統',
    routes: ['*'], // 所有路由
    description: '擁有系統所有權限'
  },

  // 基礎功能
  {
    id: 'calendar',
    label: '行事曆',
    category: '通用',
    routes: ['/calendar'],
    description: '查看和管理行事曆'
  },
  {
    id: 'workspace',
    label: '工作空間',
    category: '通用',
    routes: ['/workspace'],
    description: '個人工作空間'
  },
  {
    id: 'todos',
    label: '待辦事項',
    category: '通用',
    routes: ['/todos'],
    description: '管理個人待辦事項'
  },
  {
    id: 'timebox',
    label: '時間管理',
    category: '通用',
    routes: ['/timebox'],
    description: '時間箱管理功能'
  },

  // 業務功能
  {
    id: 'quotes',
    label: '報價管理',
    category: '業務',
    routes: ['/quotes'],
    description: '建立和管理報價單'
  },
  {
    id: 'tours',
    label: '旅遊團管理',
    category: '業務',
    routes: ['/tours'],
    description: '旅遊團建立和管理'
  },
  {
    id: 'orders',
    label: '訂單管理',
    category: '業務',
    routes: ['/orders'],
    description: '訂單處理和管理'
  },
  {
    id: 'customers',
    label: '客戶管理',
    category: '業務',
    routes: ['/customers'],
    description: '客戶資料管理'
  },

  // 財務功能
  {
    id: 'accounting',
    label: '記帳管理',
    category: '財務',
    routes: ['/accounting'],
    description: '日常記帳功能'
  },
  {
    id: 'payments',
    label: '收款管理',
    category: '財務',
    routes: ['/finance/payments'],
    description: '收款管理'
  },
  {
    id: 'requests',
    label: '請款管理',
    category: '財務',
    routes: ['/finance/requests'],
    description: '請款管理'
  },
  {
    id: 'disbursement',
    label: '出納管理',
    category: '財務',
    routes: ['/finance/treasury'],
    description: '出納和現金流管理'
  },
  {
    id: 'finance',
    label: '財務系統',
    category: '財務',
    routes: ['/finance', '/finance/reports'],
    description: '財務系統和報表'
  },

  // 管理功能
  {
    id: 'hr',
    label: '人資管理',
    category: '管理',
    routes: ['/hr'],
    description: '員工和人事管理'
  },
  {
    id: 'database',
    label: '資料管理',
    category: '管理',
    routes: ['/database'],
    description: '系統資料庫管理'
  },
  {
    id: 'settings',
    label: '系統設定',
    category: '管理',
    routes: ['/settings'],
    description: '系統設定和配置'
  },
  {
    id: 'reports',
    label: '報表管理',
    category: '管理',
    routes: ['/reports'],
    description: '各類報表查看'
  },
];

/**
 * 根據路由路徑獲取所需權限
 */
export function getRequiredPermissions(pathname: string): string[] {
  const requiredPermissions: string[] = [];

  for (const permission of FEATURE_PERMISSIONS) {
    // 超級管理員有所有權限
    if (permission.id === 'super_admin') continue;

    // 檢查路由是否匹配
    const hasAccess = permission.routes.some(route => {
      if (route === '*') return true;
      return pathname.startsWith(route);
    });

    if (hasAccess) {
      requiredPermissions.push(permission.id);
    }
  }

  return requiredPermissions;
}

/**
 * 檢查用戶是否有權限訪問指定路由
 */
export function hasPermissionForRoute(userPermissions: string[], pathname: string): boolean {
  // 超級管理員有所有權限
  if (userPermissions.includes('super_admin')) {
    return true;
  }

  // 公開路由不需要權限
  const publicRoutes = ['/', '/login', '/404'];
  if (publicRoutes.includes(pathname)) {
    return true;
  }

  // 獲取所需權限
  const requiredPermissions = getRequiredPermissions(pathname);

  // 檢查用戶是否有任一所需權限
  return requiredPermissions.length === 0 ||
         requiredPermissions.some(permission => userPermissions.includes(permission));
}

/**
 * 為向後兼容保留的權限清單
 * 從 FEATURE_PERMISSIONS 自動生成
 */
export const SYSTEM_PERMISSIONS = FEATURE_PERMISSIONS.map(permission => ({
  id: permission.id,
  label: permission.label,
  category: permission.category,
}));

/**
 * 獲取所有權限類別
 */
export function getPermissionCategories(): string[] {
  const categories = FEATURE_PERMISSIONS.map(p => p.category);
  return [...new Set(categories)];
}

/**
 * 根據類別獲取權限
 */
export function getPermissionsByCategory(category: string): PermissionConfig[] {
  return FEATURE_PERMISSIONS.filter(p => p.category === category);
}