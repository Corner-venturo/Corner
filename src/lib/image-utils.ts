// 圖片優化工具
// 提供 blur placeholder 和圖片處理功能

/**
 * 預設的 blur placeholder (10x10 灰色漸層)
 * 用於遠端圖片載入時顯示
 */
export const DEFAULT_BLUR_DATA_URL =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAKAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABgcI/8QAIxAAAgEDBAIDAQAAAAAAAAAAAQIDBAURAAYSIQcxQVFhcf/EABQBAQAAAAAAAAAAAAAAAAAAAAX/xAAaEQACAwEBAAAAAAAAAAAAAAABAgADERIh/9oADAMBAAIRAxEAPwCb7Y8f2u/2+K6VFxq6SOdOcSRRxlmQ9g8iDxJHYHsahuyNgWTbN4prtRy18s9PnyR5pVKfhKkKoII7BH3rl1Dce1zWY1gJJv/Z'

/**
 * 為遠端圖片生成簡單的 shimmer placeholder
 */
export const shimmerToBase64 = (w: number, h: number) => {
  const shimmer = `
    <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g">
          <stop stop-color="#f6f7f8" offset="0%"/>
          <stop stop-color="#edeef1" offset="50%"/>
          <stop stop-color="#f6f7f8" offset="100%"/>
        </linearGradient>
      </defs>
      <rect width="${w}" height="${h}" fill="url(#g)"/>
    </svg>
  `
  return `data:image/svg+xml;base64,${Buffer.from(shimmer).toString('base64')}`
}

/**
 * 獲取圖片的 blur placeholder
 * 如果是 Supabase 圖片，使用預設 blur
 * 如果是本地圖片，Next.js 會自動處理
 */
export function getBlurPlaceholder(src: string | undefined): {
  placeholder: 'blur' | 'empty'
  blurDataURL?: string
} {
  if (!src) {
    return { placeholder: 'empty' }
  }

  // 遠端圖片使用預設 blur
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return {
      placeholder: 'blur',
      blurDataURL: DEFAULT_BLUR_DATA_URL,
    }
  }

  // 本地圖片讓 Next.js 自動處理
  return { placeholder: 'blur' }
}

/**
 * 優化的 Image 組件 props
 * 使用方式: <Image {...getOptimizedImageProps(src)} alt="..." />
 */
export function getOptimizedImageProps(src: string | undefined) {
  const { placeholder, blurDataURL } = getBlurPlaceholder(src)

  return {
    placeholder,
    ...(blurDataURL && { blurDataURL }),
    // 啟用優先載入的提示
    loading: 'lazy' as const,
  }
}
