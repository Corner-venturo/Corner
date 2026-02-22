'use client'

/**
 * useGenerateRequestsFromCore — 從核心表一鍵產需求單
 */

import { useState, useCallback } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { useToast } from '@/components/ui/use-toast'
import { logger } from '@/lib/utils/logger'
import {
  getUnrequestedItems,
  generateRequestsFromCoreItems,
  type SupplierGroup,
} from '../services/requestCoreTableSync'

const LABELS = {
  GENERATING: 'Generating requests...',
  SUCCESS: 'Requests generated',
  NO_ITEMS: 'No items need requests',
  ERROR: 'Failed to generate requests',
  CREATED_COUNT: (n: number) => `Created ${n} request(s)`,
} as const

export function useGenerateRequestsFromCore(params: {
  tour_id: string
  tour_code: string
  tour_name: string
  on_success?: () => void
}) {
  const { tour_id, tour_code, tour_name, on_success } = params
  const { user } = useAuthStore()
  const { toast } = useToast()

  const [loading, setLoading] = useState(false)
  const [groups, setGroups] = useState<SupplierGroup[]>([])

  const fetchUnrequested = useCallback(async () => {
    const result = await getUnrequestedItems(tour_id)
    if (result.success) {
      setGroups(result.groups)
    }
    return result.groups
  }, [tour_id])

  const generate = useCallback(async (selected_groups?: SupplierGroup[]) => {
    if (!user?.workspace_id || !user.id) return

    setLoading(true)
    try {
      const target_groups = selected_groups || groups
      if (target_groups.length === 0) {
        toast({ title: LABELS.NO_ITEMS })
        return
      }

      const result = await generateRequestsFromCoreItems({
        tour_id,
        tour_code,
        tour_name,
        workspace_id: user.workspace_id,
        created_by: user.id,
        created_by_name: user.chinese_name || user.display_name || user.name || '',
        groups: target_groups,
      })

      if (result.success) {
        toast({ title: LABELS.SUCCESS, description: LABELS.CREATED_COUNT(result.created_count) })
        on_success?.()
      } else {
        toast({ title: LABELS.ERROR, description: result.message, variant: 'destructive' })
      }
    } catch (error) {
      logger.error(LABELS.ERROR, error)
      toast({ title: LABELS.ERROR, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [user, groups, tour_id, tour_code, tour_name, on_success, toast])

  return {
    loading,
    groups,
    fetchUnrequested,
    generate,
  }
}
