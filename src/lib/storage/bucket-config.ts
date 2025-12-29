/**
 * Supabase Storage Bucket 配置
 * 統一管理所有 storage bucket 名稱，避免硬編碼
 */

export const STORAGE_BUCKETS = {
  // 頭像相關
  AVATARS: 'avatars',
  USER_AVATARS: 'user-avatars',

  // 護照/文件相關
  PASSPORT_IMAGES: 'passport-images',
  MEMBER_DOCUMENTS: 'member-documents',

  // 工作空間/企業相關
  WORKSPACE_FILES: 'workspace-files',
  COMPANY_ASSETS: 'company-assets',

  // 聊天/通訊相關
  CHAT_FILES: 'chat-files',

  // 圖片相關
  CITY_BACKGROUNDS: 'city-backgrounds',
  TOUR_HOTELS: 'tour-hotels',
} as const

export type StorageBucket = (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS]

/**
 * 根據用途取得對應的 bucket
 */
export function getBucketForPurpose(
  purpose: 'passport' | 'avatar' | 'document' | 'chat' | 'company' | 'city' | 'hotel'
): StorageBucket {
  switch (purpose) {
    case 'passport':
      return STORAGE_BUCKETS.PASSPORT_IMAGES
    case 'avatar':
      return STORAGE_BUCKETS.USER_AVATARS
    case 'document':
      return STORAGE_BUCKETS.MEMBER_DOCUMENTS
    case 'chat':
      return STORAGE_BUCKETS.CHAT_FILES
    case 'company':
      return STORAGE_BUCKETS.COMPANY_ASSETS
    case 'city':
      return STORAGE_BUCKETS.CITY_BACKGROUNDS
    case 'hotel':
      return STORAGE_BUCKETS.TOUR_HOTELS
    default:
      return STORAGE_BUCKETS.WORKSPACE_FILES
  }
}
