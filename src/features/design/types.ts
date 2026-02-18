/**
 * 設計模組類型定義
 */
import { DESIGN_TYPE_LABELS, DESIGN_CATEGORY_LABELS, DESIGN_STATUS_LABELS } from './constants/labels'

export type DesignType =
  // 手冊
  | 'brochure_a5'
  | 'brochure_a4'
  // 社群媒體
  | 'ig_square'
  | 'ig_portrait'
  | 'ig_story'
  // 廣告橫幅
  | 'banner_horizontal'
  | 'banner_square'

export type DesignCategory = 'brochure' | 'social' | 'banner'

export type DesignStatus = 'draft' | 'completed'

export interface Design {
  id: string
  workspace_id: string

  // 關聯
  tour_id: string | null
  itinerary_id: string | null
  package_id: string | null

  // 設計資訊
  name: string
  type: string // 'front' | 'back' | 'full'
  design_type: DesignType
  status: DesignStatus

  // 快取欄位
  tour_code: string | null
  tour_name: string | null
  itinerary_name: string | null

  // 版本
  current_version_id: string | null
  thumbnail_url: string | null

  // 標準欄位
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

export interface DesignVersion {
  id: string
  document_id: string
  version_number: number
  data: Record<string, unknown>
  thumbnail_url: string | null
  restored_from: string | null
  created_at: string
  created_by: string | null
}

// 設計類型配置
export const DESIGN_TYPE_CONFIG: Record<DesignType, {
  label: string
  category: DesignCategory
  size: string
  width: number
  height: number
  unit: 'mm' | 'px'
}> = {
  // 手冊
  brochure_a5: {
    label: DESIGN_TYPE_LABELS.手冊A5,
    category: 'brochure',
    size: DESIGN_TYPE_LABELS.直式148x210,
    width: 148,
    height: 210,
    unit: 'mm',
  },
  brochure_a4: {
    label: DESIGN_TYPE_LABELS.手冊A4,
    category: 'brochure',
    size: DESIGN_TYPE_LABELS.直式210x297,
    width: 210,
    height: 297,
    unit: 'mm',
  },
  // 社群媒體
  ig_square: {
    label: DESIGN_TYPE_LABELS.IG正方形,
    category: 'social',
    size: '1080 x 1080 px',
    width: 1080,
    height: 1080,
    unit: 'px',
  },
  ig_portrait: {
    label: DESIGN_TYPE_LABELS.IG直式,
    category: 'social',
    size: '1080 x 1350 px',
    width: 1080,
    height: 1350,
    unit: 'px',
  },
  ig_story: {
    label: DESIGN_TYPE_LABELS.IG限時動態,
    category: 'social',
    size: '1080 x 1920 px',
    width: 1080,
    height: 1920,
    unit: 'px',
  },
  // 廣告橫幅
  banner_horizontal: {
    label: DESIGN_TYPE_LABELS.橫幅布條,
    category: 'banner',
    size: '1200 x 400 px',
    width: 1200,
    height: 400,
    unit: 'px',
  },
  banner_square: {
    label: DESIGN_TYPE_LABELS.方形廣告,
    category: 'banner',
    size: '800 x 800 px',
    width: 800,
    height: 800,
    unit: 'px',
  },
}

// 分類配置
export const DESIGN_CATEGORY_CONFIG: Record<DesignCategory, {
  label: string
  description: string
}> = {
  brochure: {
    label: DESIGN_CATEGORY_LABELS.手冊,
    description: DESIGN_CATEGORY_LABELS.手冊傳單,
  },
  social: {
    label: DESIGN_CATEGORY_LABELS.社群媒體,
    description: 'Instagram、Facebook',
  },
  banner: {
    label: DESIGN_CATEGORY_LABELS.廣告橫幅,
    description: DESIGN_CATEGORY_LABELS.網站廣告布條,
  },
}

// 設計狀態配置
export const DESIGN_STATUS_CONFIG: Record<DesignStatus, {
  label: string
  color: string
}> = {
  draft: {
    label: DESIGN_STATUS_LABELS.草稿,
    color: 'text-morandi-secondary',
  },
  completed: {
    label: DESIGN_STATUS_LABELS.已完成,
    color: 'text-morandi-green',
  },
}
