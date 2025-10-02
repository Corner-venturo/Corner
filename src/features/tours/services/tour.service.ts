import { BaseService, StoreOperations } from '@/core/services/base.service';
import { Tour } from '@/stores/types';
import { useTourStore } from '@/stores/tour-store';
import { ValidationError } from '@/core/errors/app-errors';

interface TourFinancialSummary {
  totalRevenue: number;
  totalCost: number;
  profit: number;
  profitMargin: number;
}

class TourService extends BaseService<Tour> {
  protected resourceName = 'tours';

  protected getStore(): StoreOperations<Tour> {
    const store = useTourStore.getState();
    return {
      getAll: () => store.tours,
      getById: (id: string) => store.tours.find(t => t.id === id),
      add: (tour: Tour) => {
        useTourStore.setState(state => ({
          tours: [...state.tours, tour]
        }));
      },
      update: (id: string, data: Partial<Tour>) => {
        useTourStore.setState(state => ({
          tours: state.tours.map(t => t.id === id ? { ...t, ...data } : t)
        }));
      },
      delete: (id: string) => {
        useTourStore.setState(state => ({
          tours: state.tours.filter(t => t.id !== id)
        }));
      }
    };
  }

  protected validate(data: Partial<Tour>): void {
    super.validate(data);

    if (data.name && data.name.trim().length < 2) {
      throw new ValidationError('name', '旅遊團名稱至少需要 2 個字符');
    }

    if (data.maxParticipants && data.maxParticipants < 1) {
      throw new ValidationError('maxParticipants', '最大參與人數必須大於 0');
    }

    if (data.price && data.price < 0) {
      throw new ValidationError('price', '價格不能為負數');
    }

    if (data.departureDate) {
      const depDate = new Date(data.departureDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (depDate < today) {
        throw new ValidationError('departureDate', '出發日期不能是過去的時間');
      }
    }

    if (data.returnDate && data.departureDate) {
      const depDate = new Date(data.departureDate);
      const retDate = new Date(data.returnDate);

      if (retDate < depDate) {
        throw new ValidationError('returnDate', '返回日期不能早於出發日期');
      }
    }
  }

  // 檢查團號是否已存在
  async isTourCodeExists(code: string): Promise<boolean> {
    const allTours = await this.list();
    return allTours.data.some(t => t.code === code);
  }

  // Tour 特有的業務邏輯
  async generateTourCode(location: string, date: Date, isSpecial: boolean = false): Promise<string> {
    const locationCode = this.getLocationCode(location);
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
      : `${locationCode}${dateStr}${sequence}`;

    // 雙重檢查：確保生成的團號不存在
    const exists = await this.isTourCodeExists(code);
    if (exists) {
      // 如果仍然重複，使用時間戳確保唯一性
      const timestamp = Date.now().toString().slice(-3);
      return isSpecial
        ? `SPC${dateStr}${timestamp}`
        : `${locationCode}${dateStr}${timestamp}`;
    }

    return code;
  }

  private getLocationCode(location: string): string {
    const codes: Record<string, string> = {
      'Tokyo': 'TYO',
      'Tokyo 東京': 'TYO',
      'Okinawa': 'OKA',
      'Okinawa 沖繩': 'OKA',
      'Osaka': 'OSA',
      'Osaka 大阪': 'OSA',
      'Kyoto': 'KYO',
      'Kyoto 京都': 'KYO',
      'Hokkaido': 'CTS',
      'Hokkaido 北海道': 'CTS',
      'Fukuoka': 'FUK',
      'Fukuoka 福岡': 'FUK',
    };

    // 找到匹配的位置代碼
    const matchedCode = Object.entries(codes).find(([key]) =>
      location.toLowerCase().includes(key.toLowerCase()) ||
      key.toLowerCase().includes(location.toLowerCase())
    );

    return matchedCode?.[1] || 'UNK';
  }

  // 計算團體財務摘要
  async calculateFinancialSummary(tourId: string): Promise<TourFinancialSummary> {
    try {
      const tour = await this.getById(tourId);
      if (!tour) {
        throw new Error('Tour not found');
      }

      // 這裡需要獲取相關訂單資料來計算
      // 目前先使用模擬邏輯
      const totalRevenue = tour.price * (tour.currentParticipants || 0);
      const estimatedCost = totalRevenue * 0.7; // 假設成本為收入的70%
      const profit = totalRevenue - estimatedCost;
      const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

      return {
        totalRevenue,
        totalCost: estimatedCost,
        profit,
        profitMargin,
      };
    } catch (error) {
      throw error;
    }
  }

  // 檢查團體是否可以取消
  async canCancelTour(tourId: string): Promise<{ canCancel: boolean; reason?: string }> {
    try {
      const tour = await this.getById(tourId);
      if (!tour) {
        return { canCancel: false, reason: '找不到該旅遊團' };
      }

      if (tour.status === 'cancelled') {
        return { canCancel: false, reason: '該旅遊團已經取消' };
      }

      if (tour.status === 'completed') {
        return { canCancel: false, reason: '該旅遊團已經完成，無法取消' };
      }

      const departureDate = new Date(tour.departureDate);
      const now = new Date();
      const daysDiff = Math.ceil((departureDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff < 3) {
        return { canCancel: false, reason: '出發前3天內無法取消' };
      }

      return { canCancel: true };
    } catch (error) {
      throw error;
    }
  }

  // 更新團體狀態
  async updateTourStatus(tourId: string, newStatus: Tour['status'], reason?: string): Promise<Tour> {
    try {
      const tour = await this.getById(tourId);
      if (!tour) {
        throw new Error('Tour not found');
      }

      // 狀態轉換驗證
      if (newStatus === 'cancelled') {
        const canCancel = await this.canCancelTour(tourId);
        if (!canCancel.canCancel) {
          throw new ValidationError('status', canCancel.reason || '無法取消該旅遊團');
        }
      }

      return await this.update(tourId, {
        status: newStatus,
        // 可以在這裡記錄狀態變更的原因和時間
        updatedAt: this.now()
      });
    } catch (error) {
      throw error;
    }
  }
}

export const tourService = new TourService();