'use client'

import React, { ReactNode } from 'react'
import { ResponsiveHeader } from './responsive-header'
import type { LucideIcon } from 'lucide-react'

/**
 * 麵包屑項目
 */
export interface BreadcrumbItem {
  label: string
  href?: string
}

/**
 * Tab 項目
 */
export interface TabItem {
  value: string
  label: string
  icon?: LucideIcon
}

/**
 * StandardPageLayout 屬性
 *
 * 統一的頁面佈局組件，確保所有頁面都遵循相同的結構規範
 */
export interface StandardPageLayoutProps {
  // ========== 頁面配置 ==========
  /** 頁面標題 */
  title: string
  /** 頁面圖示 */
  icon?: LucideIcon
  /** 麵包屑導航 */
  breadcrumb?: BreadcrumbItem[]

  // ========== Header 配置 ==========
  /** 是否顯示搜尋框 */
  showSearch?: boolean
  /** 搜尋文字 */
  searchTerm?: string
  /** 搜尋變更回調 */
  onSearchChange?: (value: string) => void
  /** 搜尋框佔位符 */
  searchPlaceholder?: string

  /** 狀態 Tab 配置 */
  tabs?: TabItem[]
  /** 當前啟用的 Tab */
  activeTab?: string
  /** Tab 變更回調 */
  onTabChange?: (tab: string) => void

  /** Header 右側自訂操作按鈕 */
  actions?: ReactNode
  /** 新增按鈕點擊事件 */
  onAdd?: () => void
  /** 新增按鈕文字 */
  addLabel?: string

  /** Header 下方的自訂內容（週選擇器、過濾器等） */
  headerChildren?: ReactNode

  // ========== 內容配置 ==========
  /** 主要內容 */
  children: ReactNode

  /**
   * 內容區域的 overflow 行為
   * - 'auto': 內容可滾動（適用於列表、表格等）
   * - 'hidden': 內容不滾動，由子組件自行處理（適用於工作空間、時間箱等）
   */
  contentOverflow?: 'auto' | 'hidden'

  /**
   * 內容區域是否需要 padding
   * - true: 有 padding（預設，適用於一般頁面）
   * - false: 無 padding（適用於需要完全填滿的頁面，如工作空間）
   */
  contentPadding?: boolean

  /** 自訂外層 className */
  className?: string
}

/**
 * StandardPageLayout - 標準頁面佈局組件
 *
 * 統一的頁面結構，確保所有頁面都遵循相同的佈局規範：
 * 1. 外層 h-full flex flex-col
 * 2. ResponsiveHeader 固定在上方
 * 3. flex-1 的內容區域自動填滿剩餘空間
 *
 * @example
 * // 基本用法（列表頁）
 * <StandardPageLayout
 *   title="旅遊團管理"
 *   icon={MapPin}
 *   breadcrumb={[...]}
 *   showSearch
 *   searchTerm={search}
 *   onSearchChange={setSearch}
 * >
 *   <EnhancedTable {...} />
 * </StandardPageLayout>
 *
 * @example
 * // 自訂佈局（工作空間）
 * <StandardPageLayout
 *   title="工作空間"
 *   contentOverflow="hidden"
 *   contentPadding={false}
 * >
 *   <ChannelChat />
 * </StandardPageLayout>
 */
export function StandardPageLayout({
  title,
  icon,
  breadcrumb,
  showSearch = false,
  searchTerm,
  onSearchChange,
  searchPlaceholder,
  tabs,
  activeTab,
  onTabChange,
  actions,
  onAdd,
  addLabel,
  headerChildren,
  children,
  contentOverflow = 'auto',
  contentPadding = true,
  className,
}: StandardPageLayoutProps) {
  return (
    <div className={className || 'h-full flex flex-col'}>
      {/* Header 區域 */}
      <ResponsiveHeader
        title={title}
        icon={icon}
        breadcrumb={breadcrumb as any}
        showSearch={showSearch}
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
        searchPlaceholder={searchPlaceholder}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={onTabChange}
        onAdd={onAdd}
        addLabel={addLabel}
        actions={actions}
      >
        {headerChildren}
      </ResponsiveHeader>

      {/* 內容區域 */}
      <div
        className={`flex-1 flex flex-col ${contentOverflow === 'hidden' ? 'overflow-hidden' : 'overflow-auto'} ${contentPadding ? 'p-4' : ''}`}
      >
        {children}
      </div>
    </div>
  )
}
