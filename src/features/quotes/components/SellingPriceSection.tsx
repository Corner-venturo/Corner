'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  ParticipantCounts,
  SellingPrices,
  IdentityCosts,
  IdentityProfits,
  AccommodationSummaryItem,
  TierPricing,
  CostCategory,
} from '../types'
import {
  normalizeNumber,
  getRoomTypeCost,
  getRoomTypeProfit,
} from '../utils/priceCalculations'
import { PriceInputRow } from './PriceInputRow'
import { PriceSummaryCard } from './PriceSummaryCard'
import { ParticipantCountEditor } from './ParticipantCountEditor'

interface SellingPriceSectionProps {
  participantCounts: ParticipantCounts
  identityCosts: IdentityCosts
  sellingPrices: SellingPrices
  setSellingPrices: React.Dispatch<React.SetStateAction<SellingPrices>>
  identityProfits: IdentityProfits
  isReadOnly: boolean
  handleGenerateQuotation: (
    tierParticipantCounts?: ParticipantCounts,
    tierSellingPrices?: SellingPrices,
    tierLabel?: string,
    allTierPricings?: Array<{
      participant_count: number
      selling_prices: {
        adult: number
        child_with_bed: number
        child_no_bed: number
        single_room: number
        infant: number
      }
    }>
  ) => void
  accommodationSummary: AccommodationSummaryItem[]
  categories: CostCategory[]
  tierPricings?: TierPricing[]
  setTierPricings?: React.Dispatch<React.SetStateAction<TierPricing[]>>
}

export const SellingPriceSection: React.FC<SellingPriceSectionProps> = ({
  participantCounts,
  identityCosts,
  sellingPrices,
  setSellingPrices,
  identityProfits,
  isReadOnly,
  handleGenerateQuotation,
  accommodationSummary,
  categories,
  tierPricings: externalTierPricings,
  setTierPricings: externalSetTierPricings,
}) => {
  const [localTierPricings, setLocalTierPricings] = useState<TierPricing[]>([])
  const tierPricings = externalTierPricings ?? localTierPricings
  const setTierPricings = externalSetTierPricings ?? setLocalTierPricings

  const handlePriceChange = (identity: keyof SellingPrices, value: string) => {
    const normalized = normalizeNumber(value)
    setSellingPrices(prev => ({ ...prev, [identity]: Number(normalized) || 0 }))
  }

  const handleRoomTypePriceChange = (roomName: string, type: 'adult' | 'child', value: string) => {
    const normalized = normalizeNumber(value)
    setSellingPrices(prev => ({
      ...prev,
      room_types: {
        ...(prev.room_types || {}),
        [roomName]: {
          ...(prev.room_types?.[roomName] || { adult: 0, child: 0 }),
          [type]: Number(normalized) || 0,
        },
      },
    }))
  }

  const handleTierPriceChange = (tierId: string, identity: keyof SellingPrices, value: string) => {
    const normalized = normalizeNumber(value)
    setTierPricings(prev =>
      prev.map(tier => {
        if (tier.id !== tierId) return tier
        const newPrice = Number(normalized) || 0
        return {
          ...tier,
          selling_prices: { ...tier.selling_prices, [identity]: newPrice },
          identity_profits: {
            ...tier.identity_profits,
            [identity]: newPrice - tier.identity_costs[identity as keyof IdentityCosts],
          },
        }
      })
    )
  }

  const handleRemoveTier = (id: string) => {
    setTierPricings(prev => prev.filter(tier => tier.id !== id))
  }

  const handleAddTier = (tier: TierPricing) => {
    setTierPricings(prev => [...prev, tier])
  }

  return (
    <div className="lg:col-span-3 space-y-3 lg:sticky lg:top-0 lg:self-start lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:pr-2 lg:scrollbar-thin">
      {/* 產生報價單按鈕 */}
      <Button
        onClick={() => {
          const tierPricingsData = tierPricings.map(tier => ({
            participant_count: tier.participant_count,
            selling_prices: tier.selling_prices,
          }))
          handleGenerateQuotation(undefined, undefined, undefined, tierPricingsData)
        }}
        className="w-full h-9 text-sm bg-morandi-secondary hover:bg-morandi-secondary/90 text-white"
        title="產生報價單預覽"
        type="button"
      >
        產生報價單
      </Button>

      {/* 主要售價表格 */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-morandi-container/60">
            <tr>
              <th className="text-left py-3 px-4 text-sm font-medium text-morandi-secondary">
                身份
              </th>
              <th className="text-center py-3 px-4 text-sm font-medium text-morandi-secondary">
                成本
              </th>
              <th className="text-center py-3 px-4 text-sm font-medium text-morandi-secondary">
                售價
              </th>
              <th className="text-center py-3 px-4 text-sm font-medium text-morandi-secondary">
                利潤
              </th>
            </tr>
          </thead>
          <tbody>
            <PriceInputRow
              label="單人房"
              cost={identityCosts.single_room}
              sellingPrice={sellingPrices.single_room}
              profit={identityProfits.single_room}
              onPriceChange={value => handlePriceChange('single_room', value)}
              isReadOnly={isReadOnly}
            />
            <PriceInputRow
              label="成人"
              cost={identityCosts.adult}
              sellingPrice={sellingPrices.adult}
              profit={identityProfits.adult}
              onPriceChange={value => handlePriceChange('adult', value)}
              isReadOnly={isReadOnly}
            />
            <PriceInputRow
              label="小孩"
              cost={identityCosts.child_with_bed}
              sellingPrice={sellingPrices.child_with_bed}
              profit={identityProfits.child_with_bed}
              onPriceChange={value => handlePriceChange('child_with_bed', value)}
              isReadOnly={isReadOnly}
            />
            <PriceInputRow
              label="不佔床"
              cost={identityCosts.child_no_bed}
              sellingPrice={sellingPrices.child_no_bed}
              profit={identityProfits.child_no_bed}
              onPriceChange={value => handlePriceChange('child_no_bed', value)}
              isReadOnly={isReadOnly}
            />
            <PriceInputRow
              label="嬰兒"
              cost={identityCosts.infant}
              sellingPrice={sellingPrices.infant}
              profit={identityProfits.infant}
              onPriceChange={value => handlePriceChange('infant', value)}
              isReadOnly={isReadOnly}
            />

            {/* 動態房型 */}
            {accommodationSummary.length > 1 &&
              accommodationSummary.slice(1).map(room => (
                <React.Fragment key={room.name}>
                  <tr className="border-b border-morandi-container/60">
                    <td colSpan={4} className="py-2 px-3 text-xs font-medium text-morandi-secondary">
                      {room.name}
                    </td>
                  </tr>
                  <PriceInputRow
                    label="成人"
                    cost={getRoomTypeCost(room.name, 'adult', accommodationSummary, identityCosts)}
                    sellingPrice={sellingPrices.room_types?.[room.name]?.adult || 0}
                    profit={getRoomTypeProfit(
                      room.name,
                      'adult',
                      sellingPrices,
                      accommodationSummary,
                      identityCosts
                    )}
                    onPriceChange={value => handleRoomTypePriceChange(room.name, 'adult', value)}
                    isReadOnly={isReadOnly}
                    indented
                  />
                  <PriceInputRow
                    label="小孩"
                    cost={getRoomTypeCost(room.name, 'child', accommodationSummary, identityCosts)}
                    sellingPrice={sellingPrices.room_types?.[room.name]?.child || 0}
                    profit={getRoomTypeProfit(
                      room.name,
                      'child',
                      sellingPrices,
                      accommodationSummary,
                      identityCosts
                    )}
                    onPriceChange={value => handleRoomTypePriceChange(room.name, 'child', value)}
                    isReadOnly={isReadOnly}
                    indented
                  />
                </React.Fragment>
              ))}
          </tbody>
        </table>
      </div>

      {/* 新增檻次表 */}
      {!isReadOnly && (
        <ParticipantCountEditor
          participantCounts={participantCounts}
          sellingPrices={sellingPrices}
          categories={categories}
          onAddTier={handleAddTier}
        />
      )}

      {/* 檻次表列表 */}
      {tierPricings.map(tier => (
        <PriceSummaryCard
          key={tier.id}
          tier={tier}
          isReadOnly={isReadOnly}
          onPriceChange={(identity, value) => handleTierPriceChange(tier.id, identity, value)}
          onRemove={() => handleRemoveTier(tier.id)}
          onGenerateQuotation={() => {
            const tierLabel = `檻次報價 - ${tier.participant_count} 人`
            handleGenerateQuotation(tier.participant_counts, tier.selling_prices, tierLabel)
          }}
        />
      ))}
    </div>
  )
}
