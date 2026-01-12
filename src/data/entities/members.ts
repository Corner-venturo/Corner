'use client'

/**
 * Members Entity (order_members)
 *
 * 使用方式：
 * import { useMembers, useMember, useMembersByOrder } from '@/data'
 */

import { createEntityHook } from '../core/createEntityHook'
import { CACHE_PRESETS } from '../core/types'
import type { Member } from '@/stores/types'

// ============================================
// Entity 定義
// ============================================

export const memberEntity = createEntityHook<Member>('order_members', {
  list: {
    select: '*',
    orderBy: {
      column: 'created_at',
      ascending: false,
    },
  },
  slim: {
    select: 'id,order_id,chinese_name,english_name,gender,passport_number,id_number',
  },
  detail: {
    select: '*',
  },
  cache: CACHE_PRESETS.high,
})

// ============================================
// 便捷 Hooks Export
// ============================================

/** 完整 Members 列表 */
export const useMembers = memberEntity.useList

/** 精簡 Members 列表 */
export const useMembersSlim = memberEntity.useListSlim

/** 單筆 Member（支援 skip pattern）*/
export const useMember = memberEntity.useDetail

/** 分頁 Members */
export const useMembersPaginated = memberEntity.usePaginated

/** Member Dictionary */
export const useMemberDictionary = memberEntity.useDictionary

// ============================================
// CRUD Export
// ============================================

export const createMember = memberEntity.create
export const updateMember = memberEntity.update
export const deleteMember = memberEntity.delete
export const invalidateMembers = memberEntity.invalidate
