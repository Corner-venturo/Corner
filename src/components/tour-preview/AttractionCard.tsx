import React from 'react'
import Image from 'next/image'
import { morandiColors } from '@/lib/constants/morandi-colors'

export interface AttractionCardProps {
  title: string
  description: string
  image?: string
  layout?: 'horizontal' | 'vertical' | 'fullwidth' | 'hero'
  className?: string
  onClick?: () => void
}

/**
 * 景點卡片組件
 * 支援多種佈局模式，展示景點資訊
 */
export function AttractionCard({
  title,
  description,
  image,
  layout = 'horizontal',
  className = '',
  onClick,
}: AttractionCardProps) {
  const hasImage = image && image.length > 0

  // Hero layout - 大圖 + 文字覆蓋
  if (layout === 'hero') {
    return (
      <div
        className={`relative h-[400px] rounded-[24px] overflow-hidden ${className} ${onClick ? 'cursor-pointer hover:scale-[1.02] transition-transform' : ''}`}
        style={{
          backgroundColor: morandiColors.background.cream,
          boxShadow: `0 4px 20px ${morandiColors.shadow.medium}`,
        }}
        onClick={onClick}
      >
        {hasImage && (
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 1200px"
          />
        )}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to top, ${morandiColors.text.primary}E6 0%, transparent 60%)`,
          }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 p-8"
          style={{ color: morandiColors.background.white }}
        >
          <h3 className="text-3xl font-bold mb-3">{title}</h3>
          <p className="text-lg opacity-95 line-clamp-3">{description}</p>
        </div>
      </div>
    )
  }

  // Fullwidth layout - 全寬圖片 + 下方文字
  if (layout === 'fullwidth') {
    return (
      <div
        className={`rounded-[24px] overflow-hidden ${className} ${onClick ? 'cursor-pointer hover:scale-[1.02] transition-transform' : ''}`}
        style={{
          backgroundColor: morandiColors.background.white,
          border: `1px solid ${morandiColors.border.light}`,
          boxShadow: `0 2px 12px ${morandiColors.shadow.soft}`,
        }}
        onClick={onClick}
      >
        {hasImage && (
          <div className="relative w-full h-72">
            <Image
              src={image}
              alt={title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 1200px"
            />
          </div>
        )}
        <div className="p-7">
          <h3 className="text-2xl font-bold mb-3" style={{ color: morandiColors.text.primary }}>
            {title}
          </h3>
          <p className="text-base leading-relaxed" style={{ color: morandiColors.text.secondary }}>
            {description}
          </p>
        </div>
      </div>
    )
  }

  // Vertical layout - 縱向卡片
  if (layout === 'vertical') {
    return (
      <div
        className={`rounded-[24px] overflow-hidden ${className} ${onClick ? 'cursor-pointer hover:scale-[1.02] transition-transform' : ''}`}
        style={{
          backgroundColor: morandiColors.background.white,
          border: `1px solid ${morandiColors.border.light}`,
          boxShadow: `0 2px 12px ${morandiColors.shadow.soft}`,
        }}
        onClick={onClick}
      >
        {hasImage && (
          <div className="relative w-full h-56">
            <Image
              src={image}
              alt={title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 400px"
            />
          </div>
        )}
        <div className="p-6">
          <h4 className="text-xl font-bold mb-3" style={{ color: morandiColors.text.primary }}>
            {title}
          </h4>
          <p
            className="text-sm leading-relaxed line-clamp-3"
            style={{ color: morandiColors.text.secondary }}
          >
            {description}
          </p>
        </div>
      </div>
    )
  }

  // Horizontal layout - 預設佈局（無圖片時為緊湊文字卡片）
  return (
    <div
      className={`rounded-[16px] overflow-hidden flex flex-col ${hasImage ? 'p-5' : 'p-4'} ${className} ${onClick ? 'cursor-pointer hover:scale-[1.02] transition-transform' : ''}`}
      style={{
        backgroundColor: hasImage ? morandiColors.background.white : morandiColors.background.cream,
        border: `1px solid ${morandiColors.border.light}`,
        boxShadow: `0 1px 8px ${morandiColors.shadow.soft}`,
      }}
      onClick={onClick}
    >
      {hasImage ? (
        <div className="flex gap-5">
          <div className="relative w-32 h-32 flex-shrink-0 rounded-[12px] overflow-hidden">
            <Image src={image} alt={title} fill className="object-cover" sizes="128px" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-base mb-2" style={{ color: morandiColors.text.primary }}>
              {title}
            </h4>
            <p className="text-sm leading-relaxed" style={{ color: morandiColors.text.secondary }}>
              {description}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-center">
          <h4 className="font-bold text-base mb-2" style={{ color: morandiColors.text.primary }}>
            {title}
          </h4>
          <p className="text-sm leading-relaxed line-clamp-4" style={{ color: morandiColors.text.secondary }}>
            {description}
          </p>
        </div>
      )}
    </div>
  )
}
