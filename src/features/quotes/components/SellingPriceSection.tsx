import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ParticipantCounts, SellingPrices, IdentityCosts, IdentityProfits } from '../types';

interface SellingPriceSectionProps {
  participantCounts: ParticipantCounts;
  identityCosts: IdentityCosts;
  sellingPrices: SellingPrices;
  setSellingPrices: React.Dispatch<React.SetStateAction<SellingPrices>>;
  identityProfits: IdentityProfits;
  isReadOnly: boolean;
  handleGenerateQuotation: () => void;
}

export const SellingPriceSection: React.FC<SellingPriceSectionProps> = ({
  participantCounts,
  identityCosts,
  sellingPrices,
  setSellingPrices,
  identityProfits,
  isReadOnly,
  handleGenerateQuotation
}) => {
  // 全形轉半形數字
  const normalizeNumber = (value: string): string => {
    return value.replace(/[０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xFEE0));
  };

  const handlePriceChange = (identity: keyof SellingPrices, value: string) => {
    const normalized = normalizeNumber(value);
    setSellingPrices(prev => ({ ...prev, [identity]: Number(normalized) || 0 }));
  };

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

      <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm sticky top-6">
        <table className="w-full text-sm">
          <thead className="bg-morandi-container/40 border-b border-border/60">
            <tr>
              <th className="text-left py-3 px-4 text-sm font-medium text-morandi-primary border-r border-border">身份</th>
              <th className="text-center py-3 px-4 text-sm font-medium text-morandi-primary border-r border-border">成本</th>
              <th className="text-center py-3 px-4 text-sm font-medium text-morandi-primary border-r border-border">售價</th>
              <th className="text-center py-3 px-4 text-sm font-medium text-morandi-primary">利潤</th>
            </tr>
          </thead>
          <tbody>
            {/* 單人房 */}
            <tr className="border-b border-border">
              <td className="py-2 px-3 text-xs font-medium text-morandi-primary border-r border-border">
                單人房<br /><span className="text-[10px] text-morandi-secondary">({participantCounts.single_room}人)</span>
              </td>
              <td className="py-2 px-2 text-center text-xs text-morandi-primary border-r border-border">
                {identityCosts.single_room.toLocaleString()}
              </td>
              <td className="py-2 px-2 text-center border-r border-border">
                <input
                  type="number"
                  value={sellingPrices.single_room || ''}
                  onChange={(e) => handlePriceChange('single_room', e.target.value)}
                  disabled={isReadOnly}
                  className={cn("w-full px-1 py-1 text-sm text-center bg-transparent border-0 focus:outline-none focus:bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none", isReadOnly && "cursor-not-allowed opacity-60")}
                />
              </td>
              <td className={cn("py-2 px-2 text-center text-xs font-medium", identityProfits.single_room >= 0 ? "text-morandi-green" : "text-morandi-red")}>
                {identityProfits.single_room.toLocaleString()}
              </td>
            </tr>

            {/* 成人 */}
            <tr className="border-b border-border">
              <td className="py-2 px-3 text-xs font-medium text-morandi-primary border-r border-border">
                成人<br /><span className="text-[10px] text-morandi-secondary">({participantCounts.adult}人)</span>
              </td>
              <td className="py-2 px-2 text-center text-xs text-morandi-primary border-r border-border">
                {identityCosts.adult.toLocaleString()}
              </td>
              <td className="py-2 px-2 text-center border-r border-border">
                <input
                  type="number"
                  value={sellingPrices.adult || ''}
                  onChange={(e) => handlePriceChange('adult', e.target.value)}
                  disabled={isReadOnly}
                  className={cn("w-full px-1 py-1 text-sm text-center bg-transparent border-0 focus:outline-none focus:bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none", isReadOnly && "cursor-not-allowed opacity-60")}
                />
              </td>
              <td className={cn("py-2 px-2 text-center text-xs font-medium", identityProfits.adult >= 0 ? "text-morandi-green" : "text-morandi-red")}>
                {identityProfits.adult.toLocaleString()}
              </td>
            </tr>

            {/* 小孩（佔床） */}
            <tr className="border-b border-border">
              <td className="py-2 px-3 text-xs font-medium text-morandi-primary border-r border-border">
                小孩<br /><span className="text-[10px] text-morandi-secondary">({participantCounts.child_with_bed}人)</span>
              </td>
              <td className="py-2 px-2 text-center text-xs text-morandi-primary border-r border-border">
                {identityCosts.child_with_bed.toLocaleString()}
              </td>
              <td className="py-2 px-2 text-center border-r border-border">
                <input
                  type="number"
                  value={sellingPrices.child_with_bed || ''}
                  onChange={(e) => handlePriceChange('child_with_bed', e.target.value)}
                  disabled={isReadOnly}
                  className={cn("w-full px-1 py-1 text-sm text-center bg-transparent border-0 focus:outline-none focus:bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none", isReadOnly && "cursor-not-allowed opacity-60")}
                />
              </td>
              <td className={cn("py-2 px-2 text-center text-xs font-medium", identityProfits.child_with_bed >= 0 ? "text-morandi-green" : "text-morandi-red")}>
                {identityProfits.child_with_bed.toLocaleString()}
              </td>
            </tr>

            {/* 不佔床 */}
            <tr className="border-b border-border">
              <td className="py-2 px-3 text-xs font-medium text-morandi-primary border-r border-border">
                不佔床<br /><span className="text-[10px] text-morandi-secondary">({participantCounts.child_no_bed}人)</span>
              </td>
              <td className="py-2 px-2 text-center text-xs text-morandi-primary border-r border-border">
                {identityCosts.child_no_bed.toLocaleString()}
              </td>
              <td className="py-2 px-2 text-center border-r border-border">
                <input
                  type="number"
                  value={sellingPrices.child_no_bed || ''}
                  onChange={(e) => handlePriceChange('child_no_bed', e.target.value)}
                  disabled={isReadOnly}
                  className={cn("w-full px-1 py-1 text-sm text-center bg-transparent border-0 focus:outline-none focus:bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none", isReadOnly && "cursor-not-allowed opacity-60")}
                />
              </td>
              <td className={cn("py-2 px-2 text-center text-xs font-medium", identityProfits.child_no_bed >= 0 ? "text-morandi-green" : "text-morandi-red")}>
                {identityProfits.child_no_bed.toLocaleString()}
              </td>
            </tr>

            {/* 嬰兒 */}
            <tr>
              <td className="py-2 px-3 text-xs font-medium text-morandi-primary border-r border-border">
                嬰兒<br /><span className="text-[10px] text-morandi-secondary">({participantCounts.infant}人)</span>
              </td>
              <td className="py-2 px-2 text-center text-xs text-morandi-primary border-r border-border">
                {identityCosts.infant.toLocaleString()}
              </td>
              <td className="py-2 px-2 text-center border-r border-border">
                <input
                  type="number"
                  value={sellingPrices.infant || ''}
                  onChange={(e) => handlePriceChange('infant', e.target.value)}
                  disabled={isReadOnly}
                  className={cn("w-full px-1 py-1 text-sm text-center bg-transparent border-0 focus:outline-none focus:bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none", isReadOnly && "cursor-not-allowed opacity-60")}
                />
              </td>
              <td className={cn("py-2 px-2 text-center text-xs font-medium", identityProfits.infant >= 0 ? "text-morandi-green" : "text-morandi-red")}>
                {identityProfits.infant.toLocaleString()}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
