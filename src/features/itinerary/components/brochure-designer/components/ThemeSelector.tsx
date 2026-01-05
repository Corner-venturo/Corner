'use client'

/**
 * ThemeSelector
 * 主題選擇器 UI 組件
 *
 * 功能：
 * 1. 顯示所有可用主題
 * 2. 預覽主題顏色和風格
 * 3. 支援主題切換
 * 4. 顯示當前選中的主題
 */

import React, { useState } from 'react'
import { Check, Palette, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { themeRegistry, type ThemeMeta } from '../schema/themes'
import { useBrochureSchema } from '../stores/useBrochureSchema'

// ============================================================================
// 類型定義
// ============================================================================

export interface ThemeSelectorProps {
  /** 是否禁用 */
  disabled?: boolean
  /** 額外的 className */
  className?: string
  /** 選擇主題後的回調 */
  onThemeChange?: (themeId: string) => void
}

// ============================================================================
// 主題卡片組件
// ============================================================================

interface ThemeCardProps {
  theme: ThemeMeta
  isActive: boolean
  onSelect: () => void
}

const ThemeCard: React.FC<ThemeCardProps> = ({ theme, isActive, onSelect }) => {
  return (
    <button
      onClick={onSelect}
      className={cn(
        'relative w-full p-3 rounded-lg border-2 transition-all duration-200',
        'hover:border-morandi-gold/50 hover:shadow-md',
        'focus:outline-none focus:ring-2 focus:ring-morandi-gold/20',
        isActive
          ? 'border-morandi-gold bg-morandi-gold/5'
          : 'border-border bg-card'
      )}
    >
      {/* 顏色預覽 */}
      <div className="flex gap-1.5 mb-2">
        <div
          className="w-6 h-6 rounded-full shadow-sm"
          style={{ backgroundColor: theme.colors.primary }}
          title="主色"
        />
        <div
          className="w-6 h-6 rounded-full shadow-sm"
          style={{ backgroundColor: theme.colors.accent }}
          title="強調色"
        />
        <div
          className="w-6 h-6 rounded-full shadow-sm border border-border"
          style={{ backgroundColor: theme.colors.background }}
          title="背景色"
        />
      </div>

      {/* 主題資訊 */}
      <div className="text-left">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-morandi-primary">
            {theme.name}
          </span>
          {isActive && (
            <span className="flex items-center gap-0.5 text-xs text-morandi-gold">
              <Check size={12} />
              使用中
            </span>
          )}
        </div>
        <p className="text-xs text-morandi-secondary mt-0.5 line-clamp-1">
          {theme.description}
        </p>
      </div>

      {/* 標籤 */}
      {theme.tags && theme.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {theme.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-1.5 py-0.5 text-[10px] rounded bg-morandi-container text-morandi-secondary"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </button>
  )
}

// ============================================================================
// 主組件
// ============================================================================

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  disabled = false,
  className,
  onThemeChange,
}) => {
  const [open, setOpen] = useState(false)
  const { schema, applyTheme, getCurrentTheme } = useBrochureSchema()

  const themes = themeRegistry.getAllThemeMetas()
  const currentTheme = getCurrentTheme()
  const currentThemeId = schema?.settings.themeId || 'classic'

  const handleThemeSelect = (themeId: string) => {
    if (themeId === currentThemeId) {
      setOpen(false)
      return
    }

    applyTheme(themeId, {
      preserveOverrides: true,
      preserveDataSnapshots: true,
    })

    onThemeChange?.(themeId)
    setOpen(false)
  }

  // 找到當前主題的元資料
  const currentThemeMeta = themes.find((t) => t.id === currentThemeId)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || !schema}
          className={cn(
            'gap-2 min-w-[140px] justify-between',
            className
          )}
        >
          <div className="flex items-center gap-2">
            <Palette size={16} className="text-morandi-secondary" />
            <span className="text-sm">
              {currentThemeMeta?.name || '選擇主題'}
            </span>
          </div>
          <ChevronDown size={14} className="text-morandi-muted" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-72 p-3"
        align="start"
        sideOffset={8}
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <Palette size={16} className="text-morandi-gold" />
            <span className="font-medium text-sm text-morandi-primary">
              選擇主題風格
            </span>
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {themes.map((theme) => (
              <ThemeCard
                key={theme.id}
                theme={theme}
                isActive={theme.id === currentThemeId}
                onSelect={() => handleThemeSelect(theme.id)}
              />
            ))}
          </div>

          <div className="pt-2 border-t border-border">
            <p className="text-[10px] text-morandi-muted text-center">
              切換主題會重新生成所有頁面，已編輯的內容會保留
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

// ============================================================================
// 匯出
// ============================================================================

export default ThemeSelector
