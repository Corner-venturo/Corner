'use client'

/**
 * Proposals Entity
 */

import { createEntityHook } from '../core/createEntityHook'
import { CACHE_PRESETS } from '../core/types'
import type { Proposal } from '@/stores/types'

export const proposalEntity = createEntityHook<Proposal>('proposals', {
  list: {
    select: '*',
    orderBy: { column: 'created_at', ascending: false },
  },
  slim: {
    select: 'id,code,name,destination,status,created_at',
  },
  detail: { select: '*' },
  cache: CACHE_PRESETS.medium,
})

export const useProposals = proposalEntity.useList
export const useProposalsSlim = proposalEntity.useListSlim
export const useProposal = proposalEntity.useDetail
export const useProposalsPaginated = proposalEntity.usePaginated
export const useProposalDictionary = proposalEntity.useDictionary

export const createProposal = proposalEntity.create
export const updateProposal = proposalEntity.update
export const deleteProposal = proposalEntity.delete
export const invalidateProposals = proposalEntity.invalidate
