'use client'

import { useState, memo } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'

interface ResponsiveHeaderProps {
  title: string
  icon?: unknown
  breadcrumb?: { label: string; href: string }[]
  tabs?: {
    value: string
    label: string
    icon?: unknown
  }[]
  activeTab?: string
  onTabChange?: (value: string) => void
  onAdd?: () => void
  addLabel?: string
  children?: React.ReactNode
  actions?: React.ReactNode
  showBackButton?: boolean
  onBack?: () => void
  // 搜尋功能
  showSearch?: boolean
  searchTerm?: string
  onSearchChange?: (term: string) => void
  searchPlaceholder?: string
  // 徽章（用於標記功能狀態）
  badge?: React.ReactNode
  // 篩選功能（例如：作者篩選）
  showFilter?: boolean
  filterOptions?: { value: string; label: string }[]
  filterValue?: string
  onFilterChange?: (value: string) => void
  filterLabel?: string
  // 多個篩選器支援
  filters?: React.ReactNode
  // 清除篩選按鈕
  showClearFilters?: boolean
  onClearFilters?: () => void
  // 自訂操作按鈕（顯示在 tabs 右邊）
  customActions?: React.ReactNode
}

export const ResponsiveHeader = memo(function ResponsiveHeader(props: ResponsiveHeaderProps) {
  const { sidebarCollapsed } = useAuthStore()
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  return (
    <div
      className={cn(
        'fixed top-0 right-0 h-[72px] bg-background z-[200] flex items-center justify-between px-6',
        'left-0 md:left-16'
      )}
    >
      {/* 分割線 */}
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        style={{
          marginLeft: '24px',
          marginRight: '24px',
          borderTop: '1px solid var(--border)',
          height: '1px',
        }}
      ></div>
      {/* 左側 - 返回按鈕和主標題 */}
      <div className="flex items-center gap-3 relative z-[300]">
        {props.showBackButton && (
          <button
            onClick={e => {
              e.preventDefault()
              e.stopPropagation()
              props.onBack?.()
            }}
            className="text-morandi-secondary hover:text-morandi-primary transition-colors p-2 hover:bg-morandi-container/50 rounded-md cursor-pointer"
            type="button"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        )}
        <h1 className="text-base font-bold text-morandi-primary flex items-center">
          {props.title}
          {props.badge}
        </h1>
      </div>

      {/* 右側區域 - 功能、標籤頁和操作按鈕 - 統一無空白設計 */}
      <div className="flex items-center flex-shrink-0 pointer-events-auto gap-2">
        {/* 搜尋功能 - 最左邊 - 手機模式隱藏 */}
        {props.showSearch && (
          <div className="flex items-center mr-4">
            {!isSearchOpen ? (
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 text-morandi-secondary hover:text-morandi-primary transition-colors"
                title="搜尋"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={props.searchTerm || ''}
                  onChange={e => props.onSearchChange?.(e.target.value)}
                  placeholder={props.searchPlaceholder || '搜尋...'}
                  className="w-48 px-3 py-1 text-sm border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-morandi-primary"
                  autoFocus
                  onBlur={() => {
                    if (!props.searchTerm) {
                      setIsSearchOpen(false)
                    }
                  }}
                />
                <button
                  onClick={() => {
                    props.onSearchChange?.('')
                    setIsSearchOpen(false)
                  }}
                  className="p-1 text-morandi-secondary hover:text-morandi-primary transition-colors"
                  title="清除搜尋"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}

        {/* 篩選功能 */}
        {props.showFilter && props.filterOptions && (
          <div className="flex items-center mr-4">
            <select
              value={props.filterValue || 'all'}
              onChange={e => props.onFilterChange?.(e.target.value)}
              className="px-3 py-1 text-sm border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-morandi-primary bg-background text-morandi-primary"
            >
              <option value="all">全部{props.filterLabel || '篩選'}</option>
              {props.filterOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 多個篩選器 */}
        {props.filters && <div className="flex items-center gap-2 mr-4">{props.filters}</div>}

        {/* 清除篩選按鈕 */}
        {props.showClearFilters && (
          <button
            onClick={props.onClearFilters}
            className="px-3 py-1 text-sm text-morandi-secondary hover:text-morandi-primary border border-border rounded-md hover:bg-morandi-container/50 transition-colors mr-4"
          >
            清除篩選
          </button>
        )}

        {/* 功能區域 */}
        {props.children && <div className="flex items-center mr-6">{props.children}</div>}

        {/* 標籤頁 - 手機模式隱藏 */}
        {props.tabs && props.tabs.length > 0 && (
          <div className="hidden md:flex items-center space-x-1 pointer-events-auto mr-4">
            {props.tabs.map(tab => (
              <button
                key={tab.value}
                onClick={() => props.onTabChange?.(tab.value)}
                className={cn(
                  'relative px-3 py-2 text-sm font-medium transition-colors pointer-events-auto',
                  'text-morandi-secondary hover:text-morandi-primary',
                  props.activeTab === tab.value
                    ? 'text-morandi-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-morandi-gold'
                    : ''
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* 自訂操作按鈕 */}
        {props.customActions && (
          <div className="flex items-center mr-4">{props.customActions}</div>
        )}

        {/* 操作按鈕 */}
        {props.actions ? (
          <div className="flex items-center gap-3">{props.actions}</div>
        ) : props.onAdd ? (
          <button
            onClick={props.onAdd}
            data-create-box
            className="bg-morandi-gold hover:bg-morandi-gold-hover text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            {props.addLabel || '新增'}
          </button>
        ) : null}
      </div>
    </div>
  )
})
