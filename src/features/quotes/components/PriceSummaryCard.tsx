'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { PriceInputRow } from './PriceInputRow'
import { TierPricing } from '../types'
import { CATEGORY_SECTION_LABELS, COST_ITEM_ROW_LABELS, PRICE_SUMMARY_CARD_LABELS } from '../constants/labels';

interface PriceSummaryCardProps {
  tier: TierPricing
  isReadOnly: boolean
  onPriceChange: (identity: keyof TierPricing['selling_prices'], value: string) => void
  onRemove: () => void
  onGenerateQuotation: () => void
}

export const PriceSummaryCard: React.FC<PriceSummaryCardProps> = ({
  tier,
  isReadOnly,
  onPriceChange,
  onRemove,
  onGenerateQuotation,
}) => {
  return (
    <div className="mt-3 bg-card border border-morandi-gold/30 rounded-xl overflow-hidden shadow-sm">
      {/* 檻次表標題 */}
      <div className="bg-morandi-gold/10 px-4 py-2 flex items-center justify-between border-b border-morandi-gold/30">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-morandi-primary">
            檻次報價 - {tier.participant_count} 人
          </span>
          <Button
            onClick={onGenerateQuotation}
            size="sm"
            className="h-7 text-xs bg-morandi-secondary hover:bg-morandi-secondary/90 text-white"
            type="button"
          >
            {PRICE_SUMMARY_CARD_LABELS.LABEL_6394}
          </Button>
        </div>
        {!isReadOnly && (
          <button
            onClick={onRemove}
            className="text-morandi-red hover:bg-morandi-red/10 p-1 rounded transition-colors"
            type="button"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* 檻次表內容 */}
      <table className="w-full text-sm">
        <thead className="bg-morandi-container/20 border-b border-border/60">
          <tr>
            <th className="text-left py-2 px-4 text-xs font-medium text-morandi-primary border-r border-border">
              {PRICE_SUMMARY_CARD_LABELS.LABEL_8725}
            </th>
            <th className="text-center py-2 px-4 text-xs font-medium text-morandi-primary border-r border-border">
              {PRICE_SUMMARY_CARD_LABELS.LABEL_7178}
            </th>
            <th className="text-center py-2 px-4 text-xs font-medium text-morandi-primary border-r border-border">
              {PRICE_SUMMARY_CARD_LABELS.LABEL_561}
            </th>
            <th className="text-center py-2 px-4 text-xs font-medium text-morandi-primary">{PRICE_SUMMARY_CARD_LABELS.LABEL_7705}</th>
          </tr>
        </thead>
        <tbody>
          <PriceInputRow
            label={PRICE_SUMMARY_CARD_LABELS.單人房}
            cost={tier.identity_costs.single_room}
            sellingPrice={tier.selling_prices.single_room}
            profit={tier.identity_profits.single_room}
            onPriceChange={value => onPriceChange('single_room', value)}
            isReadOnly={isReadOnly}
          />
          <PriceInputRow
            label={CATEGORY_SECTION_LABELS.成人}
            cost={tier.identity_costs.adult}
            sellingPrice={tier.selling_prices.adult}
            profit={tier.identity_profits.adult}
            onPriceChange={value => onPriceChange('adult', value)}
            isReadOnly={isReadOnly}
          />
          <PriceInputRow
            label={PRICE_SUMMARY_CARD_LABELS.小孩}
            cost={tier.identity_costs.child_with_bed}
            sellingPrice={tier.selling_prices.child_with_bed}
            profit={tier.identity_profits.child_with_bed}
            onPriceChange={value => onPriceChange('child_with_bed', value)}
            isReadOnly={isReadOnly}
          />
          <PriceInputRow
            label={PRICE_SUMMARY_CARD_LABELS.不佔床}
            cost={tier.identity_costs.child_no_bed}
            sellingPrice={tier.selling_prices.child_no_bed}
            profit={tier.identity_profits.child_no_bed}
            onPriceChange={value => onPriceChange('child_no_bed', value)}
            isReadOnly={isReadOnly}
          />
          <PriceInputRow
            label={COST_ITEM_ROW_LABELS.嬰兒}
            cost={tier.identity_costs.infant}
            sellingPrice={tier.selling_prices.infant}
            profit={tier.identity_profits.infant}
            onPriceChange={value => onPriceChange('infant', value)}
            isReadOnly={isReadOnly}
          />
        </tbody>
      </table>
    </div>
  )
}
