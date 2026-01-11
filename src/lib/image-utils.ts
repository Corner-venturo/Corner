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

/**
 * 圖片壓縮選項
 */
export interface CompressImageOptions {
  /** 最大寬/高尺寸（預設 800px） */
  maxDimension?: number
  /** 目標檔案大小（bytes，預設 500KB） */
  targetSize?: number
  /** 初始品質（0-1，預設 0.8） */
  quality?: number
  /** 最低品質（0-1，預設 0.3） */
  minQuality?: number
  /** 輸出格式（預設 image/jpeg） */
  outputFormat?: 'image/jpeg' | 'image/png' | 'image/webp'
}

/**
 * 通用圖片壓縮函數
 * 自動調整尺寸和品質，確保檔案大小在目標範圍內
 *
 * @param file 原始圖片檔案
 * @param options 壓縮選項
 * @returns 壓縮後的圖片檔案
 *
 * @example
 * // 壓縮頭像（小尺寸、高品質）
 * const avatar = await compressImage(file, { maxDimension: 400, targetSize: 200 * 1024 })
 *
 * // 壓縮一般圖片
 * const image = await compressImage(file, { maxDimension: 1200, targetSize: 800 * 1024 })
 */
export async function compressImage(
  file: File,
  options: CompressImageOptions = {}
): Promise<File> {
  const {
    maxDimension = 800,
    targetSize = 500 * 1024, // 500KB
    quality = 0.8,
    minQuality = 0.3,
    outputFormat = 'image/jpeg',
  } = options

  return new Promise((resolve, reject) => {
    // 如果檔案已經小於目標大小且是支援的格式，直接返回
    if (file.size <= targetSize && file.type === outputFormat) {
      resolve(file)
      return
    }

    const reader = new FileReader()
    reader.readAsDataURL(file)

    reader.onload = (e) => {
      const img = new Image()
      img.src = e.target?.result as string

      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img

        // 調整尺寸
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height / width) * maxDimension)
            width = maxDimension
          } else {
            width = Math.round((width / height) * maxDimension)
            height = maxDimension
          }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')

        if (!ctx) {
          reject(new Error('無法創建 canvas context'))
          return
        }

        // 繪製圖片
        ctx.drawImage(img, 0, 0, width, height)

        // 遞迴壓縮函數
        const tryCompress = (currentQuality: number) => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('圖片壓縮失敗'))
                return
              }

              // 取得副檔名
              const ext = outputFormat === 'image/jpeg' ? 'jpg' : outputFormat === 'image/png' ? 'png' : 'webp'
              const baseName = file.name.replace(/\.[^/.]+$/, '')
              const newFileName = `${baseName}.${ext}`

              const compressedFile = new File([blob], newFileName, {
                type: outputFormat,
                lastModified: Date.now(),
              })

              // 如果還是太大且品質還可以降低，繼續壓縮
              if (compressedFile.size > targetSize && currentQuality > minQuality) {
                tryCompress(currentQuality - 0.1)
              } else {
                resolve(compressedFile)
              }
            },
            outputFormat,
            currentQuality
          )
        }

        tryCompress(quality)
      }

      img.onerror = () => reject(new Error('無法載入圖片'))
    }

    reader.onerror = () => reject(new Error('無法讀取檔案'))
  })
}

/**
 * 壓縮頭像圖片（預設最佳化設定）
 * 尺寸限制 400px，目標大小 200KB
 */
export async function compressAvatarImage(file: File): Promise<File> {
  return compressImage(file, {
    maxDimension: 400,
    targetSize: 200 * 1024, // 200KB
    quality: 0.85,
    minQuality: 0.5,
    outputFormat: 'image/jpeg',
  })
}
