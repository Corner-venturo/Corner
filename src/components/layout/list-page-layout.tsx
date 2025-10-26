'use client';

import React, { useState, useMemo } from 'react';
import { ResponsiveHeader } from './responsive-header';
import { EnhancedTable, TableColumn } from '../ui/enhanced-table';
import { useDataFiltering } from '@/hooks';
import type { LucideIcon } from 'lucide-react';

/**
 * 麵包屑項目
 */
export interface BreadcrumbItem {
  label: string;
  href?: string;
}

/**
 * Tab 項目
 */
export interface TabItem {
  value: string;
  label: string;
  icon?: LucideIcon;
}

/**
 * ListPageLayout 屬性
 */
export interface ListPageLayoutProps<T extends Record<string, any>> {
  // ========== 頁面配置 ==========
  /** 頁面標題 */
  title: string;
  /** 頁面圖示 */
  icon?: LucideIcon;
  /** 麵包屑導航 */
  breadcrumb?: BreadcrumbItem[];

  // ========== 數據管理 ==========
  /** 數據陣列 */
  data: T[];
  /** 載入狀態 */
  loading?: boolean;

  // ========== 表格配置 ==========
  /** 表格列定義 */
  columns: TableColumn[];
  /** 行點擊事件 */
  onRowClick?: (item: T) => void;
  /** 操作按鈕渲染函數 */
  renderActions?: (item: T) => React.ReactNode;
  /** 展開行渲染函數 */
  renderExpanded?: (item: T) => React.ReactNode;
  /** 表格邊框 */
  bordered?: boolean;

  // ========== 搜尋與過濾 ==========
  /** 是否顯示搜尋框 */
  searchable?: boolean;
  /** 搜尋框佔位符 */
  searchPlaceholder?: string;
  /** 搜尋欄位（用於過濾） */
  searchFields?: (keyof T)[];

  /** 狀態 Tab 配置 */
  statusTabs?: TabItem[];
  /** 狀態欄位名稱 */
  statusField?: keyof T;
  /** 預設狀態 Tab */
  defaultStatusTab?: string;

  // ========== 新增操作 ==========
  /** 新增按鈕點擊事件 */
  onAdd?: () => void;
  /** 新增按鈕文字 */
  addLabel?: string;
  /** 新增按鈕是否禁用 */
  addDisabled?: boolean;

  // ========== 自訂擴展 ==========
  /** Header 右側自訂操作 */
  headerActions?: React.ReactNode;
  /** 表格前的自訂內容 */
  beforeTable?: React.ReactNode;
  /** 表格後的自訂內容 */
  afterTable?: React.ReactNode;

  // ========== 展開控制 ==========
  /** 外部控制的展開行 */
  expandedRows?: Set<string>;
  /** 展開/收合切換事件 */
  onToggleExpand?: (id: string) => void;

  // ========== 排序控制 ==========
  /** 排序變更事件 */
  onSort?: (field: string, order: 'asc' | 'desc') => void;

  // ========== 樣式 ==========
  /** 容器 className */
  className?: string;
}

/**
 * ListPageLayout - 統一的列表頁面佈局組件
 *
 * 提供標準化的列表頁面結構，包含：
 * - ResponsiveHeader（標題、搜尋、Tab、新增按鈕）
 * - EnhancedTable（表格、排序、過濾、展開）
 * - 統一的狀態管理（搜尋、過濾）
 *
 * @example
 * ```tsx
 * <ListPageLayout
 *   title="旅遊團管理"
 *   icon={MapPin}
 *   data={tours}
 *   columns={columns}
 *   searchFields={['name', 'code', 'location']}
 *   statusField="status"
 *   statusTabs={[
 *     { value: 'all', label: '全部' },
 *     { value: 'active', label: '進行中' },
 *   ]}
 *   onAdd={() => openDialog('create')}
 *   addLabel="新增旅遊團"
 * />
 * ```
 */
export function ListPageLayout<T extends Record<string, any>>({
  title,
  icon,
  breadcrumb,
  data = [],
  loading = false,
  columns,
  onRowClick,
  renderActions,
  renderExpanded,
  bordered = true,
  searchable = true,
  searchPlaceholder = '搜尋...',
  searchFields = [],
  statusTabs,
  statusField,
  defaultStatusTab = 'all',
  onAdd,
  addLabel = '新增',
  addDisabled = false,
  headerActions,
  beforeTable,
  afterTable,
  expandedRows,
  onToggleExpand,
  onSort,
  className,
}: ListPageLayoutProps<T>) {
  // ========== 內部狀態管理 ==========
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStatusTab, setActiveStatusTab] = useState(defaultStatusTab);

  // ========== 數據過濾 ==========
  const filteredData = useDataFiltering(data, activeStatusTab, searchQuery, {
    statusField,
    searchFields,
  });

  // ========== 處理 Tab 切換 ==========
  const handleTabChange = (tab: string) => {
    setActiveStatusTab(tab);
  };

  return (
    <div className={className || 'h-full flex flex-col'}>
      {/* Header 區域 */}
      <ResponsiveHeader
        title={title}
        icon={icon}
        breadcrumb={breadcrumb}
        showSearch={searchable}
        searchTerm={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={searchPlaceholder}
        tabs={statusTabs}
        activeTab={activeStatusTab}
        onTabChange={handleTabChange}
        onAdd={onAdd}
        addLabel={addLabel}
        actions={headerActions}
      />

      {/* 表格前自訂內容 */}
      {beforeTable}

      {/* 表格區域 */}
      <div className="flex-1 overflow-auto">
        <EnhancedTable
          className="min-h-full"
          columns={columns}
          data={filteredData}
          loading={loading}
          onRowClick={onRowClick}
          actions={renderActions}
          expandable={
            renderExpanded
              ? {
                  expanded: expandedRows,
                  onExpand: onToggleExpand,
                  renderExpanded,
                }
              : undefined
          }
          onSort={onSort}
          bordered={bordered}
        />
      </div>

      {/* 表格後自訂內容 */}
      {afterTable}
    </div>
  );
}
