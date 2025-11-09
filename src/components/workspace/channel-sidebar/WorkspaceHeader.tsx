/**
 * 工作空間標題列
 */

import { Filter, Settings, Plus, RefreshCw } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface WorkspaceHeaderProps {
  workspaceName: string
  workspaceIcon: string
  channelFilter: string
  onFilterChange: (filter: 'all' | 'starred' | 'unread' | 'muted') => void
  onCreateChannel: () => void
  onCreateGroup: () => void
  onRefresh?: () => void
  isRefreshing?: boolean
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
}: WorkspaceHeaderProps) {
  return (
    <div className="h-[52px] px-6 border-b border-morandi-gold/20 bg-gradient-to-r from-morandi-gold/5 to-transparent flex items-center">
      <div className="flex items-center justify-between w-full">
        <h2 className="font-semibold text-morandi-primary truncate flex-1">
          {workspaceIcon} {workspaceName || '工作空間'}
        </h2>
        <div className="flex items-center gap-1">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="btn-icon-morandi !w-7 !h-7"
              title="重新整理頻道列表"
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
