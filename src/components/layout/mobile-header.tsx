'use client'

import { Menu } from 'lucide-react'
import { usePathname } from 'next/navigation'

// 頁面標題映射
const PAGE_TITLES: Record<string, string> = {
  '/': '首頁',
  '/calendar': '行事曆',
  '/workspace': '工作空間',
  '/todos': '待辦事項',
  '/itinerary': '行程管理',
  '/tours': '旅遊團',
  '/orders': '訂單',
  '/quotes': '報價單',
  '/contracts': '合約',
  '/customers': '客戶',
  '/finance': '財務系統',
  '/finance/payments': '請款管理',
  '/finance/cashier': '出納管理',
  '/finance/vouchers': '會計傳票',
  '/finance/travel-invoices': '代轉發票',
  '/settings': '設定',
  '/destinations': '地區管理',
  '/attractions': '景點管理',
  '/suppliers': '供應商',
  '/visas': '簽證管理',
  '/confirmations': '確認單',
  '/image-library': '圖庫',
}

interface MobileHeaderProps {
  onMenuClick: () => void
}

export function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  const pathname = usePathname()

  // 取得當前頁面標題
  const getPageTitle = () => {
    // 精確匹配
    if (PAGE_TITLES[pathname]) {
      return PAGE_TITLES[pathname]
    }
    // 前綴匹配（處理動態路由如 /orders/123）
    const matchedPath = Object.keys(PAGE_TITLES).find(
      path => path !== '/' && pathname.startsWith(path)
    )
    return matchedPath ? PAGE_TITLES[matchedPath] : 'Venturo'
  }

  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-card border-b border-border z-40 flex items-center px-4 print:hidden">
      {/* 漢堡按鈕 */}
      <button
        onClick={onMenuClick}
        className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-muted active:bg-morandi-container transition-colors -ml-2"
        aria-label="開啟選單"
      >
        <Menu className="w-6 h-6 text-morandi-primary" />
      </button>

      {/* 頁面標題 */}
      <h1 className="ml-2 text-lg font-semibold text-foreground truncate">
        {getPageTitle()}
      </h1>
    </header>
  )
}
