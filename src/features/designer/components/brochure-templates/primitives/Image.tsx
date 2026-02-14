'use client'
/**
 * 圖片元素
 */

import NextImage from 'next/image'
import type { Theme } from '../types'

interface ImageProps {
  src: string
  alt?: string
  theme: Theme
  width?: string
  height?: string
  rounded?: boolean | 'arch'  // arch = 圓拱形（日系風格）
  className?: string
  style?: React.CSSProperties
}

export function Image({
  src,
  alt = '',
  theme,
  width = '100%',
  height = '60mm',
  rounded = false,
  className,
  style,
}: ImageProps) {
  const borderRadius = rounded === 'arch'
    ? '50% 50% 3mm 3mm'
    : rounded
      ? '3mm'
      : '0'

  return (
    <div
      className={className}
      style={{
        width,
        height,
        position: 'relative',
        overflow: 'hidden',
        borderRadius,
        backgroundColor: theme.colors.surface,
        ...style,
      }}
    >
      <NextImage
        src={src}
        alt={alt}
        fill
        style={{ objectFit: 'cover' }}
      />
    </div>
  )
}
