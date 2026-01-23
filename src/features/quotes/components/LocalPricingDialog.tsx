'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Plus, Trash2, MapPin, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface LocalTier {
  id: string
  participants: number
  unitPrice: number
}

interface LocalPricingDialogProps {
  isOpen: boolean
  onClose: () => void
  totalParticipants: number
  onConfirm: (tiers: LocalTier[], matchedTierIndex: number) => void
}

export const LocalPricingDialog: React.FC<LocalPricingDialogProps> = ({
  isOpen,
  onClose,
  totalParticipants,
  onConfirm,
}) => {
  const [tiers, setTiers] = useState<LocalTier[]>([
    { id: `tier-${Date.now()}`, participants: 0, unitPrice: 0 },
  ])
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [matchedTierIndex, setMatchedTierIndex] = useState(0)

  // 新增檻次
  const handleAddTier = () => {
    setTiers([
      ...tiers,
      {
        id: `tier-${Date.now()}`,
        participants: 0,
        unitPrice: 0,
      },
    ])
  }

  // 移除檻次
  const handleRemoveTier = (id: string) => {
    if (tiers.length <= 1) return
    setTiers(tiers.filter(t => t.id !== id))
  }

  // 更新檻次
  const handleUpdateTier = (id: string, field: 'participants' | 'unitPrice', value: string) => {
    const numValue = parseInt(value) || 0
    setTiers(tiers.map(t => (t.id === id ? { ...t, [field]: numValue } : t)))
  }

  // 找到目前總人數對應的檻次
  const findMatchedTierIndex = (): number => {
    // 按人數排序（從小到大）
    const sortedTiers = [...tiers].sort((a, b) => a.participants - b.participants)

    // 找到最大的且 <= totalParticipants 的檻次
    let matchedIndex = 0
    for (let i = 0; i < sortedTiers.length; i++) {
      if (sortedTiers[i].participants <= totalParticipants) {
        matchedIndex = i
      } else {
        break
      }
    }

    // 返回在原始 tiers 陣列中的索引
    const matchedTier = sortedTiers[matchedIndex]
    return tiers.findIndex(t => t.id === matchedTier.id)
  }

  // 點擊確認
  const handleConfirmClick = () => {
    // 檢查是否有填寫人數和單價
    const hasEmptyData = tiers.some(t => !t.participants || t.participants <= 0 || !t.unitPrice || t.unitPrice <= 0)
    if (hasEmptyData) {
      return
    }

    const matched = findMatchedTierIndex()
    setMatchedTierIndex(matched)

    // 如果第一個檻次人數與總人數不同，顯示確認提醒
    const firstTier = tiers[0]
    if (firstTier.participants !== totalParticipants) {
      setShowConfirmation(true)
    } else {
      // 直接確認
      onConfirm(tiers, matched)
      handleClose()
    }
  }

  // 確認更新
  const handleFinalConfirm = () => {
    onConfirm(tiers, matchedTierIndex)
    handleClose()
  }

  // 關閉對話框
  const handleClose = () => {
    setShowConfirmation(false)
    setTiers([{ id: `tier-${Date.now()}`, participants: 0, unitPrice: 0 }])
    onClose()
  }

  // 取得對應檻次的資訊
  const getMatchedTierInfo = () => {
    const matched = findMatchedTierIndex()
    const tier = tiers[matched]
    return tier
  }

  const matchedTier = getMatchedTierInfo()

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin size={18} className="text-morandi-gold" />
            Local 報價
          </DialogTitle>
        </DialogHeader>

        {!showConfirmation ? (
          <>
            {/* 目前總人數提示 */}
            <div className="bg-morandi-container/30 rounded-lg px-4 py-3 text-sm">
              <span className="text-morandi-secondary">目前總人數：</span>
              <span className="font-semibold text-morandi-primary ml-1">{totalParticipants} 人</span>
            </div>

            {/* 檻次輸入區 */}
            <div className="space-y-3">
              <div className="grid grid-cols-[80px_1fr_1fr_40px] gap-2 text-xs text-morandi-secondary font-medium px-1">
                <span>檻次</span>
                <span>人數門檻</span>
                <span>單價（成本）</span>
                <span></span>
              </div>

              {tiers.map((tier, index) => (
                <div
                  key={tier.id}
                  className="grid grid-cols-[80px_1fr_1fr_40px] gap-2 items-center"
                >
                  <span className="text-sm text-morandi-secondary px-1">檻次 {index + 1}</span>
                  <Input
                    type="number"
                    value={tier.participants || ''}
                    onChange={e => handleUpdateTier(tier.id, 'participants', e.target.value)}
                    placeholder="人數"
                    className="h-9 text-sm"
                  />
                  <Input
                    type="number"
                    value={tier.unitPrice || ''}
                    onChange={e => handleUpdateTier(tier.id, 'unitPrice', e.target.value)}
                    placeholder="單價"
                    className="h-9 text-sm"
                  />
                  <button
                    onClick={() => handleRemoveTier(tier.id)}
                    disabled={tiers.length <= 1}
                    className={cn(
                      'w-8 h-8 flex items-center justify-center rounded transition-colors',
                      tiers.length <= 1
                        ? 'text-morandi-muted cursor-not-allowed'
                        : 'text-morandi-secondary hover:text-morandi-red hover:bg-morandi-red/10'
                    )}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}

              <Button
                variant="outline"
                size="sm"
                onClick={handleAddTier}
                className="w-full gap-2"
              >
                <Plus size={14} />
                新增檻次
              </Button>
            </div>

            {/* 對應提示 */}
            {matchedTier && matchedTier.unitPrice > 0 && (
              <div className="bg-morandi-gold/10 rounded-lg px-4 py-3 text-sm">
                <span className="text-morandi-secondary">
                  {totalParticipants} 人將使用「{matchedTier.participants} 人」檻次的報價：
                </span>
                <span className="font-semibold text-morandi-gold ml-1">
                  ${matchedTier.unitPrice.toLocaleString()}/人
                </span>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                取消
              </Button>
              <Button
                onClick={handleConfirmClick}
                className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
                disabled={tiers.some(t => !t.participants || t.participants <= 0 || !t.unitPrice || t.unitPrice <= 0)}
              >
                確認
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            {/* 確認提醒畫面 */}
            <div className="space-y-4 py-4">
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800">人數變更提醒</p>
                  <p className="text-amber-700 mt-1">
                    目前總人數（{totalParticipants} 人）將使用「{matchedTier?.participants} 人」檻次的報價。
                  </p>
                  <p className="text-amber-700 mt-1">
                    確認後，報價單檻次表將以 <strong>{totalParticipants} 人</strong> 作為第一個檻次。
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConfirmation(false)}>
                返回修改
              </Button>
              <Button
                onClick={handleFinalConfirm}
                className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
              >
                確認更新
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
