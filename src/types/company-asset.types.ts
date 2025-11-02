/**
 * 公司資源型別定義
 */

import { BaseEntity } from './base.types'

/**
 * CompanyAssetCategory - 資源分類
 */
export type CompanyAssetCategory = 'logos' | 'seals' | 'illustrations' | 'documents'

/**
 * CompanyAsset - 公司資源
 */
export interface CompanyAsset extends BaseEntity {
  name: string // 檔案名稱
  category: CompanyAssetCategory // 分類
  file_path: string // Storage 檔案路徑
  file_size?: number // 檔案大小（bytes）
  mime_type?: string // MIME 類型
  description?: string // 檔案描述
  uploaded_by?: string // 上傳者 ID
  uploaded_by_name?: string // 上傳者名稱
}

/**
 * CreateCompanyAssetData - 建立公司資源
 */
export interface CreateCompanyAssetData {
  name: string
  category: CompanyAssetCategory
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
 * 分類標籤
 */
export const COMPANY_ASSET_CATEGORY_LABELS: Record<CompanyAssetCategory, string> = {
  logos: 'Logo',
  seals: '大小章',
  illustrations: '插圖',
  documents: '文件',
}

/**
 * 分類圖示
 */
export const COMPANY_ASSET_CATEGORY_ICONS: Record<CompanyAssetCategory, string> = {
  logos: '🏢',
  seals: '🔖',
  illustrations: '🎨',
  documents: '📄',
}
