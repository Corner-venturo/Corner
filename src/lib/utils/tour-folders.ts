/**
 * Tour Folders Utility
 * 
 * 自動建立團的資料夾結構，並根據類型自動分類檔案
 */

import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { logger } from '@/lib/utils/logger'

// 預設資料夾結構
export const DEFAULT_TOUR_FOLDERS = [
  { name: '需求單', category: 'request', icon: '📋', color: '#c9aa7c' },
  { name: '取消單', category: 'cancellation', icon: '❌', color: '#c08374' },
  { name: '報價單', category: 'quote', icon: '💰', color: '#8b9a7c' },
  { name: '確認單', category: 'confirmation', icon: '✅', color: '#7c8b9a' },
  { name: '合約', category: 'contract', icon: '📄', color: '#9a7c8b' },
  { name: '護照', category: 'passport', icon: '🛂', color: '#7c9a8b' },
  { name: '行程表', category: 'itinerary', icon: '🗓️', color: '#8b7c9a' },
  { name: '機票', category: 'ticket', icon: '✈️', color: '#9a8b7c' },
  { name: '憑證', category: 'voucher', icon: '🎫', color: '#7c8b8b' },
  { name: '保險', category: 'insurance', icon: '🛡️', color: '#8b8b7c' },
  { name: '照片', category: 'photo', icon: '📷', color: '#8b7c8b' },
  { name: '其他', category: 'other', icon: '📁', color: '#8b8b8b' },
] as const

export type FileCategory = typeof DEFAULT_TOUR_FOLDERS[number]['category']

/**
 * 為團建立預設資料夾結構
 */
export async function createTourFolders(
  tourId: string,
  workspaceId: string,
  tourCode: string,
  createdBy?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createSupabaseBrowserClient()

  try {
    // 檢查是否已存在
    const { data: existing } = await supabase
      .from('folders')
      .select('id')
      .eq('tour_id', tourId)
      .limit(1)

    if (existing && existing.length > 0) {
      logger.info('Tour folders already exist', { tourId })
      return { success: true }
    }

    // 建立資料夾
    const folders = DEFAULT_TOUR_FOLDERS.map((folder, index) => ({
      workspace_id: workspaceId,
      name: folder.name,
      folder_type: 'tour' as const,
      icon: folder.icon,
      color: folder.color,
      parent_id: null,
      path: `/${tourCode}/${folder.name}`,
      depth: 1,
      tour_id: tourId,
      default_category: folder.category as 'quote' | 'contract' | 'passport' | 'itinerary' | 'ticket' | 'voucher' | 'insurance' | 'photo' | 'other' | 'visa' | 'invoice' | 'email_attachment' | 'request' | 'cancellation' | 'confirmation',
      is_system: true,
      sort_order: index,
      created_by: createdBy || null,
    }))

    const { error } = await supabase
      .from('folders')
      .insert(folders)

    if (error) {
      logger.error('Failed to create tour folders', { tourId, error })
      return { success: false, error: error.message }
    }

    logger.info('Tour folders created', { tourId, count: folders.length })
    return { success: true }
  } catch (err) {
    logger.error('Error creating tour folders', { tourId, err })
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

type DBFileCategory = 'quote' | 'contract' | 'passport' | 'itinerary' | 'ticket' | 'voucher' | 'insurance' | 'photo' | 'other' | 'visa' | 'invoice' | 'email_attachment' | 'request' | 'cancellation' | 'confirmation'

/**
 * 取得團的資料夾（依類型）
 */
export async function getTourFolder(
  tourId: string,
  category: FileCategory
): Promise<string | null> {
  const supabase = createSupabaseBrowserClient()

  const { data, error } = await supabase
    .from('folders')
    .select('id')
    .eq('tour_id', tourId)
    .eq('default_category', category as DBFileCategory)
    .single()

  if (error || !data) {
    return null
  }

  return data.id
}

/**
 * 取得或建立團的資料夾
 */
export async function getOrCreateTourFolder(
  tourId: string,
  workspaceId: string,
  tourCode: string,
  category: FileCategory,
  createdBy?: string
): Promise<string | null> {
  // 先嘗試取得
  let folderId = await getTourFolder(tourId, category)
  
  if (!folderId) {
    // 資料夾不存在，建立所有預設資料夾
    await createTourFolders(tourId, workspaceId, tourCode, createdBy)
    folderId = await getTourFolder(tourId, category)
  }

  return folderId
}

/**
 * 根據類型取得中文名稱
 */
export function getCategoryDisplayName(category: FileCategory): string {
  const folder = DEFAULT_TOUR_FOLDERS.find(f => f.category === category)
  return folder?.name || '其他'
}
