import { BaseService, StoreOperations } from '@/core/services/base.service';
import { Tour } from '@/stores/types';
import { useTourStore } from '@/stores';
import { ValidationError } from '@/core/errors/app-errors';

interface TourFinancialSummary {
  total_revenue: number;
  total_cost: number;
  profit: number;
  profitMargin: number;
}

class TourService extends BaseService<Tour> {
  protected resourceName = 'tours';

  protected getStore = (): StoreOperations<Tour> => {
    const store = useTourStore.getState();
    return {
      getAll: () => store.items,
      getById: (id: string) => store.items.find(t => t.id === id),
      add: async (tour: Tour) => {
        const result = await store.create(tour as any);
        return result || tour;
      },
      update: async (id: string, data: Partial<Tour>) => {
        await store.update(id, data);
      },
      delete: async (id: string) => {
        await store.delete(id);
      }
    };
  }

  protected validate(data: Partial<Tour>): void {
    super.validate(data);

    if (data.name && data.name.trim().length < 2) {
      throw new ValidationError('name', '旅遊團名稱至少需要 2 個字符');
    }

    if (data.max_participants && data.max_participants < 1) {
      throw new ValidationError('max_participants', '最大參與人數必須大於 0');
    }

    if (data.price && data.price < 0) {
      throw new ValidationError('price', '價格不能為負數');
    }

    // 移除過去日期驗證 - 允許建立歷史旅遊團資料
    // if (data.departure_date) {
    //   const depDate = new Date(data.departure_date);
    //   const today = new Date();
    //   today.setHours(0, 0, 0, 0);
    //   if (depDate < today) {
    //     throw new ValidationError('departure_date', '出發日期不能是過去的時間');
    //   }
    // }

    if (data.return_date && data.departure_date) {
      const depDate = new Date(data.departure_date);
      const retDate = new Date(data.return_date);

      if (retDate < depDate) {
        throw new ValidationError('return_date', '返回日期不能早於出發日期');
      }
    }
  }

  // 檢查團號是否已存在
  async isTourCodeExists(code: string): Promise<boolean> {
    const allTours = await this.list();
    return allTours.data.some(t => t.code === code);
  }

  /**
   * 生成團號
   * @param cityCode - 3碼城市代號 (如: TYO, BKK, OSA)
   * @param date - 出發日期
   * @param isSpecial - 是否為特殊團
   * @returns 團號 (格式: TYO250101001 或 SPC250101001)
   */
  async generateTourCode(cityCode: string, date: Date, isSpecial: boolean = false): Promise<string> {
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const dateStr = `${year}${month}${day}`;

    // 獲取當日已有的團號來生成流水號
    const allTours = await this.list();
    const todayTours = allTours.data.filter(t =>
      t.code && t.code.includes(dateStr)
    );

    // 找出最大的流水號並 +1，避免重複
    let maxSequence = 0;
    todayTours.forEach(tour => {
      const match = tour.code.match(/(\d{3})$/);
      if (match) {
        const seq = parseInt(match[1], 10);
        if (seq > maxSequence) maxSequence = seq;
      }
    });

    const sequence = (maxSequence + 1).toString().padStart(3, '0');
    const code = isSpecial
      ? `SPC${dateStr}${sequence}`
      : `${cityCode.toUpperCase()}${dateStr}${sequence}`;

    // 雙重檢查：確保生成的團號不存在
    const exists = await this.isTourCodeExists(code);
    if (exists) {
      // 如果仍然重複，使用時間戳確保唯一性
      const timestamp = Date.now().toString().slice(-3);
      return isSpecial
        ? `SPC${dateStr}${timestamp}`
        : `${cityCode.toUpperCase()}${dateStr}${timestamp}`;
    }

    return code;
  }

  // 計算團體財務摘要
  async calculateFinancialSummary(tour_id: string): Promise<TourFinancialSummary> {
    try {
      const tour = await this.getById(tour_id);
      if (!tour) {
        throw new Error('Tour not found');
      }

      // 這裡需要獲取相關訂單資料來計算
      // 目前先使用模擬邏輯
      const total_revenue = tour.price * ((tour as any).current_participants || 0);
      const estimatedCost = total_revenue * 0.7; // 假設成本為收入的70%
      const profit = total_revenue - estimatedCost;
      const profitMargin = total_revenue > 0 ? (profit / total_revenue) * 100 : 0;

      return {
        total_revenue,
        total_cost: estimatedCost,
        profit,
        profitMargin,
      };
    } catch (error) {
      throw error;
    }
  }

  // 檢查團體是否可以取消
  async canCancelTour(tour_id: string): Promise<{ canCancel: boolean; reason?: string }> {
    try {
      const tour = await this.getById(tour_id);
      if (!tour) {
        return { canCancel: false, reason: '找不到該旅遊團' };
      }

      // Tour 狀態是中文：'提案' | '進行中' | '待結案' | '結案' | '特殊團'
      if (tour.status === '結案') {
        return { canCancel: false, reason: '該旅遊團已經結案，無法取消' };
      }

      const departure_date = new Date(tour.departure_date);
      const now = new Date();
      const daysDiff = Math.ceil((departure_date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff < 3) {
        return { canCancel: false, reason: '出發前3天內無法取消' };
      }

      return { canCancel: true };
    } catch (error) {
      throw error;
    }
  }

  // 更新團體狀態
  async updateTourStatus(tour_id: string, newStatus: Tour['status'], reason?: string): Promise<Tour> {
    try {
      const tour = await this.getById(tour_id);
      if (!tour) {
        throw new Error('Tour not found');
      }

      // 狀態轉換驗證（暫時註解，因為狀態值是中文）
      // TODO: 實作中文狀態的轉換驗證邏輯

      return await this.update(tour_id, {
        status: newStatus,
        // 可以在這裡記錄狀態變更的原因和時間
        updated_at: this.now()
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * 取得或建立年度簽證專用團
   * @param year - 年份 (如: 2025)
   * @returns 簽證專用團
   */
  async getOrCreateVisaTour(year?: number): Promise<Tour> {
    const targetYear = year || new Date().getFullYear();
    const visaCode = `VISA${targetYear}001`;

    // 🔧 直接查詢 Supabase（包含已刪除的資料）
    try {
      if (typeof window !== 'undefined') {
        const { supabase } = await import('@/lib/supabase/client');
        const { data, error } = await supabase
          .from('tours')
          .select('*')
          .eq('code', visaCode)
          .maybeSingle();

        if (!error && data) {
          // 如果找到已刪除的簽證團，復原它
          if ((data as any)._deleted) {
            console.log(`🔄 [Visa Tour] 找到已刪除的簽證團，正在復原...`);
            const { data: updated, error: updateError } = await supabase
              .from('tours')
              .update({
                _deleted: false,
                _synced_at: null,
                updated_at: this.now()
              })
              .eq('id', data.id)
              .select()
              .single();

            if (!updateError && updated) {
              console.log(`✅ [Visa Tour] 簽證團已復原`);
              // 重新載入 tours
              const store = this.getStore();
              const tourStore = useTourStore.getState();
              await tourStore.fetchAll();
              return updated as Tour;
            }
          } else {
            // 找到且未被刪除，直接返回
            console.log(`✅ [Visa Tour] 找到現有簽證團`);
            return data as Tour;
          }
        }
      }
    } catch (error) {
      console.warn(`⚠️ [Visa Tour] Supabase 查詢失敗，繼續建立新的:`, error);
    }

    // 檢查本地 Store 是否有（未刪除的）
    const allTours = await this.list();
    const existingVisaTour = allTours.data.find(t => t.code === visaCode);
    if (existingVisaTour) {
      return existingVisaTour;
    }

    // 不存在則建立新的簽證專用團
    console.log(`📝 [Visa Tour] 建立新的簽證專用團...`);
    const today = new Date();
    const yearStart = new Date(targetYear, 0, 1);
    const departureDate = today > yearStart ? today : yearStart;

    const visaTour: Partial<Tour> = {
      code: visaCode,
      name: `${targetYear}年度簽證專用團`,
      departure_date: departureDate.toISOString().split('T')[0],
      return_date: `${targetYear}-12-31`,
      status: '特殊團',
      location: '簽證專用',
      price: 0,
      max_participants: 9999,
      contract_status: '未簽署',
      total_revenue: 0,
      total_cost: 0,
      profit: 0,
      created_at: this.now(),
      updated_at: this.now()
    } as any;

    return await this.create(visaTour as any);
  }

  /**
   * 取得所有非特殊團的旅遊團（用於行事曆顯示）
   * @returns 一般旅遊團列表
   */
  async listRegularTours() {
    const allTours = await this.list();
    return {
      ...allTours,
      data: allTours.data.filter(tour => tour.status !== '特殊團')
    };
  }
}

export const tourService = new TourService();