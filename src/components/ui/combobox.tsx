'use client'

import * as React from 'react'
import { ChevronDown, X, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

/**
 * 通用的 Combobox 選項類型
 * @template T - 可選的額外資料類型
 */
export interface ComboboxOption<T = unknown> {
  /** 選項的唯一識別值 */
  value: string
  /** 顯示的標籤文字 */
  label: string
  /** 可選的額外資料，用於傳遞更多資訊 */
  data?: T
  /** 是否禁用此選項 */
  disabled?: boolean
}

/**
 * Combobox 組件的屬性
 * @template T - 選項額外資料的類型
 */
export interface ComboboxProps<T = unknown> {
  /** 當前選中的值 */
  value: string
  /** 值改變時的回調函數 */
  onChange: (value: string) => void
  /** 選項被選中時的回調函數，可獲取完整的選項物件 */
  onSelect?: (option: ComboboxOption<T>) => void
  /** 可選項列表 */
  options: ComboboxOption<T>[]
  /** 輸入框佔位符 */
  placeholder?: string
  /** 自定義樣式類名 */
  className?: string
  /** 無搜尋結果時顯示的訊息 */
  emptyMessage?: string
  /** 是否顯示搜尋圖示 */
  showSearchIcon?: boolean
  /** 是否顯示清除按鈕 */
  showClearButton?: boolean
  /** 是否禁用整個組件 */
  disabled?: boolean
  /** 自定義選項渲染函數 */
  renderOption?: (option: ComboboxOption<T>) => React.ReactNode
  /** 下拉選單最大高度 */
  maxHeight?: string
}

/**
 * 可搜尋的下拉選單組件（Combobox/Autocomplete）
 *
 * 功能特點：
 * - 支援輸入搜尋/篩選選項
 * - 鍵盤導航（上下方向鍵、Enter、Escape）
 * - 清除按鈕
 * - 無結果提示
 * - 靈活的資料類型支援
 * - 莫蘭迪配色風格
 *
 * @example
 * ```tsx
 * const options = [
 *   { value: '1', label: '台北' },
 *   { value: '2', label: '台中' },
 *   { value: '3', label: '高雄' }
 * ];
 *
 * <Combobox
 *   value={selectedCity}
 *   onChange={setSelectedCity}
 *   options={options}
 *   placeholder="選擇城市"
 *   showClearButton
 * />
 * ```
 */
export function Combobox<T = unknown>({
  value,
  onChange,
  onSelect,
  options,
  placeholder = '輸入或選擇項目',
  className,
  emptyMessage = '無符合的選項',
  showSearchIcon = true,
  showClearButton = true,
  disabled = false,
  renderOption,
  maxHeight = '16rem',
}: ComboboxProps<T>) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState('')
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const dropdownRef = React.useRef<HTMLDivElement>(null)
  const optionRefs = React.useRef<(HTMLButtonElement | null)[]>([])

  // 當 value 改變時，更新搜尋值為對應的 label
  // 只依賴 value，避免 options 引用變化導致無限循環
  React.useEffect(() => {
    const selectedOption = options.find(opt => opt.value === value)
    const newLabel = selectedOption?.label || ''
    // 只在 label 真的改變時才更新，避免不必要的 re-render
    setSearchValue(prev => (prev !== newLabel ? newLabel : prev))
  }, [value]) // 移除 options 依賴

  // 篩選選項
  const filteredOptions = React.useMemo(() => {
    return options.filter(option => option.label?.toLowerCase().includes(searchValue.toLowerCase()))
  }, [options, searchValue])

  // 處理輸入變化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setSearchValue(newValue)

    // 只有在真正輸入內容時才打開下拉選單
    if (!isOpen) {
      setIsOpen(true)
    }

    setHighlightedIndex(-1)

    // 如果輸入為空，清除選擇
    if (!newValue) {
      onChange('')
    }
  }

  // 處理輸入框點擊（打開下拉選單）
  const handleInputClick = () => {
    if (!disabled && !isOpen) {
      setIsOpen(true)
    }
  }

  // 處理選項選擇
  const handleOptionSelect = (option: ComboboxOption<T>) => {
    if (option.disabled) return

    setSearchValue(option.label)
    onChange(option.value)
    onSelect?.(option)
    setIsOpen(false)
    setHighlightedIndex(-1)
  }

  // 清除選擇
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    setSearchValue('')
    onChange('')
    setIsOpen(false)
    inputRef.current?.focus()
  }

  // 切換下拉選單
  const handleToggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!disabled) {
      setIsOpen(!isOpen)
      if (!isOpen) {
        inputRef.current?.focus()
      }
    }
  }

  // 鍵盤導航
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true)
        setHighlightedIndex(0)
        e.preventDefault()
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : prev))
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : 0))
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          handleOptionSelect(filteredOptions[highlightedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        setHighlightedIndex(-1)
        inputRef.current?.blur()
        break
      case 'Tab':
        setIsOpen(false)
        break
    }
  }

  // 滾動到高亮的選項
  React.useEffect(() => {
    if (highlightedIndex >= 0 && optionRefs.current[highlightedIndex]) {
      optionRefs.current[highlightedIndex]?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      })
    }
  }, [highlightedIndex])

  // 點擊外部關閉下拉選單
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 預設選項渲染
  const defaultRenderOption = (option: ComboboxOption<T>) => (
    <span className="text-morandi-primary">{option.label}</span>
  )

  return (
    <div className={cn('relative', className)}>
      {/* 輸入框 */}
      <div className="relative">
        {showSearchIcon && (
          <Search
            size={16}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-morandi-secondary pointer-events-none"
          />
        )}
        <Input
          ref={inputRef}
          type="text"
          value={searchValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onClick={handleInputClick}
          placeholder={placeholder}
          disabled={disabled}
          className={cn('pr-8', showSearchIcon && 'pl-10')}
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {showClearButton && searchValue && !disabled && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-6 w-6 p-0 hover:bg-morandi-container/50"
            >
              <X size={14} className="text-morandi-secondary" />
            </Button>
          )}
          <button
            type="button"
            onClick={handleToggleDropdown}
            className="h-6 w-6 flex items-center justify-center hover:bg-morandi-container/50 rounded transition-colors"
            disabled={disabled}
          >
            <ChevronDown
              size={16}
              className={cn(
                'text-morandi-secondary transition-transform',
                isOpen && 'transform rotate-180'
              )}
            />
          </button>
        </div>
      </div>

      {/* 下拉選單 */}
      {isOpen && !disabled && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 z-[100] mt-1 bg-card border border-border rounded-lg shadow-lg overflow-hidden"
          style={{ maxHeight }}
        >
          <div className="overflow-y-auto" style={{ maxHeight }}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <button
                  key={option.value}
                  ref={el => {
                    optionRefs.current[index] = el
                  }}
                  onClick={() => handleOptionSelect(option)}
                  disabled={option.disabled}
                  className={cn(
                    'w-full px-3 py-2 text-left text-sm transition-colors',
                    'hover:bg-morandi-container/30 focus:bg-morandi-container/30 focus:outline-none',
                    highlightedIndex === index && 'bg-morandi-container/50',
                    option.value === value && 'bg-morandi-gold/10 font-medium',
                    option.disabled && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {renderOption ? renderOption(option) : defaultRenderOption(option)}
                </button>
              ))
            ) : (
              <div className="px-3 py-6 text-center text-sm text-morandi-secondary">
                {emptyMessage}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// 保留舊版相容性的類型定義
export interface LegacyComboboxOption {
  id: string
  name: string
  price_per_person?: number
  pricePerGroup?: number
  isGroupCost?: boolean
}

export interface LegacyComboboxProps {
  value: string
  onChange: (value: string) => void
  onSelect?: (option: LegacyComboboxOption) => void
  options: LegacyComboboxOption[]
  placeholder?: string
  className?: string
}

/**
 * 舊版 Combobox（用於向後相容）
 * @deprecated 請使用新版 Combobox 組件
 */
export function LegacyCombobox({
  value,
  onChange,
  onSelect,
  options,
  placeholder = '輸入或選擇項目',
  className,
}: LegacyComboboxProps) {
  const transformedOptions: ComboboxOption<LegacyComboboxOption>[] = options.map(opt => ({
    value: opt.id,
    label: opt.name,
    data: opt,
  }))

  return (
    <Combobox
      value={value}
      onChange={onChange}
      onSelect={option => onSelect?.(option.data!)}
      options={transformedOptions}
      placeholder={placeholder}
      className={className}
      renderOption={option => (
        <div className="flex justify-between items-center">
          <span className="text-morandi-primary">{option.label}</span>
          {option.data && (
            <span className="text-xs text-morandi-secondary">
              {option.data &&
              typeof option.data === 'object' &&
              'pricePerGroup' in option.data &&
              option.data.pricePerGroup
                ? 'isGroupCost' in option.data && option.data.isGroupCost
                  ? `團體 NT$${option.data.pricePerGroup}`
                  : 'price_per_person' in option.data
                    ? `個人 NT$${option.data.price_per_person}`
                    : ''
                : option.data &&
                    typeof option.data === 'object' &&
                    'price_per_person' in option.data &&
                    option.data.price_per_person
                  ? `NT$${option.data.price_per_person}`
                  : ''}
            </span>
          )}
        </div>
      )}
    />
  )
}
