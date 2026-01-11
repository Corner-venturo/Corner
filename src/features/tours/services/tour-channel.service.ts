/**
 * Tour Channel Service
 * 自動建立旅遊團頻道並加入相關成員
 */

import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/utils/logger'
import type { Tour } from '@/types/tour.types'

interface CreateTourChannelResult {
  success: boolean
  channelId?: string
  error?: string
}

/**
 * 為旅遊團建立專屬頻道
 * @param tour - 旅遊團資料
 * @param creatorId - 建立者 ID
 * @returns 建立結果
 */
export async function createTourChannel(
  tour: Tour,
  creatorId: string
): Promise<CreateTourChannelResult> {
  try {
    // 1. 檢查是否已有頻道
    const { data: existingChannel } = await supabase
      .from('channels')
      .select('id')
      .eq('tour_id', tour.id)
      .maybeSingle()

    if (existingChannel) {
      logger.log(`[TourChannel] 頻道已存在: ${tour.code}`)
      return { success: true, channelId: existingChannel.id }
    }

    // 2. 建立頻道
    const channelName = `${tour.code} ${tour.name}`
    const { data: newChannel, error: channelError } = await supabase
      .from('channels')
      .insert({
        workspace_id: tour.workspace_id,
        name: channelName,
        description: `${tour.name} - ${tour.departure_date || ''} 出發`,
        type: 'public',
        channel_type: 'PUBLIC',
        tour_id: tour.id,
        created_by: creatorId,
      } as never)
      .select()
      .single()

    if (channelError) {
      logger.error('[TourChannel] 建立頻道失敗:', channelError)
      return { success: false, error: channelError.message }
    }

    logger.log(`[TourChannel] 頻道建立成功: ${channelName}`)

    // 3. 將創建者加入為頻道擁有者
    const membersToAdd: { employeeId: string; role: string }[] = [
      { employeeId: creatorId, role: 'owner' },
    ]

    // 4. 如果有團控，也加入頻道
    if (tour.controller_id && tour.controller_id !== creatorId) {
      membersToAdd.push({ employeeId: tour.controller_id, role: 'admin' })
    }

    // 5. 批量加入成員
    for (const member of membersToAdd) {
      try {
        await supabase.from('channel_members').insert({
          workspace_id: tour.workspace_id,
          channel_id: newChannel.id,
          employee_id: member.employeeId,
          role: member.role,
          status: 'active',
        } as never)
        logger.log(`[TourChannel] 成員加入成功: ${member.employeeId} (${member.role})`)
      } catch (memberError) {
        logger.warn(`[TourChannel] 加入成員失敗（可能已存在）:`, memberError)
      }
    }

    return { success: true, channelId: newChannel.id }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '建立頻道失敗'
    logger.error('[TourChannel] 發生錯誤:', error)
    return { success: false, error: errorMessage }
  }
}

/**
 * 將成員加入旅遊團頻道
 * @param tourId - 旅遊團 ID
 * @param employeeIds - 員工 ID 陣列
 * @param role - 角色 ('member' | 'admin')
 */
export async function addMembersToTourChannel(
  tourId: string,
  employeeIds: string[],
  role: 'member' | 'admin' = 'member'
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. 找到該團的頻道
    const { data: channel } = await supabase
      .from('channels')
      .select('id, workspace_id')
      .eq('tour_id', tourId)
      .maybeSingle()

    if (!channel) {
      logger.warn(`[TourChannel] 找不到團號 ${tourId} 的頻道`)
      return { success: false, error: '找不到頻道' }
    }

    // 2. 加入成員
    for (const employeeId of employeeIds) {
      try {
        // 先檢查是否已經是成員
        const { data: existingMember } = await supabase
          .from('channel_members')
          .select('id')
          .eq('channel_id', channel.id)
          .eq('employee_id', employeeId)
          .maybeSingle()

        if (!existingMember) {
          await supabase.from('channel_members').insert({
            workspace_id: channel.workspace_id,
            channel_id: channel.id,
            employee_id: employeeId,
            role,
            status: 'active',
          } as never)
          logger.log(`[TourChannel] 成員加入頻道: ${employeeId}`)
        }
      } catch (memberError) {
        logger.warn(`[TourChannel] 加入成員失敗:`, memberError)
      }
    }

    return { success: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '加入成員失敗'
    logger.error('[TourChannel] 發生錯誤:', error)
    return { success: false, error: errorMessage }
  }
}
