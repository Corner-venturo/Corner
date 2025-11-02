/**
 * 確認單服務層
 * 處理確認單的業務邏輯
 */

import { supabase } from '@/lib/supabase/client'
import type { Confirmation } from '@/types/confirmation.types'

export const confirmationService = {
  /**
   * 取得所有確認單
   */
  async fetchAll(workspaceId: string): Promise<Confirmation[]> {
    const { data, error } = await supabase
      .from('confirmations')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  /**
   * 取得單一確認單
   */
  async fetchById(id: string): Promise<Confirmation | null> {
    const { data, error } = await supabase
      .from('confirmations')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  /**
   * 新增確認單
   */
  async create(confirmation: Omit<Confirmation, 'id' | 'created_at' | 'updated_at'>): Promise<Confirmation> {
    const { data, error } = await supabase
      .from('confirmations')
      .insert(confirmation)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * 更新確認單
   */
  async update(id: string, updates: Partial<Confirmation>): Promise<Confirmation> {
    const { data, error } = await supabase
      .from('confirmations')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * 刪除確認單
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('confirmations')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  /**
   * 依照類型搜尋
   */
  async fetchByType(workspaceId: string, type: 'accommodation' | 'flight'): Promise<Confirmation[]> {
    const { data, error } = await supabase
      .from('confirmations')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('type', type)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  /**
   * 依照訂單編號搜尋
   */
  async fetchByBookingNumber(workspaceId: string, bookingNumber: string): Promise<Confirmation[]> {
    const { data, error } = await supabase
      .from('confirmations')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('booking_number', bookingNumber)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  /**
   * 依照狀態搜尋
   */
  async fetchByStatus(
    workspaceId: string,
    status: 'draft' | 'confirmed' | 'sent' | 'cancelled'
  ): Promise<Confirmation[]> {
    const { data, error } = await supabase
      .from('confirmations')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('status', status)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },
}
