import React from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  ParticipantCounts,
  SellingPrices,
  IdentityCosts,
  IdentityProfits,
  AccommodationSummaryItem,
} from '../types'

interface SellingPriceSectionProps {
  participantCounts: ParticipantCounts
  identityCosts: IdentityCosts
  sellingPrices: SellingPrices
  setSellingPrices: React.Dispatch<React.SetStateAction<SellingPrices>>
  identityProfits: IdentityProfits
  isReadOnly: boolean
  handleGenerateQuotation: () => void
  accommodationSummary: AccommodationSummaryItem[]
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
}) => {
  // 全形轉半形數字
  const normalizeNumber = (value: string): string => {
    return value.replace(/[０-９]/g, char => String.fromCharCode(char.charCodeAt(0) - 0xfee0))
  }

  const handlePriceChange = (identity: keyof SellingPrices, value: string) => {
    const normalized = normalizeNumber(value)
    setSellingPrices(prev => ({ ...prev, [identity]: Number(normalized) || 0 }))
  }

  // 處理房型價格變更
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

  // 取得房型的成本（目標房型住宿 + 其他所有費用）
  const getRoomTypeCost = (roomName: string, type: 'adult' | 'child'): number => {
    const room = accommodationSummary.find(r => r.name === roomName)
    if (!room) return 0

    // 目標房型的住宿費（所有天數加總，已經除過人數）
    const targetRoomCost = Math.ceil(room.total_cost)

    // 基礎成本（identityCosts 已包含：機票、交通、房型1住宿、餐飲、活動、團體分攤、領隊導遊）
    const baseCost = type === 'adult' ? identityCosts.adult : identityCosts.child_with_bed

    // 取得第一個房型的住宿費
    const firstRoom = accommodationSummary[0]
    const firstRoomCost = firstRoom ? Math.ceil(firstRoom.total_cost) : 0

    // 替換住宿費：基礎成本 - 房型1住宿 + 目標房型住宿
    return baseCost - firstRoomCost + targetRoomCost
  }

  // 取得房型的售價
  const getRoomTypePrice = (roomName: string, type: 'adult' | 'child'): number => {
    return sellingPrices.room_types?.[roomName]?.[type] || 0
  }

  // 計算房型的利潤
  const getRoomTypeProfit = (roomName: string, type: 'adult' | 'child'): number => {
    const cost = getRoomTypeCost(roomName, type)
    const price = getRoomTypePrice(roomName, type)
    return price - cost
  }

  return (
    <div className="lg:col-span-3 space-y-3">
      {/* 產生報價單按鈕 */}
      <Button
        onClick={handleGenerateQuotation}
        className="w-full h-9 text-sm bg-morandi-secondary hover:bg-morandi-secondary/90 text-white"
        title="產生報價單預覽"
        type="button"
      >
        產生報價單
      </Button>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm sticky top-6">
        <table className="w-full text-sm">
          <thead className="bg-morandi-container/40 border-b border-border/60">
            <tr>
              <th className="text-left py-3 px-4 text-sm font-medium text-morandi-primary border-r border-border">
                身份
              </th>
              <th className="text-center py-3 px-4 text-sm font-medium text-morandi-primary border-r border-border">
                成本
              </th>
              <th className="text-center py-3 px-4 text-sm font-medium text-morandi-primary border-r border-border">
                售價
              </th>
              <th className="text-center py-3 px-4 text-sm font-medium text-morandi-primary">
                利潤
              </th>
            </tr>
          </thead>
          <tbody>
            {/* 單人房 */}
            <tr className="border-b border-border">
              <td className="py-2 px-3 text-xs font-medium text-morandi-primary border-r border-border">
                單人房
              </td>
              <td className="py-2 px-2 text-center text-xs text-morandi-primary border-r border-border">
                {identityCosts.single_room.toLocaleString()}
              </td>
              <td className="py-2 px-2 text-center border-r border-border">
                <input
                  type="number"
                  value={sellingPrices.single_room || ''}
                  onChange={e => handlePriceChange('single_room', e.target.value)}
                  disabled={isReadOnly}
                  className={cn(
                    'w-full px-1 py-1 text-sm text-center bg-transparent border-0 focus:outline-none focus:bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
                    isReadOnly && 'cursor-not-allowed opacity-60'
                  )}
                />
              </td>
              <td
                className={cn(
                  'py-2 px-2 text-center text-xs font-medium',
                  identityProfits.single_room >= 0 ? 'text-morandi-green' : 'text-morandi-red'
                )}
              >
                {identityProfits.single_room.toLocaleString()}
              </td>
            </tr>

            {/* 成人 */}
            <tr className="border-b border-border">
              <td className="py-2 px-3 text-xs font-medium text-morandi-primary border-r border-border">
                成人
              </td>
              <td className="py-2 px-2 text-center text-xs text-morandi-primary border-r border-border">
                {identityCosts.adult.toLocaleString()}
              </td>
              <td className="py-2 px-2 text-center border-r border-border">
                <input
                  type="number"
                  value={sellingPrices.adult || ''}
                  onChange={e => handlePriceChange('adult', e.target.value)}
                  disabled={isReadOnly}
                  className={cn(
                    'w-full px-1 py-1 text-sm text-center bg-transparent border-0 focus:outline-none focus:bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
                    isReadOnly && 'cursor-not-allowed opacity-60'
                  )}
                />
              </td>
              <td
                className={cn(
                  'py-2 px-2 text-center text-xs font-medium',
                  identityProfits.adult >= 0 ? 'text-morandi-green' : 'text-morandi-red'
                )}
              >
                {identityProfits.adult.toLocaleString()}
              </td>
            </tr>

            {/* 小孩（佔床） */}
            <tr className="border-b border-border">
              <td className="py-2 px-3 text-xs font-medium text-morandi-primary border-r border-border">
                小孩
              </td>
              <td className="py-2 px-2 text-center text-xs text-morandi-primary border-r border-border">
                {identityCosts.child_with_bed.toLocaleString()}
              </td>
              <td className="py-2 px-2 text-center border-r border-border">
                <input
                  type="number"
                  value={sellingPrices.child_with_bed || ''}
                  onChange={e => handlePriceChange('child_with_bed', e.target.value)}
                  disabled={isReadOnly}
                  className={cn(
                    'w-full px-1 py-1 text-sm text-center bg-transparent border-0 focus:outline-none focus:bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
                    isReadOnly && 'cursor-not-allowed opacity-60'
                  )}
                />
              </td>
              <td
                className={cn(
                  'py-2 px-2 text-center text-xs font-medium',
                  identityProfits.child_with_bed >= 0 ? 'text-morandi-green' : 'text-morandi-red'
                )}
              >
                {identityProfits.child_with_bed.toLocaleString()}
              </td>
            </tr>

            {/* 不佔床 */}
            <tr className="border-b border-border">
              <td className="py-2 px-3 text-xs font-medium text-morandi-primary border-r border-border">
                不佔床
              </td>
              <td className="py-2 px-2 text-center text-xs text-morandi-primary border-r border-border">
                {identityCosts.child_no_bed.toLocaleString()}
              </td>
              <td className="py-2 px-2 text-center border-r border-border">
                <input
                  type="number"
                  value={sellingPrices.child_no_bed || ''}
                  onChange={e => handlePriceChange('child_no_bed', e.target.value)}
                  disabled={isReadOnly}
                  className={cn(
                    'w-full px-1 py-1 text-sm text-center bg-transparent border-0 focus:outline-none focus:bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
                    isReadOnly && 'cursor-not-allowed opacity-60'
                  )}
                />
              </td>
              <td
                className={cn(
                  'py-2 px-2 text-center text-xs font-medium',
                  identityProfits.child_no_bed >= 0 ? 'text-morandi-green' : 'text-morandi-red'
                )}
              >
                {identityProfits.child_no_bed.toLocaleString()}
              </td>
            </tr>

            {/* 嬰兒 */}
            <tr>
              <td className="py-2 px-3 text-xs font-medium text-morandi-primary border-r border-border">
                嬰兒
              </td>
              <td className="py-2 px-2 text-center text-xs text-morandi-primary border-r border-border">
                {identityCosts.infant.toLocaleString()}
              </td>
              <td className="py-2 px-2 text-center border-r border-border">
                <input
                  type="number"
                  value={sellingPrices.infant || ''}
                  onChange={e => handlePriceChange('infant', e.target.value)}
                  disabled={isReadOnly}
                  className={cn(
                    'w-full px-1 py-1 text-sm text-center bg-transparent border-0 focus:outline-none focus:bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
                    isReadOnly && 'cursor-not-allowed opacity-60'
                  )}
                />
              </td>
              <td
                className={cn(
                  'py-2 px-2 text-center text-xs font-medium',
                  identityProfits.infant >= 0 ? 'text-morandi-green' : 'text-morandi-red'
                )}
              >
                {identityProfits.infant.toLocaleString()}
              </td>
            </tr>

            {/* 動態房型 - 只顯示第二個房型之後的（第一個房型 = 預設的成人/小孩） */}
            {accommodationSummary.length > 1 &&
              accommodationSummary.slice(1).map(room => (
                <React.Fragment key={room.name}>
                  {/* 房型標題列 */}
                  <tr className="bg-morandi-container/20 border-b border-border/40">
                    <td colSpan={4} className="py-2 px-3 text-xs font-medium text-morandi-primary">
                      {room.name}
                    </td>
                  </tr>
                  {/* 房型-成人 */}
                  <tr className="border-b border-border">
                    <td className="py-2 px-3 text-xs font-medium text-morandi-primary border-r border-border pl-6">
                      成人
                    </td>
                    <td className="py-2 px-2 text-center text-xs text-morandi-primary border-r border-border">
                      {getRoomTypeCost(room.name, 'adult').toLocaleString()}
                    </td>
                    <td className="py-2 px-2 text-center border-r border-border">
                      <input
                        type="number"
                        value={getRoomTypePrice(room.name, 'adult') || ''}
                        onChange={e =>
                          handleRoomTypePriceChange(room.name, 'adult', e.target.value)
                        }
                        disabled={isReadOnly}
                        className={cn(
                          'w-full px-1 py-1 text-sm text-center bg-transparent border-0 focus:outline-none focus:bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
                          isReadOnly && 'cursor-not-allowed opacity-60'
                        )}
                      />
                    </td>
                    <td
                      className={cn(
                        'py-2 px-2 text-center text-xs font-medium',
                        getRoomTypeProfit(room.name, 'adult') >= 0
                          ? 'text-morandi-green'
                          : 'text-morandi-red'
                      )}
                    >
                      {getRoomTypeProfit(room.name, 'adult').toLocaleString()}
                    </td>
                  </tr>
                  {/* 房型-小孩 */}
                  <tr className="border-b border-border">
                    <td className="py-2 px-3 text-xs font-medium text-morandi-primary border-r border-border pl-6">
                      小孩
                    </td>
                    <td className="py-2 px-2 text-center text-xs text-morandi-primary border-r border-border">
                      {getRoomTypeCost(room.name, 'child').toLocaleString()}
                    </td>
                    <td className="py-2 px-2 text-center border-r border-border">
                      <input
                        type="number"
                        value={getRoomTypePrice(room.name, 'child') || ''}
                        onChange={e =>
                          handleRoomTypePriceChange(room.name, 'child', e.target.value)
                        }
                        disabled={isReadOnly}
                        className={cn(
                          'w-full px-1 py-1 text-sm text-center bg-transparent border-0 focus:outline-none focus:bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
                          isReadOnly && 'cursor-not-allowed opacity-60'
                        )}
                      />
                    </td>
                    <td
                      className={cn(
                        'py-2 px-2 text-center text-xs font-medium',
                        getRoomTypeProfit(room.name, 'child') >= 0
                          ? 'text-morandi-green'
                          : 'text-morandi-red'
                      )}
                    >
                      {getRoomTypeProfit(room.name, 'child').toLocaleString()}
                    </td>
                  </tr>
                </React.Fragment>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
