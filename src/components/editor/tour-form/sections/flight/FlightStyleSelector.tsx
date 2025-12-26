'use client'

import React from 'react'
import { Plane, Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FlightStyleType } from '../../types'

interface FlightStyleOption {
  value: FlightStyleType
  label: string
  description: string
  color: string
  previewImage: string | null
}

interface FlightStyleSelectorProps {
  options: FlightStyleOption[]
  selectedValue: FlightStyleType
  onSelect: (value: FlightStyleType) => void
  isLoading?: boolean
}

export function FlightStyleSelector({
  options,
  selectedValue,
  onSelect,
  isLoading = false,
}: FlightStyleSelectorProps) {
  if (isLoading) {
    return (
      <div className="bg-gradient-to-r from-muted to-morandi-container/50 p-4 rounded-lg border border-border">
        <div className="flex items-center gap-2 mb-3">
          <Plane className="w-4 h-4 text-morandi-secondary" />
          <span className="text-sm font-medium text-morandi-primary">航班卡片風格</span>
        </div>
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-morandi-gold" />
          <span className="ml-2 text-sm text-morandi-secondary">載入中...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-r from-muted to-morandi-container/50 p-4 rounded-lg border border-border">
      <div className="flex items-center gap-2 mb-3">
        <Plane className="w-4 h-4 text-morandi-secondary" />
        <span className="text-sm font-medium text-morandi-primary">航班卡片風格</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {options.map((option) => {
          const isSelected = selectedValue === option.value
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onSelect(option.value)}
              className={cn(
                'relative flex flex-col items-start p-2.5 rounded-lg border-2 transition-all text-left',
                isSelected
                  ? 'border-morandi-gold bg-morandi-gold/10'
                  : 'border-transparent bg-white hover:border-border'
              )}
            >
              {/* 預覽圖（如果有） */}
              {option.previewImage && (
                <div className="w-full h-12 mb-2 rounded overflow-hidden bg-morandi-container">
                  <img
                    src={option.previewImage}
                    alt={option.label}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              {isSelected && (
                <div className="absolute top-1.5 right-1.5">
                  <Check className="w-3.5 h-3.5 text-morandi-gold" />
                </div>
              )}
              <span className={cn(
                'text-xs font-bold',
                isSelected ? 'text-morandi-gold' : 'text-morandi-primary'
              )}>
                {option.label}
              </span>
              <span className="text-[10px] text-morandi-secondary mt-0.5">{option.description}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
