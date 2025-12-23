import { NextResponse } from 'next/server'

/**
 * API 回應工具函數
 */

interface CacheOptions {
  /** 私有快取（僅瀏覽器） */
  private?: boolean
  /** 最大快取時間（秒） */
  maxAge?: number
  /** stale-while-revalidate 時間（秒） */
  swr?: number
}

/**
 * 建立帶有快取標頭的成功回應
 */
export function jsonResponse<T>(
  data: T,
  options?: {
    status?: number
    cache?: CacheOptions
  }
) {
  const { status = 200, cache } = options || {}

  const response = NextResponse.json(data, { status })

  if (cache) {
    const parts: string[] = []

    if (cache.private) {
      parts.push('private')
    } else {
      parts.push('public')
    }

    if (cache.maxAge !== undefined) {
      parts.push(`max-age=${cache.maxAge}`)
    }

    if (cache.swr !== undefined) {
      parts.push(`stale-while-revalidate=${cache.swr}`)
    }

    response.headers.set('Cache-Control', parts.join(', '))
  }

  return response
}

/**
 * 建立錯誤回應
 */
export function errorResponse(
  error: string,
  status = 500
) {
  return NextResponse.json({ error }, { status })
}

/**
 * 預設快取配置
 */
export const CACHE_CONFIGS = {
  /** 私有資料，短期快取 (10秒快取, 30秒SWR) */
  privateShort: {
    private: true,
    maxAge: 10,
    swr: 30,
  } as CacheOptions,

  /** 私有資料，中期快取 (30秒快取, 60秒SWR) */
  privateMedium: {
    private: true,
    maxAge: 30,
    swr: 60,
  } as CacheOptions,

  /** 公開資料，中期快取 (60秒快取, 120秒SWR) */
  publicMedium: {
    private: false,
    maxAge: 60,
    swr: 120,
  } as CacheOptions,

  /** 不快取 */
  noCache: {
    private: true,
    maxAge: 0,
    swr: 0,
  } as CacheOptions,
}
