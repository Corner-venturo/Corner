// ============================================
// 景點型別定義
// ============================================

export interface Attraction {
  id: string
  name: string
  name_en?: string
  description?: string
  country_id: string
  region_id?: string
  city_id?: string | null
  category?: string
  tags?: string[]
  duration_minutes?: number
  opening_hours?: Record<string, string> | string
  address?: string
  phone?: string
  website?: string
  latitude?: number
  longitude?: number
  google_maps_url?: string
  images?: string[]
  thumbnail?: string
  is_active: boolean
  display_order: number
  notes?: string
  created_at: string
  updated_at: string
}

export type SortField = 'name' | 'city' | 'category' | 'duration' | 'status'
export type SortDirection = 'asc' | 'desc' | null

export interface AttractionFormData {
  name: string
  name_en: string
  description: string
  country_id: string
  region_id: string
  city_id?: string | null
  category: string
  tags: string
  duration_minutes: number
  address: string
  phone: string
  website: string
  images: string
  notes: string
  is_active: boolean
}
