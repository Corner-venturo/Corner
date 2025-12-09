/**
 * 公司資源型別定義
 */

import { BaseEntity } from './base.types'

/**
 * CompanyAssetType - 檔案類型
 */
export type CompanyAssetType = 'document' | 'image' | 'video'

/**
 * CompanyAsset - 公司資源
 */
export interface CompanyAsset extends BaseEntity {
  name: string // 資料名稱
  asset_type: CompanyAssetType // 檔案類型
  file_path: string // Storage 檔案路徑
  file_size?: number // 檔案大小（bytes）
  mime_type?: string // MIME 類型
  description?: string // 檔案描述
  uploaded_by?: string // 上傳者 ID
  uploaded_by_name?: string // 上傳者名稱
  restricted?: boolean // 僅限會計/管理者可見
}

/**
 * CreateCompanyAssetData - 建立公司資源
 */
export interface CreateCompanyAssetData {
  name: string
  asset_type: CompanyAssetType
  file_path: string
  file_size?: number
  mime_type?: string
  description?: string
  uploaded_by?: string
  uploaded_by_name?: string
}

/**
 * UpdateCompanyAssetData - 更新公司資源
 */
export interface UpdateCompanyAssetData {
  name?: string
  description?: string
}

/**
 * 檔案類型標籤
 */
export const COMPANY_ASSET_TYPE_LABELS: Record<CompanyAssetType, string> = {
  document: '文件',
  image: '圖片',
  video: '影片',
}

/**
 * 檔案類型圖示
 */
export const COMPANY_ASSET_TYPE_ICONS: Record<CompanyAssetType, string> = {
  document: '📄',
  image: '🖼️',
  video: '🎬',
}

// 保留舊的 export 供相容性（如有需要可刪除）
export type CompanyAssetCategory = CompanyAssetType
export const COMPANY_ASSET_CATEGORY_LABELS = COMPANY_ASSET_TYPE_LABELS
export const COMPANY_ASSET_CATEGORY_ICONS = COMPANY_ASSET_TYPE_ICONS
