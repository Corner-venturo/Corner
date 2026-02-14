'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus } from 'lucide-react'
import { alert } from '@/lib/ui/alert-dialog'
import { ParticipantCounts, SellingPrices, TierPricing, CostCategory } from '../types'
import {
  normalizeNumber,
  calculateTierParticipantCounts,
  calculateTierCosts,
  generateUniqueId,
  calculateIdentityProfits,
} from '../utils/priceCalculations'
import { PARTICIPANT_COUNT_EDITOR_LABELS } from '../constants/labels';

interface ParticipantCountEditorProps {
  participantCounts: ParticipantCounts
  sellingPrices: SellingPrices
  categories: CostCategory[]
  onAddTier: (tier: TierPricing) => void
}

export const ParticipantCountEditor: React.FC<ParticipantCountEditorProps> = ({
  participantCounts,
  sellingPrices,
  categories,
  onAddTier,
}) => {
  const [newTierCount, setNewTierCount] = useState<string>('')

  const handleAddTier = () => {
    const count = Number(newTierCount)
    if (!count || count <= 0) {
      void alert(PARTICIPANT_COUNT_EDITOR_LABELS.請輸入有效的人數, 'warning')
      return
    }

    // 計算新的人數分布（保持原始比例）
    const newCounts = calculateTierParticipantCounts(count, participantCounts)

    // 計算新的成本（傳入原始人數用於還原團體費用）
    const newCosts = calculateTierCosts(categories, newCounts, participantCounts)

    // 建立新的檻次表
    const newTier: TierPricing = {
      id: generateUniqueId(),
      participant_count: count,
      participant_counts: newCounts,
      identity_costs: newCosts,
      selling_prices: { ...sellingPrices }, // 複製原始售價
      identity_profits: calculateIdentityProfits(sellingPrices, newCosts),
    }

    onAddTier(newTier)
    setNewTierCount('')
  }

  const handleInputChange = (value: string) => {
    const normalized = normalizeNumber(value)
    setNewTierCount(normalized)
  }

  return (
    <div className="mt-3 space-y-2">
      <div className="flex gap-2">
        <Input
          type="text"
          inputMode="decimal"
          value={newTierCount}
          onChange={e => handleInputChange(e.target.value)}
          placeholder={PARTICIPANT_COUNT_EDITOR_LABELS.輸入人數_如_20_30_40}
          className="flex-1 h-9 text-sm"
          onKeyDown={e => {
            if (e.key === 'Enter') handleAddTier()
          }}
        />
        <Button
          onClick={handleAddTier}
          size="sm"
          className="h-9 bg-morandi-gold hover:bg-morandi-gold-hover text-white"
          type="button"
        >
          <Plus size={16} className="mr-1" />
          {PARTICIPANT_COUNT_EDITOR_LABELS.ADD_4134}
        </Button>
      </div>
    </div>
  )
}
