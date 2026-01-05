/**
 * useTemplates - Stub implementation
 * 原始模板系統已移除，此為相容性 stub
 */

'use client'

interface Template {
  id: string
  name: string
  description?: string
  preview_image_url?: string
}

interface UseTemplatesReturn {
  coverTemplates: Template[]
  dailyTemplates: Template[]
  flightTemplates: Template[]
  featuresTemplates: Template[]
  loading: boolean
}

// 預設模板
const defaultTemplates: Template[] = [
  { id: 'original', name: '經典風格', description: '簡潔專業的設計' },
]

/**
 * 模板顏色對應
 */
export function getTemplateColor(templateId: string): string {
  const colors: Record<string, string> = {
    original: '#c9aa7c',
    modern: '#3a3633',
    elegant: '#9fa68f',
    vibrant: '#c08374',
  }
  return colors[templateId] || colors.original
}

/**
 * useTemplates hook - 提供模板資料
 */
export function useTemplates(): UseTemplatesReturn {
  return {
    coverTemplates: defaultTemplates,
    dailyTemplates: defaultTemplates,
    flightTemplates: defaultTemplates,
    featuresTemplates: defaultTemplates,
    loading: false,
  }
}
