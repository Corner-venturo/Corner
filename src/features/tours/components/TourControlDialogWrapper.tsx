/**
 * TourControlDialogWrapper - 旅遊團的團控表包裝器
 *
 * 從旅遊團 ID 查找對應的提案套件，然後打開團控表對話框
 */

'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/utils/logger'
import { TourControlFormDialog } from '@/features/proposals/components/TourControlFormDialog'
import type { Tour } from '@/stores/types'
import type { Proposal, ProposalPackage } from '@/types/proposal.types'
import { Loader2 } from 'lucide-react'

interface TourControlDialogWrapperProps {
  tour: Tour | null
  onClose: () => void
}

export function TourControlDialogWrapper({
  tour,
  onClose,
}: TourControlDialogWrapperProps) {
  const [loading, setLoading] = useState(true)
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [pkg, setPkg] = useState<ProposalPackage | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!tour) {
      setLoading(false)
      return
    }

    const loadProposalAndPackage = async () => {
      setLoading(true)
      setError(null)

      try {
        // 從提案表找到對應這個旅遊團的提案
        const { data: proposalData, error: proposalError } = await supabase
          .from('proposals')
          .select('*')
          .eq('converted_tour_id', tour.id)
          .single()

        if (proposalError || !proposalData) {
          // 嘗試用團號查找
          const { data: proposalByCode, error: codeError } = await supabase
            .from('proposals')
            .select('*')
            .eq('code', tour.code)
            .single()

          if (codeError || !proposalByCode) {
            setError('找不到對應的提案，此旅遊團可能不是從提案轉換而來')
            setLoading(false)
            return
          }

          setProposal(proposalByCode as Proposal)

          // 查找 selected 的套件
          const { data: pkgData } = await supabase
            .from('proposal_packages')
            .select('*')
            .eq('proposal_id', proposalByCode.id)
            .eq('is_selected', true)
            .single()

          if (pkgData) {
            setPkg(pkgData as ProposalPackage)
          } else {
            // 沒有 selected 的，取第一個
            const { data: firstPkg } = await supabase
              .from('proposal_packages')
              .select('*')
              .eq('proposal_id', proposalByCode.id)
              .order('created_at', { ascending: true })
              .limit(1)
              .single()

            if (firstPkg) {
              setPkg(firstPkg as ProposalPackage)
            } else {
              setError('找不到提案套件')
            }
          }
        } else {
          setProposal(proposalData as Proposal)

          // 查找 selected 的套件
          const { data: pkgData } = await supabase
            .from('proposal_packages')
            .select('*')
            .eq('proposal_id', proposalData.id)
            .eq('is_selected', true)
            .single()

          if (pkgData) {
            setPkg(pkgData as ProposalPackage)
          } else {
            // 沒有 selected 的，取第一個
            const { data: firstPkg } = await supabase
              .from('proposal_packages')
              .select('*')
              .eq('proposal_id', proposalData.id)
              .order('created_at', { ascending: true })
              .limit(1)
              .single()

            if (firstPkg) {
              setPkg(firstPkg as ProposalPackage)
            } else {
              setError('找不到提案套件')
            }
          }
        }
      } catch (err) {
        logger.error('載入提案資料失敗:', err)
        setError('載入提案資料失敗')
      } finally {
        setLoading(false)
      }
    }

    loadProposalAndPackage()
  }, [tour])

  // 沒有 tour 時不顯示
  if (!tour) {
    return null
  }

  // 載入中
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-card rounded-lg p-6 flex items-center gap-3">
          <Loader2 className="animate-spin text-morandi-gold" size={24} />
          <span>載入團控表資料...</span>
        </div>
      </div>
    )
  }

  // 錯誤訊息
  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-card rounded-lg p-6 max-w-md">
          <h3 className="text-lg font-medium text-morandi-red mb-2">無法開啟團控表</h3>
          <p className="text-morandi-secondary mb-4">{error}</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-morandi-gold hover:bg-morandi-gold-hover text-white rounded"
          >
            關閉
          </button>
        </div>
      </div>
    )
  }

  // 成功載入，顯示團控表對話框
  return (
    <TourControlFormDialog
      isOpen={true}
      onClose={onClose}
      pkg={pkg}
      proposal={proposal}
    />
  )
}
