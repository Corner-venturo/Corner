import { useMemo } from 'react';
import { CostCategory, ParticipantCounts, SellingPrices, IdentityCosts, IdentityProfits, AccommodationSummaryItem, CostItem } from '../types';

interface UseQuoteCalculationsProps {
  categories: CostCategory[];
  participantCounts: ParticipantCounts;
  sellingPrices: SellingPrices;
}

export const useQuoteCalculations = ({
  categories,
  participantCounts,
  sellingPrices
}: UseQuoteCalculationsProps) => {

  // 計算住宿的房型位置平均費用
  const accommodationSummary = useMemo<AccommodationSummaryItem[]>(() => {
    const accommodationCategory = categories.find(cat => cat.id === 'accommodation');
    if (!accommodationCategory || accommodationCategory.items.length === 0) return [];

    const accommodationItems = accommodationCategory.items.filter(item => item.day !== undefined);
    const groupedByDay: Record<number, CostItem[]> = {};

    // 按天分組
    accommodationItems.forEach(item => {
      const day = item.day!;
      if (!groupedByDay[day]) groupedByDay[day] = [];
      groupedByDay[day].push(item);
    });

    const days = Object.keys(groupedByDay).map(d => Number(d)).sort((a, b) => a - b);
    if (days.length === 0) return [];

    // 找出最大房型數量
    const maxRoomTypes = Math.max(...days.map(day => groupedByDay[day].length));
    const roomTypeSummaries: AccommodationSummaryItem[] = [];

    // 按房型位置計算
    for (let roomIndex = 0; roomIndex < maxRoomTypes; roomIndex++) {
      let total_cost = 0;
      let roomTypeName = '';
      let validDays = 0;

      days.forEach(day => {
        const dayItems = groupedByDay[day];
        if (dayItems[roomIndex]) {
          total_cost += dayItems[roomIndex].total;
          validDays++;
          if (!roomTypeName && dayItems[roomIndex].name) {
            roomTypeName = dayItems[roomIndex].name;
          }
        }
      });

      if (validDays > 0) {
        roomTypeSummaries.push({
          name: roomTypeName || `房型${roomIndex + 1}`,
          total_cost,
          averageCost: total_cost / validDays,
          days: validDays
        });
      }
    }

    return roomTypeSummaries;
  }, [categories]);

  // 住宿總成本 = 房型一總成本 + 房型二總成本 + ...
  const accommodationTotal = useMemo(() =>
    accommodationSummary.reduce((sum, room) => sum + room.total_cost, 0)
  , [accommodationSummary]);

  // 更新住宿分類的總計為房型加總
  const updatedCategories = useMemo(() =>
    categories.map(cat => {
      if (cat.id === 'accommodation') {
        return { ...cat, total: accommodationTotal };
      }
      return cat;
    })
  , [categories, accommodationTotal]);

  // 計算各身份的總成本
  const identityCosts = useMemo<IdentityCosts>(() => {
    const costs: IdentityCosts = {
      adult: 0,
      child_with_bed: 0,
      child_no_bed: 0,
      single_room: 0,
      infant: 0
    };

    updatedCategories.forEach(category => {
      category.items.forEach(item => {
        if (category.id === 'transport') {
          // 交通類別：依照項目名稱區分身份
          if (item.name === '成人機票') {
            // 成人機票：只加給成人和單人房
            costs.adult += (item.adult_price || 0);
            costs.single_room += (item.adult_price || 0);
          } else if (item.name === '小孩機票') {
            // 小孩機票：只加給小孩（佔床、不佔床）
            costs.child_with_bed += (item.child_price || 0);
            costs.child_no_bed += (item.child_price || 0);
          } else if (item.name === '嬰兒機票') {
            // 嬰兒機票：只加給嬰兒
            costs.infant += (item.infant_price || 0);
          } else {
            // 其他交通費用（遊覽車等統一價）：成人、小孩佔床、單人房
            const itemCost = item.unit_price || 0;
            costs.adult += itemCost;
            costs.child_with_bed += itemCost;
            costs.single_room += itemCost;
            // 不佔床和嬰兒不含一般交通
          }
        } else if (category.id === 'accommodation') {
          // 住宿：成人和小朋友佔床是÷2，單人房是全額
          const roomPrice = item.unit_price || 0;
          costs.adult += Math.ceil(roomPrice / 2);
          costs.child_with_bed += Math.ceil(roomPrice / 2);
          // 不佔床不含住宿
          costs.single_room += roomPrice; // 單人房全額
          // 嬰兒不含住宿
        } else if (category.id === 'meals' || category.id === 'activities' || category.id === 'others') {
          // 餐飲、活動、其他：成人、小朋友佔床、單人房有，不佔床和嬰兒沒有
          const itemCost = item.unit_price || 0;
          costs.adult += itemCost;
          costs.child_with_bed += itemCost;
          // 不佔床不含餐飲和活動
          costs.single_room += itemCost;
          // 嬰兒不含餐飲和活動
        } else if (category.id === 'group-transport' || category.id === 'guide') {
          // 團體分攤、領隊導遊：不含嬰兒的身份分攤
          const itemCost = item.total || 0;
          costs.adult += itemCost;
          costs.child_with_bed += itemCost;
          costs.child_no_bed += itemCost;
          costs.single_room += itemCost;
          // 嬰兒不分攤導遊費用
        }
      });
    });

    return costs;
  }, [updatedCategories]);

  // 計算總成本（每個身份成本 × 人數）
  const total_cost = useMemo(() =>
    identityCosts.adult * participantCounts.adult +
    identityCosts.child_with_bed * participantCounts.child_with_bed +
    identityCosts.child_no_bed * participantCounts.child_no_bed +
    identityCosts.single_room * participantCounts.single_room +
    identityCosts.infant * participantCounts.infant
  , [identityCosts, participantCounts]);

  // 計算各身份的利潤
  const identityProfits = useMemo<IdentityProfits>(() => ({
    adult: sellingPrices.adult - identityCosts.adult,
    child_with_bed: sellingPrices.child_with_bed - identityCosts.child_with_bed,
    child_no_bed: sellingPrices.child_no_bed - identityCosts.child_no_bed,
    single_room: sellingPrices.single_room - identityCosts.single_room,
    infant: sellingPrices.infant - identityCosts.infant
  }), [sellingPrices, identityCosts]);

  return {
    accommodationSummary,
    accommodationTotal,
    updatedCategories,
    identityCosts,
    identityProfits,
    total_cost
  };
};
