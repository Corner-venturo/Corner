/**
 * LinkItineraryToTourDialog - 旅遊團設計對話框
 * 功能：選擇設計手冊或網頁行程表
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Palette, Loader2, ExternalLink, BookOpen, Globe, FileText } from 'lucide-react'
import type { Tour } from '@/stores/types'
import type { ProposalPackage } from '@/types/proposal.types'
import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/utils/logger'

interface LinkItineraryToTourDialogProps {
  isOpen: boolean
  onClose: () => void
  tour: Tour
}

type DesignType = 'brochure' | 'web'

export function LinkItineraryToTourDialog({
  isOpen,
  onClose,
  tour,
}: LinkItineraryToTourDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [linkedPackage, setLinkedPackage] = useState<ProposalPackage | null>(null)

  // 載入關聯的提案套件
  useEffect(() => {
    if (!isOpen) return

    const loadLinkedPackage = async () => {
      setLinkedPackage(null)

      // 檢查是否有關聯的套件
      if (!tour.proposal_package_id) {
        return
      }

      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('proposal_packages')
          .select('*')
          .eq('id', tour.proposal_package_id)
          .single()

        if (error) {
          logger.warn('載入套件失敗:', error)
          return
        }

        setLinkedPackage(data as ProposalPackage)
      } catch (err) {
        logger.error('載入套件錯誤:', err)
      } finally {
        setLoading(false)
      }
    }

    loadLinkedPackage()
  }, [isOpen, tour.proposal_package_id])

  // 導航到設計頁面
  const handleOpenDesign = (type: DesignType) => {
    onClose()

    if (type === 'brochure') {
      // 手冊設計 - 導向 brochure 頁面
      if (linkedPackage) {
        router.push(`/brochure?package_id=${linkedPackage.id}`)
      } else {
        router.push(`/brochure?tour_id=${tour.id}`)
      }
    } else {
      // 網頁行程表 - 導向網頁行程頁面（未來功能）
      if (linkedPackage) {
        router.push(`/brochure?package_id=${linkedPackage.id}&mode=web`)
      } else {
        router.push(`/brochure?tour_id=${tour.id}&mode=web`)
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-morandi-gold" />
            <span>設計</span>
            <span className="text-sm text-morandi-secondary font-normal">- {tour.code}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-morandi-secondary" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* 顯示已有的套件資訊 */}
              {linkedPackage && (
                <div className="p-3 rounded-lg border border-border bg-morandi-container/20 mb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-morandi-gold" />
                    <span className="text-sm text-morandi-primary">
                      {linkedPackage.version_name || tour.name}
                    </span>
                    {linkedPackage.days && (
                      <span className="text-xs text-morandi-secondary">
                        ({linkedPackage.days} 天)
                      </span>
                    )}
                  </div>
                </div>
              )}

              <p className="text-sm text-morandi-secondary text-center">
                選擇設計類型
              </p>

              <div className="grid grid-cols-2 gap-3">
                {/* 手冊 */}
                <button
                  onClick={() => handleOpenDesign('brochure')}
                  className="p-4 rounded-lg border-2 border-border hover:border-morandi-gold/50 hover:bg-morandi-gold/5 transition-all text-left group"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 rounded-full bg-morandi-gold/10 flex items-center justify-center group-hover:bg-morandi-gold/20 transition-colors">
                      <BookOpen className="w-5 h-5 text-morandi-gold" />
                    </div>
                  </div>
                  <span className="font-medium text-morandi-primary block mb-1">手冊</span>
                  <p className="text-xs text-morandi-secondary">
                    製作精美的行程手冊，可列印或分享 PDF
                  </p>
                </button>

                {/* 網頁行程表 */}
                <button
                  onClick={() => handleOpenDesign('web')}
                  className="p-4 rounded-lg border-2 border-border hover:border-morandi-gold/50 hover:bg-morandi-gold/5 transition-all text-left group"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 rounded-full bg-morandi-gold/10 flex items-center justify-center group-hover:bg-morandi-gold/20 transition-colors">
                      <Globe className="w-5 h-5 text-morandi-gold" />
                    </div>
                  </div>
                  <span className="font-medium text-morandi-primary block mb-1">網頁行程表</span>
                  <p className="text-xs text-morandi-secondary">
                    互動式網頁行程，可產生連結分享給客戶
                  </p>
                </button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
