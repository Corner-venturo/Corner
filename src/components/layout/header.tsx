'use client'

import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { _TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

interface HeaderProps {
  title: string
  tabs?: {
    value: string
    label: string
  }[]
  activeTab?: string
  onTabChange?: (value: string) => void
  onAdd?: () => void
  addLabel?: string
  children?: React.ReactNode
}

export function Header({
  title,
  tabs,
  activeTab,
  onTabChange,
  onAdd,
  addLabel = '新增',
  children,
}: HeaderProps) {
  return (
    <div className="fixed top-0 right-0 left-64 h-[72px] bg-background border-b border-border z-40 flex items-center px-6 transition-all duration-300">
      {/* 最左側 - 返回按鈕 */}
      {children && <div className="flex items-center mr-4">{children}</div>}

      {/* 左側 - 主標題 */}
      <h1 className="text-lg font-bold text-morandi-primary">{title}</h1>

      {/* 中間 - 空白區域，用於推開左右兩側 */}
      <div className="flex-1"></div>

      {/* 右側 - 標籤頁 */}
      {tabs && tabs.length > 0 && (
        <div className="flex items-center">
          <div className="h-6 w-px bg-border mx-4"></div>
          <div className="flex items-center space-x-1">
            {tabs.map(tab => (
              <button
                key={tab.value}
                onClick={() => onTabChange?.(tab.value)}
                className={cn(
                  'relative px-3 py-2 text-sm font-medium transition-colors',
                  'text-morandi-secondary hover:text-morandi-primary',
                  activeTab === tab.value
                    ? 'text-morandi-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-morandi-gold'
                    : ''
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 最右側 - 操作按鈕 */}
      <div className="flex items-center">
        {onAdd && (
          <>
            <div className="h-6 w-px bg-border mx-4"></div>
            <Button
              onClick={onAdd}
              className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
            >
              <Plus size={16} className="mr-2" />
              {addLabel}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
