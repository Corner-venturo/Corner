/**
 * 工作空間標題列
 */

import { Filter, Settings, Plus, RefreshCw, Search, X } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { COMP_WORKSPACE_LABELS } from '../constants/labels'

interface WorkspaceHeaderProps {
  workspaceName: string
  workspaceIcon: string
  channelFilter: string
  onFilterChange: (filter: 'all' | 'starred' | 'unread' | 'muted') => void
  onCreateChannel: () => void
  onCreateGroup: () => void
  onRefresh?: () => void
  isRefreshing?: boolean
  searchQuery: string
  onSearchChange: (query: string) => void
}

export function WorkspaceHeader({
  workspaceName,
  workspaceIcon,
  channelFilter,
  onFilterChange,
  onCreateChannel,
  onCreateGroup,
  onRefresh,
  isRefreshing = false,
  searchQuery,
  onSearchChange,
}: WorkspaceHeaderProps) {
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // 當搜尋框展開時自動聚焦
  useEffect(() => {
    if (isSearchExpanded && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isSearchExpanded])

  // 當有搜尋內容時保持展開
  useEffect(() => {
    if (searchQuery && !isSearchExpanded) {
      setIsSearchExpanded(true)
    }
  }, [searchQuery])

  const handleSearchToggle = () => {
    if (isSearchExpanded && !searchQuery) {
      setIsSearchExpanded(false)
    } else {
      setIsSearchExpanded(true)
    }
  }

  const handleClearSearch = () => {
    onSearchChange('')
    setIsSearchExpanded(false)
  }

  return (
    <div className="h-[56px] px-6 border-b border-border bg-gradient-to-r from-morandi-gold/5 to-transparent flex items-center">
      <div className="flex items-center justify-between w-full">
        <h2 className="font-semibold text-morandi-primary truncate flex-1 min-w-0">
          {workspaceIcon} {workspaceName || COMP_WORKSPACE_LABELS.工作空間}
        </h2>
        <div className="flex items-center gap-1">
          {/* 搜尋按鈕/輸入框 */}
          <div className="relative flex items-center">
            {isSearchExpanded ? (
              <div className="flex items-center bg-card border border-border rounded-md overflow-hidden">
                <Search size={14} className="ml-2 text-morandi-secondary" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={COMP_WORKSPACE_LABELS.搜尋}
                  value={searchQuery}
                  onChange={e => onSearchChange(e.target.value)}
                  className="w-24 h-7 px-2 text-xs border-none focus:outline-none focus:ring-0"
                  onBlur={() => {
                    if (!searchQuery) {
                      setIsSearchExpanded(false)
                    }
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={handleClearSearch}
                    className="mr-1 p-0.5 hover:bg-morandi-container rounded"
                  >
                    <X size={12} className="text-morandi-secondary" />
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={handleSearchToggle}
                className="btn-icon-morandi !w-7 !h-7"
                title={COMP_WORKSPACE_LABELS.搜尋頻道}
              >
                <Search size={14} />
              </button>
            )}
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="btn-icon-morandi !w-7 !h-7"
              title={COMP_WORKSPACE_LABELS.重新整理頻道列表}
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            </button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger className="btn-icon-morandi !w-7 !h-7">
              <Filter size={14} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => onFilterChange('all')}
                className="dropdown-item-morandi"
              >
                全部頻道
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onFilterChange('starred')}
                className="dropdown-item-morandi"
              >
                已加星號
              </DropdownMenuItem>
              {/* TODO: 實現 unread/muted 功能後再開放
              <DropdownMenuItem
                onClick={() => onFilterChange('unread')}
                className="dropdown-item-morandi"
              >
                未讀訊息
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onFilterChange('muted')}
                className="dropdown-item-morandi"
              >
                已靜音
              </DropdownMenuItem>
              */}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger className="btn-icon-morandi !w-7 !h-7">
              <Settings size={14} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[140px]">
              <DropdownMenuItem onClick={onCreateChannel} className="dropdown-item-morandi">
                <Plus size={14} className="mr-2" />
                建立頻道
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onCreateGroup} className="dropdown-item-morandi">
                <Plus size={14} className="mr-2" />
                建立群組
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
