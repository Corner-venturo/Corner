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
}

export const SellingPriceSection: React.FC<SellingPriceSectionProps> = ({
  participantCounts,
  identityCosts,
  sellingPrices,
  setSellingPrices,
  identityProfits,
  isReadOnly
}) => {
  return (
    <div className="lg:col-span-3">
      <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm sticky top-6">
        <div className="px-4 py-3 border-b border-border bg-morandi-container/50">
          <h3 className="font-medium text-morandi-primary">價格總覽</h3>
        </div>

        <table className="w-full text-xs">
          <tbody>
            {/* 成人 */}
            {participantCounts.adult > 0 && (
              <>
                <tr className="border-b-2 border-morandi-gold/20 bg-morandi-container/20">
                  <td colSpan={2} className="py-2 px-4 font-medium text-morandi-primary">
                    成人 ({participantCounts.adult}人)
                  </td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-1 px-4 text-morandi-secondary">成本</td>
                  <td className="py-1 px-4 text-right text-morandi-primary">
                    {identityCosts.adult.toLocaleString()}
                  </td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-1 px-4 text-morandi-secondary">售價</td>
                  <td className="py-1 px-4 text-right">
                    <input
                      type="number"
                      value={sellingPrices.adult || ''}
                      onChange={(e) => setSellingPrices(prev => ({ ...prev, adult: Number(e.target.value) || 0 }))}
                      disabled={isReadOnly}
                      className={cn("w-full px-2 py-1 text-xs text-right border border-border rounded", isReadOnly && "cursor-not-allowed opacity-60")}
                    />
                  </td>
                </tr>
                <tr className="border-b border-border bg-morandi-container/10">
                  <td className="py-1 px-4 text-morandi-secondary">利潤</td>
                  <td className={cn("py-1 px-4 text-right font-medium", identityProfits.adult >= 0 ? "text-morandi-green" : "text-morandi-red")}>
                    {identityProfits.adult.toLocaleString()}
                  </td>
                </tr>
              </>
            )}

            {/* 小朋友（佔床） */}
            {participantCounts.child_with_bed > 0 && (
              <>
                <tr className="border-b-2 border-morandi-gold/20 bg-morandi-container/20">
                  <td colSpan={2} className="py-2 px-4 font-medium text-morandi-primary">
                    小朋友（佔床） ({participantCounts.child_with_bed}人)
                  </td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-1 px-4 text-morandi-secondary">成本</td>
                  <td className="py-1 px-4 text-right text-morandi-primary">
                    {identityCosts.child_with_bed.toLocaleString()}
                  </td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-1 px-4 text-morandi-secondary">售價</td>
                  <td className="py-1 px-4 text-right">
                    <input
                      type="number"
                      value={sellingPrices.child_with_bed || ''}
                      onChange={(e) => setSellingPrices(prev => ({ ...prev, child_with_bed: Number(e.target.value) || 0 }))}
                      disabled={isReadOnly}
                      className={cn("w-full px-2 py-1 text-xs text-right border border-border rounded", isReadOnly && "cursor-not-allowed opacity-60")}
                    />
                  </td>
                </tr>
                <tr className="border-b border-border bg-morandi-container/10">
                  <td className="py-1 px-4 text-morandi-secondary">利潤</td>
                  <td className={cn("py-1 px-4 text-right font-medium", identityProfits.child_with_bed >= 0 ? "text-morandi-green" : "text-morandi-red")}>
                    {identityProfits.child_with_bed.toLocaleString()}
                  </td>
                </tr>
              </>
            )}

            {/* 不佔床 */}
            {participantCounts.child_no_bed > 0 && (
              <>
                <tr className="border-b-2 border-morandi-gold/20 bg-morandi-container/20">
                  <td colSpan={2} className="py-2 px-4 font-medium text-morandi-primary">
                    不佔床 ({participantCounts.child_no_bed}人)
                  </td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-1 px-4 text-morandi-secondary">成本</td>
                  <td className="py-1 px-4 text-right text-morandi-primary">
                    {identityCosts.child_no_bed.toLocaleString()}
                  </td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-1 px-4 text-morandi-secondary">售價</td>
                  <td className="py-1 px-4 text-right">
                    <input
                      type="number"
                      value={sellingPrices.child_no_bed || ''}
                      onChange={(e) => setSellingPrices(prev => ({ ...prev, child_no_bed: Number(e.target.value) || 0 }))}
                      disabled={isReadOnly}
                      className={cn("w-full px-2 py-1 text-xs text-right border border-border rounded", isReadOnly && "cursor-not-allowed opacity-60")}
                    />
                  </td>
                </tr>
                <tr className="border-b border-border bg-morandi-container/10">
                  <td className="py-1 px-4 text-morandi-secondary">利潤</td>
                  <td className={cn("py-1 px-4 text-right font-medium", identityProfits.child_no_bed >= 0 ? "text-morandi-green" : "text-morandi-red")}>
                    {identityProfits.child_no_bed.toLocaleString()}
                  </td>
                </tr>
              </>
            )}

            {/* 單人房 */}
            {participantCounts.single_room > 0 && (
              <>
                <tr className="border-b-2 border-morandi-gold/20 bg-morandi-container/20">
                  <td colSpan={2} className="py-2 px-4 font-medium text-morandi-primary">
                    單人房 ({participantCounts.single_room}人)
                  </td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-1 px-4 text-morandi-secondary">成本</td>
                  <td className="py-1 px-4 text-right text-morandi-primary">
                    {identityCosts.single_room.toLocaleString()}
                  </td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-1 px-4 text-morandi-secondary">售價</td>
                  <td className="py-1 px-4 text-right">
                    <input
                      type="number"
                      value={sellingPrices.single_room || ''}
                      onChange={(e) => setSellingPrices(prev => ({ ...prev, single_room: Number(e.target.value) || 0 }))}
                      disabled={isReadOnly}
                      className={cn("w-full px-2 py-1 text-xs text-right border border-border rounded", isReadOnly && "cursor-not-allowed opacity-60")}
                    />
                  </td>
                </tr>
                <tr className="border-b border-border bg-morandi-container/10">
                  <td className="py-1 px-4 text-morandi-secondary">利潤</td>
                  <td className={cn("py-1 px-4 text-right font-medium", identityProfits.single_room >= 0 ? "text-morandi-green" : "text-morandi-red")}>
                    {identityProfits.single_room.toLocaleString()}
                  </td>
                </tr>
              </>
            )}

            {/* 嬰兒 */}
            {participantCounts.infant > 0 && (
              <>
                <tr className="border-b-2 border-morandi-gold/20 bg-morandi-container/20">
                  <td colSpan={2} className="py-2 px-4 font-medium text-morandi-primary">
                    嬰兒 ({participantCounts.infant}人)
                  </td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-1 px-4 text-morandi-secondary">成本</td>
                  <td className="py-1 px-4 text-right text-morandi-primary">
                    {identityCosts.infant.toLocaleString()}
                  </td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-1 px-4 text-morandi-secondary">售價</td>
                  <td className="py-1 px-4 text-right">
                    <input
                      type="number"
                      value={sellingPrices.infant || ''}
                      onChange={(e) => setSellingPrices(prev => ({ ...prev, infant: Number(e.target.value) || 0 }))}
                      disabled={isReadOnly}
                      className={cn("w-full px-2 py-1 text-xs text-right border border-border rounded", isReadOnly && "cursor-not-allowed opacity-60")}
                    />
                  </td>
                </tr>
                <tr className="border-b border-border bg-morandi-container/10">
                  <td className="py-1 px-4 text-morandi-secondary">利潤</td>
                  <td className={cn("py-1 px-4 text-right font-medium", identityProfits.infant >= 0 ? "text-morandi-green" : "text-morandi-red")}>
                    {identityProfits.infant.toLocaleString()}
                  </td>
                </tr>
              </>
            )}
          </tbody>
        </table>

        <div className="p-4">
          <Button className="w-full bg-morandi-gold hover:bg-morandi-gold-hover text-white">
            產生報價單
          </Button>
        </div>
      </div>
    </div>
  );
};
