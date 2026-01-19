/**
 * Unsplash API 工具
 *
 * 提供免費圖庫搜尋功能
 * 需要在 .env.local 設定 NEXT_PUBLIC_UNSPLASH_ACCESS_KEY
 * 前往 https://unsplash.com/developers 申請
 */

export interface UnsplashPhoto {
  id: string
  width: number
  height: number
  color: string
  blur_hash: string
  description: string | null
  alt_description: string | null
  urls: {
    raw: string
    full: string
    regular: string
    small: string
    thumb: string
  }
  links: {
    download: string
    download_location: string
  }
  user: {
    name: string
    username: string
    links: {
      html: string
    }
  }
}

export interface UnsplashSearchResult {
  total: number
  total_pages: number
  results: UnsplashPhoto[]
}

const UNSPLASH_API_URL = 'https://api.unsplash.com'
const ACCESS_KEY = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY

/**
 * 檢查 Unsplash API 是否已設定
 */
export function isUnsplashConfigured(): boolean {
  return Boolean(ACCESS_KEY && ACCESS_KEY.length > 0)
}

/**
 * 搜尋 Unsplash 圖片
 */
export async function searchPhotos(
  query: string,
  options?: {
    page?: number
    perPage?: number
    orientation?: 'landscape' | 'portrait' | 'squarish'
  }
): Promise<UnsplashSearchResult> {
  if (!ACCESS_KEY) {
    throw new Error('Unsplash API 未設定。請在 .env.local 設定 NEXT_PUBLIC_UNSPLASH_ACCESS_KEY')
  }

  const params = new URLSearchParams({
    query,
    page: String(options?.page ?? 1),
    per_page: String(options?.perPage ?? 20),
    ...(options?.orientation && { orientation: options.orientation }),
  })

  const response = await fetch(`${UNSPLASH_API_URL}/search/photos?${params}`, {
    headers: {
      Authorization: `Client-ID ${ACCESS_KEY}`,
    },
  })

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unsplash API 驗證失敗，請檢查 Access Key 是否正確')
    }
    if (response.status === 403) {
      throw new Error('Unsplash API 額度已用完，請明天再試或升級方案')
    }
    throw new Error(`Unsplash API 錯誤: ${response.status}`)
  }

  return response.json()
}

/**
 * 取得隨機圖片
 */
export async function getRandomPhotos(
  options?: {
    query?: string
    count?: number
    orientation?: 'landscape' | 'portrait' | 'squarish'
  }
): Promise<UnsplashPhoto[]> {
  if (!ACCESS_KEY) {
    throw new Error('Unsplash API 未設定')
  }

  const params = new URLSearchParams({
    count: String(options?.count ?? 10),
    ...(options?.query && { query: options.query }),
    ...(options?.orientation && { orientation: options.orientation }),
  })

  const response = await fetch(`${UNSPLASH_API_URL}/photos/random?${params}`, {
    headers: {
      Authorization: `Client-ID ${ACCESS_KEY}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Unsplash API 錯誤: ${response.status}`)
  }

  return response.json()
}

/**
 * 觸發下載追蹤（Unsplash API 要求在下載時呼叫）
 * 這是 Unsplash API 的使用條款要求
 */
export async function trackDownload(downloadLocation: string): Promise<void> {
  if (!ACCESS_KEY) return

  try {
    await fetch(downloadLocation, {
      headers: {
        Authorization: `Client-ID ${ACCESS_KEY}`,
      },
    })
  } catch {
    // 忽略追蹤失敗
  }
}

/**
 * 取得旅遊相關的推薦搜尋關鍵字
 */
export const TRAVEL_KEYWORDS = {
  zh: [
    '風景', '海灘', '山脈', '城市', '建築',
    '美食', '咖啡', '夜景', '日落', '日出',
    '飯店', '機場', '寺廟', '神社', '古蹟',
    '櫻花', '雪景', '秋葉', '花園', '森林',
  ],
  en: [
    'landscape', 'beach', 'mountain', 'city', 'architecture',
    'food', 'coffee', 'night view', 'sunset', 'sunrise',
    'hotel', 'airport', 'temple', 'shrine', 'heritage',
    'cherry blossom', 'snow', 'autumn leaves', 'garden', 'forest',
  ],
}
