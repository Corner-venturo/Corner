// src/hooks/useMemberActions.ts
// 輕量級 hook：只提供 create/update/delete，不觸發 SWR fetch
// 用於只需要寫入操作的頁面（如 /orders），避免首屏載入整個 members 表

import { mutate } from 'swr'
import { supabase } from '@/lib/supabase/client'
import { generateUUID } from '@/lib/utils/uuid'
import type { Member } from '@/stores/types'

// SWR key 與 cloud-hooks 的 useMembers 一致，確保 mutate 時能同步
const SWR_KEY = 'members'
const ORDERS_SWR_KEY = 'orders'

/**
 * 取得當前使用者的 workspace_id
 */
function getCurrentWorkspaceId(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const authData = localStorage.getItem('auth-storage')
    if (authData) {
      const parsed = JSON.parse(authData)
      return parsed?.state?.user?.workspace_id || null
    }
  } catch {
    // 忽略解析錯誤
  }
  return null
}

/**
 * 同步更新訂單的 member_count
 * 根據實際 order_members 數量更新
 */
async function syncOrderMemberCount(orderId: string): Promise<void> {
  if (!orderId) return

  // 計算該訂單的實際團員數量（從 order_members 表）
  const { count, error: countError } = await supabase
    .from('order_members')
    .select('*', { count: 'exact', head: true })
    .eq('order_id', orderId)

  if (countError) {
    console.error('Failed to count members:', countError)
    return
  }

  // 更新訂單的 member_count
  const { error: updateError } = await supabase
    .from('orders')
    .update({ member_count: count || 0, updated_at: new Date().toISOString() })
    .eq('id', orderId)

  if (updateError) {
    console.error('Failed to update order member_count:', updateError)
    return
  }

  // 觸發 orders SWR revalidate
  mutate(ORDERS_SWR_KEY)
}

interface MemberActionsReturn {
  create: (data: Omit<Member, 'id' | 'created_at' | 'updated_at'>) => Promise<Member>
  update: (id: string, updates: Partial<Member>) => Promise<void>
  delete: (id: string, orderId?: string) => Promise<void>
}

/**
 * 輕量級 Member 操作 hook
 * 不會觸發 SWR fetch，只提供寫入操作
 * 寫入後會 mutate SWR cache，讓其他使用 useMembers() 的頁面同步更新
 * 新增/刪除時會自動同步更新訂單的 member_count
 */
export function useMemberActions(): MemberActionsReturn {
  const create = async (data: Omit<Member, 'id' | 'created_at' | 'updated_at'>): Promise<Member> => {
    const now = new Date().toISOString()
    const workspace_id = getCurrentWorkspaceId()

    const newMember = {
      ...data,
      id: generateUUID(),
      created_at: now,
      updated_at: now,
      ...(workspace_id ? { workspace_id } : {}),
    } as Member

    const { error } = await supabase.from('members').insert(newMember)
    if (error) throw error

    // 觸發 SWR revalidate，讓其他頁面的 useMembers() 同步
    mutate(SWR_KEY)

    // 同步更新訂單的 member_count
    if (data.order_id) {
      await syncOrderMemberCount(data.order_id)
    }

    return newMember
  }

  const update = async (id: string, updates: Partial<Member>): Promise<void> => {
    const updatedData = {
      ...updates,
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase
      .from('members')
      .update(updatedData as Record<string, unknown>)
      .eq('id', id)
    if (error) throw error

    mutate(SWR_KEY)
  }

  const remove = async (id: string, orderId?: string): Promise<void> => {
    // 如果沒傳 orderId，先查詢取得
    let memberOrderId = orderId
    if (!memberOrderId) {
      const { data: member } = await supabase
        .from('members')
        .select('order_id')
        .eq('id', id)
        .single()
      memberOrderId = member?.order_id
    }

    const { error } = await supabase.from('members').delete().eq('id', id)
    if (error) throw error

    mutate(SWR_KEY)

    // 同步更新訂單的 member_count
    if (memberOrderId) {
      await syncOrderMemberCount(memberOrderId)
    }
  }

  return {
    create,
    update,
    delete: remove,
  }
}

export default useMemberActions
