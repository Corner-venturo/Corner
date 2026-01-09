'use client'

/**
 * TourControlSheet - 團控表 Tab 內容
 *
 * 從旅遊團查找對應的提案套件，顯示團控表內容
 */

import { useEffect, useState, useCallback } from 'react'
import { Loader2, ClipboardEdit, FileText, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/utils/logger'
import { TourControlFormDialog } from '@/features/proposals/components/TourControlFormDialog'
import type { Tour } from '@/stores/types'
import type { Proposal, ProposalPackage } from '@/types/proposal.types'

interface TourControlSheetProps {
  tourId: string
}

export function TourControlSheet({ tourId }: TourControlSheetProps) {
  const [loading, setLoading] = useState(true)
  const [tour, setTour] = useState<Tour | null>(null)
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [pkg, setPkg] = useState<ProposalPackage | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showDialog, setShowDialog] = useState(false)

  // 載入旅遊團和關聯的提案資料
  useEffect(() => {
    if (!tourId) {
      setLoading(false)
      return
    }

    const loadData = async () => {
      setLoading(true)
      setError(null)

      try {
        // 載入旅遊團資料
        const { data: tourData, error: tourError } = await supabase
          .from('tours')
          .select('*')
          .eq('id', tourId)
          .single()

        if (tourError || !tourData) {
          setError('找不到旅遊團資料')
          setLoading(false)
          return
        }

        setTour(tourData as Tour)

        // 從提案表找到對應這個旅遊團的提案
        const { data: proposalData } = await supabase
          .from('proposals')
          .select('*')
          .eq('converted_tour_id', tourId)
          .single()

        if (proposalData) {
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
            }
          }
        } else {
          // 嘗試用團號查找
          const { data: proposalByCode } = await supabase
            .from('proposals')
            .select('*')
            .eq('code', tourData.code)
            .single()

          if (proposalByCode) {
            setProposal(proposalByCode as Proposal)

            const { data: pkgData } = await supabase
              .from('proposal_packages')
              .select('*')
              .eq('proposal_id', proposalByCode.id)
              .eq('is_selected', true)
              .single()

            if (pkgData) {
              setPkg(pkgData as ProposalPackage)
            } else {
              const { data: firstPkg } = await supabase
                .from('proposal_packages')
                .select('*')
                .eq('proposal_id', proposalByCode.id)
                .order('created_at', { ascending: true })
                .limit(1)
                .single()

              if (firstPkg) {
                setPkg(firstPkg as ProposalPackage)
              }
            }
          }
        }
      } catch (err) {
        logger.error('載入團控資料失敗:', err)
        setError('載入資料失敗')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [tourId])

  const handleOpenDialog = useCallback(() => {
    setShowDialog(true)
  }, [])

  const handleCloseDialog = useCallback(() => {
    setShowDialog(false)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-morandi-gold mr-2" size={24} />
        <span className="text-morandi-secondary">載入團控資料...</span>
      </div>
    )
  }

  if (error || !proposal || !pkg) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="text-morandi-secondary mb-3" size={48} />
        <h3 className="text-lg font-medium text-morandi-primary mb-2">無法載入團控表</h3>
        <p className="text-morandi-secondary max-w-md">
          {error || '此旅遊團沒有關聯的提案資料。團控表需要從提案轉開團的旅遊團才能使用。'}
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="p-4">
        {/* 標題區 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <ClipboardEdit className="text-morandi-gold" size={24} />
            <div>
              <h2 className="text-lg font-medium text-morandi-primary">團控表</h2>
              <p className="text-sm text-morandi-secondary">
                {tour?.code} - {tour?.name}
              </p>
            </div>
          </div>
          <Button
            onClick={handleOpenDialog}
            className="bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-2"
          >
            <FileText size={16} />
            編輯團控表
          </Button>
        </div>

        {/* 提案資訊 */}
        <div className="bg-morandi-container/30 rounded-lg p-4 mb-4">
          <h3 className="text-sm font-medium text-morandi-primary mb-2">關聯提案</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-morandi-secondary">提案編號：</span>
              <span className="text-morandi-primary">{proposal.code}</span>
            </div>
            <div>
              <span className="text-morandi-secondary">提案名稱：</span>
              <span className="text-morandi-primary">{proposal.title}</span>
            </div>
            <div>
              <span className="text-morandi-secondary">套件版本：</span>
              <span className="text-morandi-primary">{pkg.version_name || `版本 ${pkg.version_number}`}</span>
            </div>
            <div>
              <span className="text-morandi-secondary">目的地：</span>
              <span className="text-morandi-primary">{pkg.destination || proposal.destination || '-'}</span>
            </div>
          </div>
        </div>

        {/* 提示 */}
        <div className="text-sm text-morandi-secondary">
          點擊「編輯團控表」可以查看和編輯完整的團控資訊，包含遊覽車、飯店、景點門票、餐食等確認項目。
        </div>
      </div>

      {/* 團控表對話框 */}
      {showDialog && (
        <TourControlFormDialog
          isOpen={showDialog}
          onClose={handleCloseDialog}
          pkg={pkg}
          proposal={proposal}
        />
      )}
    </>
  )
}
