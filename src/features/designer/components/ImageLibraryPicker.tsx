'use client'

/**
 * ImageLibraryPicker - 圖庫選擇器
 *
 * 整合 Unsplash 和 Pexels 兩個免費圖庫
 * 使用內部 tabs 切換不同圖庫來源
 */

import { useState } from 'react'
import { UnsplashPicker } from './UnsplashPicker'
import { PexelsPicker } from './PexelsPicker'
import { cn } from '@/lib/utils'

interface ImageLibraryPickerProps {
  onSelectImage: (imageUrl: string, attribution?: { name: string; link: string }) => void
}

type ImageSource = 'unsplash' | 'pexels'

export function ImageLibraryPicker({ onSelectImage }: ImageLibraryPickerProps) {
  const [source, setSource] = useState<ImageSource>('unsplash')

  return (
    <div className="flex flex-col h-full">
      {/* 圖庫來源選擇 */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setSource('unsplash')}
          className={cn(
            'flex-1 py-2 text-xs font-medium transition-colors',
            source === 'unsplash'
              ? 'text-morandi-gold border-b-2 border-morandi-gold bg-morandi-gold/5'
              : 'text-morandi-secondary hover:text-morandi-primary hover:bg-morandi-container/30'
          )}
        >
          Unsplash
        </button>
        <button
          onClick={() => setSource('pexels')}
          className={cn(
            'flex-1 py-2 text-xs font-medium transition-colors',
            source === 'pexels'
              ? 'text-morandi-gold border-b-2 border-morandi-gold bg-morandi-gold/5'
              : 'text-morandi-secondary hover:text-morandi-primary hover:bg-morandi-container/30'
          )}
        >
          Pexels
        </button>
      </div>

      {/* 圖庫內容 */}
      <div className="flex-1 overflow-hidden">
        {source === 'unsplash' ? (
          <UnsplashPicker onSelectImage={onSelectImage} />
        ) : (
          <PexelsPicker onSelectImage={onSelectImage} />
        )}
      </div>
    </div>
  )
}
