import { BaseService, StoreOperations } from '@/core/services/base.service'
import { Tour } from '@/stores/types'
import { logger } from '@/lib/utils/logger'
import { useTourStore } from '@/stores'
import { ValidationError } from '@/core/errors/app-errors'
import { generateTourCode as generateTourCodeUtil } from '@/stores/utils/code-generator'
import { getCurrentWorkspaceCode } from '@/lib/workspace-helpers'
import { getRequiredWorkspaceId } from '@/lib/workspace-context'
import { BaseEntity } from '@/core/types/common'

interface TourFinancialSummary {
  total_revenue: number
  total_cost: number
  profit: number
  profitMargin: number
}

class TourService extends BaseService<Tour & BaseEntity> {
  protected resourceName = 'tours'

  protected getStore = (): StoreOperations<Tour & BaseEntity> => {
    const store = useTourStore.getState()
    return {
      getAll: () => store.items as unknown as (Tour & BaseEntity)[],
      getById: (id: string) => store.items.find(t => t.id === id) as unknown as (Tour & BaseEntity) | undefined,
      add: async (tour: Tour & BaseEntity) => {
        // Type assertion needed due to Store CreateInput type requirements
        const result = await store.create(tour as unknown as Parameters<typeof store.create>[0])
        return (result || tour) as Tour & BaseEntity
      },
      update: async (id: string, data: Partial<Tour>) => {
        // Type assertion needed due to Store type compatibility
        await store.update(id, data as Parameters<typeof store.update>[1])
      },
      delete: async (id: string) => {
        await store.delete(id)
      },
    }
  }

  protected validate(data: Partial<Tour & BaseEntity>): void {
    super.validate(data)

    if (data.name && data.name.trim().length < 2) {
      throw new ValidationError('name', '旅遊團名稱至少需要 2 個字符')
    }

    if (data.max_participants && data.max_participants < 1) {
      throw new ValidationError('max_participants', '最大參與人數必須大於 0')
    }

    if (data.price && data.price < 0) {
      throw new ValidationError('price', '價格不能為負數')
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
      const depDate = new Date(data.departure_date)
      const retDate = new Date(data.return_date)

      if (retDate < depDate) {
        throw new ValidationError('return_date', '返回日期不能早於出發日期')
      }
    }
  }

  // 檢查團號是否已存在
  async isTourCodeExists(code: string): Promise<boolean> {
    const allTours = await this.list()
    return allTours.data.some(t => t.code === code)
  }

  /**
   * 生成團號
   * @param cityCode - 3碼城市代號 (如: CNX, BKK, OSA)
   * @param date - 出發日期
   * @param isSpecial - 是否為特殊團（目前未使用）
   * @returns 團號 (格式: CNX250128A)
   */
  async generateTourCode(
    cityCode: string,
    date: Date,
    isSpecial: boolean = false
  ): Promise<string> {
    // 取得當前 workspace code (用於向後相容，新格式不需要)
    const workspaceCode = getCurrentWorkspaceCode()
    if (!workspaceCode) {
      throw new Error('無法取得 workspace code，請重新登入')
    }

    // 獲取所有現有 tours
    const allTours = await this.list()

    // 使用統一的 code generator
    const code = generateTourCodeUtil(
      workspaceCode,
      cityCode.toUpperCase(),
      date.toISOString(),
      allTours.data
    )

    // 雙重檢查：確保生成的團號不存在
    const exists = await this.isTourCodeExists(code)
    if (exists) {
      // 如果仍然重複，嘗試下一個字母
      const dateStr = date.toISOString().split('T')[0].replace(/-/g, '').slice(2) // YYMMDD
      const lastChar = code.slice(-1)
      const nextChar = String.fromCharCode(lastChar.charCodeAt(0) + 1)
      return `${cityCode.toUpperCase()}${dateStr}${nextChar}`
    }

    return code
  }

  // 計算團體財務摘要
  async calculateFinancialSummary(tour_id: string): Promise<TourFinancialSummary> {
    try {
      const tour = await this.getById(tour_id)
      if (!tour) {
        throw new Error('Tour not found')
      }

      // 這裡需要獲取相關訂單資料來計算
      // 目前先使用模擬邏輯
      const total_revenue = (tour.price || 0) * (tour.current_participants || 0)
      const estimatedCost = total_revenue * 0.7 // 假設成本為收入的70%
      const profit = total_revenue - estimatedCost
      const profitMargin = total_revenue > 0 ? (profit / total_revenue) * 100 : 0

      return {
        total_revenue,
        total_cost: estimatedCost,
        profit,
        profitMargin,
      }
    } catch (error) {
      throw error
    }
  }

  // 檢查團體是否可以取消
  async canCancelTour(tour_id: string): Promise<{ canCancel: boolean; reason?: string }> {
    try {
      const tour = await this.getById(tour_id)
      if (!tour) {
        return { canCancel: false, reason: '找不到該旅遊團' }
      }

      // Tour 狀態檢查
      if (tour.status === '結案') {
        return { canCancel: false, reason: '該旅遊團已經結案，無法取消' }
      }

      const departure_date = new Date(tour.departure_date)
      const now = new Date()
      const daysDiff = Math.ceil((departure_date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      if (daysDiff < 3) {
        return { canCancel: false, reason: '出發前3天內無法取消' }
      }

      return { canCancel: true }
    } catch (error) {
      throw error
    }
  }

  // 更新團體狀態
  async updateTourStatus(
    tour_id: string,
    newStatus: Tour['status']
  ): Promise<Tour> {
    try {
      const tour = await this.getById(tour_id)
      if (!tour) {
        throw new Error('Tour not found')
      }

      const currentStatus = tour.status

      // If the status is not changing, do nothing.
      if (currentStatus === newStatus) {
        return tour
      }

      // 簡化版狀態轉換邏輯
      // 提案 → 進行中 → 結案
      //          ↓
      //    (解鎖回提案)
      const ALLOWED_STATUS_TRANSITIONS: Record<string, string[]> = {
        '提案': ['進行中', '取消'],
        '進行中': ['結案', '取消', '提案'], // 可解鎖回提案
        '結案': [], // 終態
        '取消': [], // 終態
      };


      const allowedTransitions = ALLOWED_STATUS_TRANSITIONS[currentStatus || ''] || [];
      if (!newStatus || !allowedTransitions.includes(newStatus)) {
        throw new ValidationError(
          'status',
          `不允許的狀態轉換：無法從 "${currentStatus}" 更新為 "${newStatus}"`
        );
      }

      return await this.update(tour_id, {
        status: newStatus,
        // 可以在這裡記錄狀態變更的原因和時間
        updated_at: this.now(),
      })
    } catch (error) {
      throw error
    }
  }

  /**
   * 取得或建立年度簽證專用團
   * @param year - 年份 (如: 2025)
   * @returns 簽證專用團
   */
  async getOrCreateVisaTour(year?: number): Promise<Tour> {
    const targetYear = year || new Date().getFullYear()
    const visaCode = `VISA${targetYear}001`

    // 🔧 直接查詢 Supabase（包含已刪除的資料）
    try {
      if (typeof window !== 'undefined') {
        const { supabase } = await import('@/lib/supabase/client')
        const { data, error } = await supabase
          .from('tours')
          .select('*')
          .eq('code', visaCode)
          .maybeSingle()

        if (!error && data) {
          // 如果找到已刪除的簽證團，復原它
          const typedData = data as Tour & { _deleted?: boolean }
          if (typedData._deleted) {
            const { data: updated, error: updateError } = await supabase
              .from('tours')
              .update({
                _deleted: false,
                _synced_at: null,
                updated_at: this.now(),
              })
              .eq('id', typedData.id)
              .select()
              .single()

            if (!updateError && updated) {
              // 重新載入 tours
              const tourStore = useTourStore.getState()
              await tourStore.fetchAll()
              return updated as Tour
            }
          } else {
            // 找到且未被刪除，直接返回
            return data as Tour
          }
        }
      }
    } catch (error) {
      // Supabase 查詢失敗，繼續嘗試本地 Store
      logger.warn('[TourService] getOrCreateVisaTour Supabase 查詢失敗，使用備用邏輯:', error)
    }

    // 檢查本地 Store 是否有（未刪除的）
    const allTours = await this.list()
    const existingVisaTour = allTours.data.find(t => t.code === visaCode)
    if (existingVisaTour) {
      return existingVisaTour
    }

    // 不存在則建立新的簽證專用團
    const today = new Date()
    const yearStart = new Date(targetYear, 0, 1)
    const departureDate = today > yearStart ? today : yearStart

    // 取得 workspace_id（RLS 必須）
    const workspaceId = getRequiredWorkspaceId()

    const visaTour: Partial<Tour> = {
      workspace_id: workspaceId,
      code: visaCode,
      name: `${targetYear}年度簽證專用團`,
      departure_date: departureDate.toISOString().split('T')[0],
      return_date: `${targetYear}-12-31`,
      status: '特殊團',
      location: '簽證專用',
      price: 0,
      max_participants: 9999,
      contract_status: 'pending',
      total_revenue: 0,
      total_cost: 0,
      profit: 0,
      created_at: this.now(),
      updated_at: this.now(),
    }

    return await this.create(visaTour as unknown as Tour & BaseEntity)
  }

  async getOrCreateEsimTour(year?: number): Promise<Tour> {
    const targetYear = year || new Date().getFullYear()
    const esimCode = `ESIM${targetYear}001`

    // 🔧 直接查詢 Supabase（包含已刪除的資料）
    try {
      if (typeof window !== 'undefined') {
        const { supabase } = await import('@/lib/supabase/client')
        const { data, error } = await supabase
          .from('tours')
          .select('*')
          .eq('code', esimCode)
          .maybeSingle()

        if (!error && data) {
          // 如果找到已刪除的網卡團，復原它
          const typedData = data as Tour & { _deleted?: boolean }
          if (typedData._deleted) {
            const { data: updated, error: updateError } = await supabase
              .from('tours')
              .update({
                _deleted: false,
                _synced_at: null,
                updated_at: this.now(),
              })
              .eq('id', typedData.id)
              .select()
              .single()

            if (!updateError && updated) {
              // 重新載入 tours
              const tourStore = useTourStore.getState()
              await tourStore.fetchAll()
              return updated as Tour
            }
          } else {
            // 找到且未被刪除，直接返回
            return data as Tour
          }
        }
      }
    } catch (error) {
      // Supabase 查詢失敗，繼續嘗試本地 Store
      logger.warn('[TourService] getOrCreateEsimTour Supabase 查詢失敗，使用備用邏輯:', error)
    }

    // 檢查本地 Store 是否有（未刪除的）
    const allTours = await this.list()
    const existingEsimTour = allTours.data.find(t => t.code === esimCode)
    if (existingEsimTour) {
      return existingEsimTour
    }

    // 不存在則建立新的網卡專用團
    const today = new Date()
    const yearStart = new Date(targetYear, 0, 1)
    const departureDate = today > yearStart ? today : yearStart

    // 取得 workspace_id（RLS 必須）
    const workspaceId = getRequiredWorkspaceId()

    const esimTour: Partial<Tour> = {
      workspace_id: workspaceId,
      code: esimCode,
      name: `${targetYear}年度網卡專用團`,
      departure_date: departureDate.toISOString().split('T')[0],
      return_date: `${targetYear}-12-31`,
      status: '特殊團',
      location: '網卡專用',
      price: 0,
      max_participants: 9999,
      contract_status: 'pending',
      total_revenue: 0,
      total_cost: 0,
      profit: 0,
      created_at: this.now(),
      updated_at: this.now(),
    }

    return await this.create(esimTour as unknown as Tour & BaseEntity)
  }

  /**
   * 取得所有非特殊團的旅遊團（用於行事曆顯示）
   * @returns 一般旅遊團列表
   */
  async listRegularTours() {
    const allTours = await this.list()
    return {
      ...allTours,
      data: allTours.data.filter(tour => tour.status !== '特殊團'),
    }
  }

  // ============================================
  // Tour Lifecycle V2.0 - 版本鎖定/解鎖
  // ============================================

  /**
   * 鎖定團的報價單和行程版本
   */
  async lockTour(
    tourId: string,
    options: {
      quoteId?: string | null
      quoteVersion?: number | null
      itineraryId?: string | null
      itineraryVersion?: number | null
      lockedBy?: string
    }
  ) {
    const updates = {
      status: '進行中', // 確認出團後鎖定
      locked_quote_id: options.quoteId || null,
      locked_quote_version: options.quoteVersion || null,
      locked_itinerary_id: options.itineraryId || null,
      locked_itinerary_version: options.itineraryVersion || null,
      locked_at: this.now(),
      locked_by: options.lockedBy || null,
      updated_at: this.now(),
    }

    await this.update(tourId, updates as unknown as Partial<Tour & BaseEntity>)
    return { success: true }
  }

  /**
   * 解鎖團（回到提案狀態）
   * 注意：密碼驗證應在 API 層進行，這裡只處理狀態更新
   */
  async unlockTour(
    tourId: string,
    options: {
      unlockedBy: string
      reason?: string
    }
  ) {
    const tour = await this.getById(tourId)
    if (!tour) {
      return { success: false, error: '找不到此團' }
    }

    if (tour.status !== '進行中') {
      return { success: false, error: '此團未處於鎖定狀態' }
    }

    const updates = {
      status: '提案', // 解鎖回到提案
      last_unlocked_at: this.now(),
      last_unlocked_by: options.unlockedBy,
      modification_reason: options.reason || null,
      updated_at: this.now(),
    }

    await this.update(tourId, updates as unknown as Partial<Tour & BaseEntity>)
    return { success: true }
  }

  /**
   * 重新鎖定團（修改完成後確認出團）
   */
  async relockTour(
    tourId: string,
    options: {
      quoteId?: string | null
      quoteVersion?: number | null
      itineraryId?: string | null
      itineraryVersion?: number | null
      lockedBy?: string
    }
  ) {
    const tour = await this.getById(tourId)
    if (!tour) {
      return { success: false, error: '找不到此團' }
    }

    if (tour.status !== '提案') {
      return { success: false, error: '此團無法進行鎖定' }
    }

    return this.lockTour(tourId, options)
  }

  /**
   * 判斷團是否已鎖定（進行中或結案）
   */
  isTourLocked(tour: Tour): boolean {
    return tour.status === '進行中' || tour.status === '結案'
  }

  /**
   * 判斷團是否可進入確認流程（只有提案可以）
   */
  canConfirmTour(tour: Tour): boolean {
    return tour.status === '提案'
  }
}

export const tourService = new TourService()
