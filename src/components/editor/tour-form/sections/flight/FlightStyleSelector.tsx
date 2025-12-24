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
      <div className="bg-gradient-to-r from-slate-50 to-slate-100/50 p-4 rounded-lg border border-slate-200">
        <div className="flex items-center gap-2 mb-3">
          <Plane className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-medium text-slate-700">航班卡片風格</span>
        </div>
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-morandi-gold" />
          <span className="ml-2 text-sm text-slate-500">載入中...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-r from-slate-50 to-slate-100/50 p-4 rounded-lg border border-slate-200">
      <div className="flex items-center gap-2 mb-3">
        <Plane className="w-4 h-4 text-slate-500" />
        <span className="text-sm font-medium text-slate-700">航班卡片風格</span>
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
                  : 'border-transparent bg-white hover:border-slate-300'
              )}
            >
              {/* 預覽圖（如果有） */}
              {option.previewImage && (
                <div className="w-full h-12 mb-2 rounded overflow-hidden bg-slate-100">
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
                isSelected ? 'text-morandi-gold' : 'text-slate-700'
              )}>
                {option.label}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5">{option.description}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
