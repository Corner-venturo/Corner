'use client'

/**
 * Proposal Packages Entity
 */

import { createEntityHook } from '../core/createEntityHook'
import { CACHE_PRESETS } from '../core/types'
import type { ProposalPackage } from '@/stores/types'

export const proposalPackageEntity = createEntityHook<ProposalPackage>('proposal_packages', {
  list: {
    select: '*',
    orderBy: { column: 'version_number', ascending: true },
  },
  slim: {
    select: 'id,proposal_id,version_number,version_name,is_active',
  },
  detail: { select: '*' },
  cache: CACHE_PRESETS.medium,
  workspaceScoped: false, // 透過 proposal_id 關聯
})

export const useProposalPackages = proposalPackageEntity.useList
export const useProposalPackagesSlim = proposalPackageEntity.useListSlim
export const useProposalPackage = proposalPackageEntity.useDetail
export const useProposalPackagesPaginated = proposalPackageEntity.usePaginated
export const useProposalPackageDictionary = proposalPackageEntity.useDictionary

export const createProposalPackage = proposalPackageEntity.create
export const updateProposalPackage = proposalPackageEntity.update
export const deleteProposalPackage = proposalPackageEntity.delete
export const invalidateProposalPackages = proposalPackageEntity.invalidate
