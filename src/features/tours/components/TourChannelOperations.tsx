'use client'
/**
 * TourChannelOperations - Channel creation and tour unlock operations
 */


import { useCallback } from 'react'
import { Tour } from '@/stores/types'
import { logger } from '@/lib/utils/logger'
import { useRequireAuthSync } from '@/hooks/useRequireAuth'
import { confirm } from '@/lib/ui/alert-dialog'
import { TOUR_CHANNEL_LABELS } from '../constants/labels'

export interface TourStoreActions {
  fetchAll: () => Promise<void>
}

interface UseTourChannelOperationsParams {
  actions: TourStoreActions
}

export function useTourChannelOperations({ actions }: UseTourChannelOperationsParams) {
  /**
   * 建立工作空間頻道
   */
  const handleCreateChannel = useCallback(async (tour: Tour) => {
    const { toast } = await import('sonner')

    // 先確認是否要建立頻道
    const channelName = `${tour.code} ${tour.name}`
    const confirmed = await confirm(TOUR_CHANNEL_LABELS.CREATE_CONFIRM(tour.name, channelName), {
      title: TOUR_CHANNEL_LABELS.CREATE_CHANNEL,
      type: 'info',
    })
    if (!confirmed) {
      return
    }

    // 立即顯示載入提示
    const loadingToast = toast.loading(TOUR_CHANNEL_LABELS.CREATING)

    try {
      const { supabase } = await import('@/lib/supabase/client')
      logger.log('🔵 [建立頻道] 開始處理:', tour.code, tour.name)

      // 從 Zustand store 獲取當前登入使用者（支援本地認證）
      const auth = useRequireAuthSync()

      if (!auth.isAuthenticated) {
        logger.error('❌ [建立頻道] 使用者未登入')
        toast.dismiss(loadingToast)
        auth.showLoginRequired()
        return
      }

      logger.log('✅ [建立頻道] 使用者已登入:', auth.user!.id)

      // 獲取預設工作空間 ID
      const { data: workspaces, error: wsError } = await supabase
        .from('workspaces')
        .select('id')
        .limit(1)
        .single()

      if (wsError || !workspaces) {
        logger.error('❌ [建立頻道] 找不到工作空間:', wsError)
        toast.dismiss(loadingToast)
        toast.error(TOUR_CHANNEL_LABELS.WORKSPACE_NOT_FOUND)
        return
      }

      logger.log('✅ [建立頻道] 工作空間:', workspaces.id)

      // 檢查是否已有頻道（加上 workspace_id 過濾）
      const { data: existingChannel, error: checkError } = await supabase
        .from('channels')
        .select('id, name')
        .eq('workspace_id', workspaces.id)
        .eq('tour_id', tour.id)
        .maybeSingle()

      if (checkError) {
        logger.error('❌ [建立頻道] 檢查失敗:', checkError)
      }

      if (existingChannel) {
        logger.log('ℹ️ [建立頻道] 頻道已存在:', existingChannel.name)
        toast.dismiss(loadingToast)
        toast.info(TOUR_CHANNEL_LABELS.CHANNEL_EXISTS(existingChannel.name))
        return
      }

      // 建立頻道
      const channelName = `${tour.code} ${tour.name}`
      logger.log('🔵 [建立頻道] 準備建立:', channelName)

      const { error: insertError, data: newChannel } = await supabase
        .from('channels')
        .insert({
          workspace_id: workspaces.id,
          name: channelName,
          description: `${tour.name} - ${tour.departure_date || ''} 出發`,
          type: 'public',
          tour_id: tour.id,
          created_by: auth.user!.id,
        })
        .select()
        .single()

      if (insertError) {
        logger.error('❌ [建立頻道] 建立失敗:', insertError)
        throw insertError
      }

      logger.log('✅ [建立頻道] 建立成功:', newChannel)

      // 自動將創建者加入為頻道擁有者
      try {
        const { createChannelMember } = await import('@/data/entities/channel-members')
        await createChannelMember({
          workspace_id: workspaces.id,
          channel_id: newChannel.id,
          employee_id: auth.user!.id,
          role: 'owner',
          status: 'active',
        })
        logger.log('✅ [建立頻道] 創建者已加入為擁有者')
      } catch (memberErr) {
        logger.warn('⚠️ [建立頻道] 加入成員異常:', memberErr)
      }

      toast.dismiss(loadingToast)
      toast.success(TOUR_CHANNEL_LABELS.CHANNEL_CREATED(channelName))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : TOUR_CHANNEL_LABELS.UNKNOWN_ERROR
      logger.error('❌ [建立頻道] 發生錯誤:', error)
      toast.dismiss(loadingToast)
      toast.error(TOUR_CHANNEL_LABELS.CREATE_FAILED(errorMessage))
    }
  }, [])

  return {
    handleCreateChannel,
  }
}
