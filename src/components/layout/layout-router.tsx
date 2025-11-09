'use client'

import { usePathname } from 'next/navigation'
import { MainLayout } from './main-layout'

/**
 * Layout Router - 根據路徑決定使用哪個 Layout
 *
 * /fitness -> 無側邊欄（獨立健身 App）
 * 其他路徑 -> MainLayout（主系統側邊欄）
 */
export function LayoutRouter({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // 健身 App 路徑：不使用側邊欄
  const isFitnessApp = pathname?.startsWith('/fitness')

  if (isFitnessApp) {
    // 返回純淨的內容，無側邊欄
    return <>{children}</>
  }

  // 主系統：使用 MainLayout（包含側邊欄）
  return <MainLayout>{children}</MainLayout>
}
