'use client'

import useSWR from 'swr'
import { supabase } from '@/lib/supabase/client'
import { useWorkspaceId } from '@/lib/workspace-context'
import type { Design, DesignType } from '../types'

const DESIGNS_KEY = 'designs'

/**
 * 設計資料 Hook
 */
export function useDesigns() {
  const workspaceId = useWorkspaceId()

  const { data, error, isLoading, mutate } = useSWR(
    workspaceId ? [DESIGNS_KEY, workspaceId] : null,
    async () => {
      // 先取得所有設計文件
      const { data: docs, error: docsError } = await supabase
        .from('brochure_documents')
        .select('*')
        .eq('workspace_id', workspaceId!)
        .order('created_at', { ascending: false })

      if (docsError) throw docsError

      // 取得有 tour_id 的文件的團資料
      const tourIds = (docs || [])
        .map(d => d.tour_id)
        .filter((id): id is string => !!id)

      let tourMap: Record<string, { name: string | null; code: string | null }> = {}

      if (tourIds.length > 0) {
        const { data: tours } = await supabase
          .from('tours')
          .select('id, name, code')
          .in('id', tourIds)

        if (tours) {
          tourMap = Object.fromEntries(
            tours.map(t => [t.id, { name: t.name, code: t.code }])
          )
        }
      }

      // 合併資料
      return (docs || []).map(doc => ({
        ...doc,
        tour_name: (doc.tour_id && tourMap[doc.tour_id]?.name) || doc.tour_name,
        tour_code: (doc.tour_id && tourMap[doc.tour_id]?.code) || doc.tour_code,
        // 如果 design_type 為空，默認 brochure_a5
        design_type: doc.design_type || 'brochure_a5',
      })) as Design[]
    }
  )

  const createDesign = async (params: {
    design_type: DesignType
    tour_id?: string
    tour_code?: string
    tour_name?: string
    itinerary_id?: string
    itinerary_name?: string
    name?: string
  }) => {
    if (!workspaceId) throw new Error('No workspace')

    const { data, error } = await supabase
      .from('brochure_documents')
      .insert({
        workspace_id: workspaceId,
        design_type: params.design_type,
        tour_id: params.tour_id || null,
        tour_code: params.tour_code || null,
        tour_name: params.tour_name || null,
        itinerary_id: params.itinerary_id || null,
        itinerary_name: params.itinerary_name || null,
        name: params.name || '未命名設計',
        status: 'draft',
        type: 'full',
      })
      .select()
      .single()

    if (error) throw error

    // 樂觀更新
    await mutate((current) => [data as Design, ...(current || [])], false)

    return data as Design
  }

  const updateDesign = async (id: string, updates: Partial<Design>) => {
    const { error } = await supabase
      .from('brochure_documents')
      .update(updates)
      .eq('id', id)

    if (error) throw error

    // 樂觀更新
    await mutate(
      (current) =>
        current?.map((d) => (d.id === id ? { ...d, ...updates } : d)),
      false
    )
  }

  const deleteDesign = async (id: string) => {
    const { error } = await supabase
      .from('brochure_documents')
      .delete()
      .eq('id', id)

    if (error) throw error

    // 樂觀更新
    await mutate((current) => current?.filter((d) => d.id !== id), false)
  }

  return {
    designs: data || [],
    isLoading,
    error,
    createDesign,
    updateDesign,
    deleteDesign,
    refresh: mutate,
  }
}
