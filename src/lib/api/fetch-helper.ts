/**
 * API 請求工具函數
 * 統一錯誤處理和日誌記錄
 */

import { logger } from '@/lib/utils/logger'

export interface ApiError extends Error {
  status?: number
  code?: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * 統一的 fetch 封裝
 * 自動處理 JSON 解析和錯誤
 */
export async function fetchApi<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    })

    // 嘗試解析 JSON
    let data: unknown
    const contentType = response.headers.get('content-type')
    if (contentType?.includes('application/json')) {
      data = await response.json()
    } else {
      data = await response.text()
    }

    // 檢查 HTTP 狀態
    if (!response.ok) {
      const error = new Error(
        (data as ApiResponse<unknown>)?.error ||
          (data as ApiResponse<unknown>)?.message ||
          `HTTP ${response.status}`
      ) as ApiError
      error.status = response.status
      throw error
    }

    return data as T
  } catch (error) {
    logger.error(`API call failed: ${url}`, error)
    throw error
  }
}

/**
 * GET 請求
 */
export async function apiGet<T>(url: string): Promise<T> {
  return fetchApi<T>(url, { method: 'GET' })
}

/**
 * POST 請求
 */
export async function apiPost<T>(url: string, body?: unknown): Promise<T> {
  return fetchApi<T>(url, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  })
}

/**
 * PUT 請求
 */
export async function apiPut<T>(url: string, body?: unknown): Promise<T> {
  return fetchApi<T>(url, {
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  })
}

/**
 * DELETE 請求
 */
export async function apiDelete<T>(url: string): Promise<T> {
  return fetchApi<T>(url, { method: 'DELETE' })
}

/**
 * FormData POST 請求（用於文件上傳）
 */
export async function apiPostFormData<T>(url: string, formData: FormData): Promise<T> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      // 不設置 Content-Type，讓瀏覽器自動設置 multipart/form-data
    })

    const data = await response.json()

    if (!response.ok) {
      const error = new Error(data?.error || data?.message || `HTTP ${response.status}`) as ApiError
      error.status = response.status
      throw error
    }

    return data as T
  } catch (error) {
    logger.error(`API FormData call failed: ${url}`, error)
    throw error
  }
}
