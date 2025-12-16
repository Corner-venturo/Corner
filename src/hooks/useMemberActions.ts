// src/hooks/useMemberActions.ts
// 輕量級 hook：只提供 create/update/delete，不觸發 SWR fetch
// 用於只需要寫入操作的頁面（如 /orders），避免首屏載入整個 members 表

import { mutate } from 'swr'
import { supabase } from '@/lib/supabase/client'
import { generateUUID } from '@/lib/utils/uuid'
import type { Member } from '@/stores/types'

// SWR key 與 cloud-hooks 的 useMembers 一致，確保 mutate 時能同步
const SWR_KEY = 'members'

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

interface MemberActionsReturn {
  create: (data: Omit<Member, 'id' | 'created_at' | 'updated_at'>) => Promise<Member>
  update: (id: string, updates: Partial<Member>) => Promise<void>
  delete: (id: string) => Promise<void>
}

/**
 * 輕量級 Member 操作 hook
 * 不會觸發 SWR fetch，只提供寫入操作
 * 寫入後會 mutate SWR cache，讓其他使用 useMembers() 的頁面同步更新
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

  const remove = async (id: string): Promise<void> => {
    const { error } = await supabase.from('members').delete().eq('id', id)
    if (error) throw error

    mutate(SWR_KEY)
  }

  return {
    create,
    update,
    delete: remove,
  }
}

export default useMemberActions
