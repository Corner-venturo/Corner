import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { tourService } from '@/features/tours/services/tour.service'
import { Tour } from '@/types/tour.types'
import { ValidationError } from '@/core/errors/app-errors'

// Mock the base service methods that are called by updateTourStatus
const getByIdMock = vi.spyOn(tourService, 'getById')
const updateMock = vi.spyOn(tourService, 'update')

describe('TourService - updateTourStatus', () => {
  beforeEach(() => {
    // Reset mocks before each test to ensure a clean state
    vi.resetAllMocks()
  })

  const mockTour = (status: Tour['status']): Tour => ({
    id: 'test-tour-id',
    name: 'Mock Tour',
    code: 'MOCK25122401',
    status,
    departure_date: '2025-12-24',
    return_date: '2025-12-25',
    contract_status: 'pending',
    total_revenue: 0,
    total_cost: 0,
    profit: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })

  // Test setup for a successful update
  updateMock.mockResolvedValue({} as any)

  describe('Valid Transitions', () => {
    it('should allow transition from "提案" to "確認中"', async () => {
      const tour = mockTour('提案')
      getByIdMock.mockResolvedValue(tour)
      
      await expect(tourService.updateTourStatus('test-tour-id', '確認中')).resolves.not.toThrow()
      expect(updateMock).toHaveBeenCalledWith('test-tour-id', { status: '確認中', updated_at: expect.any(String) })
    })

    it('should allow transition from "確認中" to "已確認"', async () => {
      const tour = mockTour('確認中')
      getByIdMock.mockResolvedValue(tour)

      await expect(tourService.updateTourStatus('test-tour-id', '已確認')).resolves.not.toThrow()
      expect(updateMock).toHaveBeenCalledWith('test-tour-id', { status: '已確認', updated_at: expect.any(String) })
    })

    it('should allow transition from "已確認" to "待結案"', async () => {
      const tour = mockTour('已確認')
      getByIdMock.mockResolvedValue(tour)

      await expect(tourService.updateTourStatus('test-tour-id', '待結案')).resolves.not.toThrow()
      expect(updateMock).toHaveBeenCalledWith('test-tour-id', { status: '待結案', updated_at: expect.any(String) })
    })

     it('should allow transition from "待結案" to "結案"', async () => {
      const tour = mockTour('待結案')
      getByIdMock.mockResolvedValue(tour)

      await expect(tourService.updateTourStatus('test-tour-id', '結案')).resolves.not.toThrow()
      expect(updateMock).toHaveBeenCalledWith('test-tour-id', { status: '結案', updated_at: expect.any(String) })
    })

    it('should allow cancellation from "提案"', async () => {
      const tour = mockTour('提案')
      getByIdMock.mockResolvedValue(tour)

      await expect(tourService.updateTourStatus('test-tour-id', '已取消')).resolves.not.toThrow()
      expect(updateMock).toHaveBeenCalledWith('test-tour-id', { status: '已取消', updated_at: expect.any(String) })
    })
  })

  describe('Invalid Transitions', () => {
    it('should PREVENT transition from "提案" to "結案"', async () => {
      const tour = mockTour('提案')
      getByIdMock.mockResolvedValue(tour)

      await expect(tourService.updateTourStatus('test-tour-id', '結案')).rejects.toThrow(ValidationError)
      await expect(tourService.updateTourStatus('test-tour-id', '結案')).rejects.toThrow(
        '不允許的狀態轉換：無法從 "提案" 更新為 "結案"'
      )
      expect(updateMock).not.toHaveBeenCalled()
    })

    it('should PREVENT transition from "已確認" to "修改中" (must use unlockTour)', async () => {
      const tour = mockTour('已確認')
      getByIdMock.mockResolvedValue(tour)

      await expect(tourService.updateTourStatus('test-tour-id', '修改中')).rejects.toThrow(ValidationError)
       await expect(tourService.updateTourStatus('test-tour-id', '修改中')).rejects.toThrow(
        '不允許的狀態轉換：無法從 "已確認" 更新為 "修改中"'
      )
      expect(updateMock).not.toHaveBeenCalled()
    })

    it('should PREVENT transition from "修改中" to "已確認" (must use relockTour)', async () => {
      const tour = mockTour('修改中')
      getByIdMock.mockResolvedValue(tour)

      await expect(tourService.updateTourStatus('test-tour-id', '已確認')).rejects.toThrow(ValidationError);
      expect(updateMock).not.toHaveBeenCalled()
    })
  })

  describe('Terminal States', () => {
    it('should PREVENT any transition from "結案"', async () => {
      const tour = mockTour('結案')
      getByIdMock.mockResolvedValue(tour)

      await expect(tourService.updateTourStatus('test-tour-id', '提案')).rejects.toThrow(ValidationError)
      expect(updateMock).not.toHaveBeenCalled()
    })

    it('should PREVENT any transition from "已取消"', async () => {
      const tour = mockTour('已取消')
      getByIdMock.mockResolvedValue(tour)

      await expect(tourService.updateTourStatus('test-tour-id', '已確認')).rejects.toThrow(ValidationError)
      expect(updateMock).not.toHaveBeenCalled()
    })
  })
  
  describe('Edge Cases', () => {
    it('should do nothing if status is the same', async () => {
      const tour = mockTour('提案')
      getByIdMock.mockResolvedValue(tour)

      const result = await tourService.updateTourStatus('test-tour-id', '提案')
      
      expect(result).toEqual(tour)
      expect(updateMock).not.toHaveBeenCalled()
    })

    it('should throw an error if tour is not found', async () => {
      getByIdMock.mockResolvedValue(undefined)
      
      await expect(tourService.updateTourStatus('non-existent-id', '提案')).rejects.toThrow('Tour not found')
      expect(updateMock).not.toHaveBeenCalled()
    })
  })
})
