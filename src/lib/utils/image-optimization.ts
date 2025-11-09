/**
 * 圖片優化工具
 * 提供縮圖、延遲載入、預載等功能
 */

/**
 * 圖片優化選項
 */
export interface ImageOptimizationOptions {
  /** 寬度 */
  width?: number
  /** 高度 */
  height?: number
  /** 品質 (0-100) */
  quality?: number
  /** 格式 */
  format?: 'webp' | 'jpeg' | 'png'
  /** 是否使用縮圖 */
  thumbnail?: boolean
}

/**
 * Supabase Storage 圖片轉換參數
 * @see https://supabase.com/docs/guides/storage/serving/image-transformations
 */
interface SupabaseImageTransform {
  width?: number
  height?: number
  quality?: number
  format?: 'origin' | 'webp'
  resize?: 'cover' | 'contain' | 'fill'
}

/**
 * 從 Supabase Storage URL 取得優化後的圖片 URL
 *
 * Supabase 支援即時圖片轉換：
 * https://xxx.supabase.co/storage/v1/render/image/public/bucket/file.jpg?width=400&quality=80
 *
 * @param url - 原始 Supabase Storage URL
 * @param options - 優化選項
 * @returns 優化後的 URL
 */
export function getOptimizedImageUrl(url: string | null | undefined, options: ImageOptimizationOptions = {}): string {
  // 如果沒有 URL，返回佔位圖
  if (!url) {
    return getPlaceholderImage(options.width, options.height)
  }

  // 如果不是 Supabase Storage URL，直接返回
  if (!url.includes('supabase.co/storage')) {
    return url
  }

  // 預設選項
  const {
    width,
    height,
    quality = 80,
    format = 'webp',
    thumbnail = false,
  } = options

  try {
    const urlObj = new URL(url)

    // 將 /storage/v1/object/public/ 轉換為 /storage/v1/render/image/public/
    const renderPath = urlObj.pathname.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/')

    // 建立查詢參數
    const params = new URLSearchParams()

    // 縮圖模式：固定 400px 寬度
    if (thumbnail) {
      params.set('width', '400')
      params.set('quality', '75')
      params.set('format', 'webp')
    } else {
      if (width) params.set('width', width.toString())
      if (height) params.set('height', height.toString())
      if (quality) params.set('quality', quality.toString())
      if (format === 'webp') params.set('format', 'webp')
    }

    // 建立新 URL
    return `${urlObj.origin}${renderPath}?${params.toString()}`
  } catch (error) {
    // URL 解析失敗，返回原始 URL
    return url
  }
}

/**
 * 取得佔位圖（使用 placeholder.com 或自訂 SVG）
 */
export function getPlaceholderImage(width: number = 400, height: number = 300): string {
  // 使用簡單的 Data URL SVG 佔位圖
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <text
        x="50%"
        y="50%"
        dominant-baseline="middle"
        text-anchor="middle"
        font-family="sans-serif"
        font-size="16"
        fill="#9ca3af"
      >
        ${width} × ${height}
      </text>
    </svg>
  `.trim()

  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

/**
 * 預載圖片
 * 在背景下載圖片，提升使用者體驗
 */
export function preloadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      resolve()
      return
    }
    const img = new window.Image()
    img.onload = () => resolve()
    img.onerror = reject
    img.src = url
  })
}

/**
 * 預載多張圖片
 */
export async function preloadImages(urls: string[]): Promise<void> {
  await Promise.all(urls.map(preloadImage))
}

/**
 * React 延遲載入圖片的 Props
 */
export const lazyLoadProps = {
  loading: 'lazy' as const,
  decoding: 'async' as const,
}

/**
 * 根據裝置螢幕大小取得適當的圖片寬度
 */
export function getResponsiveWidth(): number {
  if (typeof window === 'undefined') return 1200

  const width = window.innerWidth

  // 根據常見斷點決定圖片大小
  if (width <= 640) return 640   // Mobile
  if (width <= 768) return 768   // Tablet
  if (width <= 1024) return 1024 // Laptop
  if (width <= 1280) return 1280 // Desktop
  return 1920 // Large Desktop
}

/**
 * 取得城市背景圖（針對 Regions/Cities 頁面）
 */
export function getCityBackgroundImage(
  city: { background_image_url?: string; background_image_url_2?: string; primary_image?: number },
  options: ImageOptimizationOptions = {}
): string {
  // 根據 primary_image 選擇主要圖片
  const primaryUrl = city.primary_image === 2
    ? city.background_image_url_2
    : city.background_image_url

  return getOptimizedImageUrl(primaryUrl, options)
}

/**
 * 取得城市所有背景圖的縮圖（用於預覽）
 */
export function getCityBackgroundThumbnails(
  city: { background_image_url?: string; background_image_url_2?: string }
): { url1: string; url2: string } {
  return {
    url1: getOptimizedImageUrl(city.background_image_url, { thumbnail: true }),
    url2: getOptimizedImageUrl(city.background_image_url_2, { thumbnail: true }),
  }
}
