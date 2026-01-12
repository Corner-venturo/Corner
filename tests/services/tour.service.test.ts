import { describe, it, expect, vi, beforeEach } from 'vitest'
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
  updateMock.mockResolvedValue({} as Tour)

  describe('Valid Transitions', () => {
    it('should allow transition from "提案" to "進行中"', async () => {
      const tour = mockTour('提案')
      getByIdMock.mockResolvedValue(tour)

      await expect(tourService.updateTourStatus('test-tour-id', '進行中')).resolves.not.toThrow()
      expect(updateMock).toHaveBeenCalledWith('test-tour-id', { status: '進行中', updated_at: expect.any(String) })
    })

    it('should allow transition from "進行中" to "結案"', async () => {
      const tour = mockTour('進行中')
      getByIdMock.mockResolvedValue(tour)

      await expect(tourService.updateTourStatus('test-tour-id', '結案')).resolves.not.toThrow()
      expect(updateMock).toHaveBeenCalledWith('test-tour-id', { status: '結案', updated_at: expect.any(String) })
    })

    it('should allow transition from "進行中" to "取消"', async () => {
      const tour = mockTour('進行中')
      getByIdMock.mockResolvedValue(tour)

      await expect(tourService.updateTourStatus('test-tour-id', '取消')).resolves.not.toThrow()
      expect(updateMock).toHaveBeenCalledWith('test-tour-id', { status: '取消', updated_at: expect.any(String) })
    })

    it('should allow transition from "進行中" back to "提案" (unlock)', async () => {
      const tour = mockTour('進行中')
      getByIdMock.mockResolvedValue(tour)

      await expect(tourService.updateTourStatus('test-tour-id', '提案')).resolves.not.toThrow()
      expect(updateMock).toHaveBeenCalledWith('test-tour-id', { status: '提案', updated_at: expect.any(String) })
    })

    it('should allow cancellation from "提案"', async () => {
      const tour = mockTour('提案')
      getByIdMock.mockResolvedValue(tour)

      await expect(tourService.updateTourStatus('test-tour-id', '取消')).resolves.not.toThrow()
      expect(updateMock).toHaveBeenCalledWith('test-tour-id', { status: '取消', updated_at: expect.any(String) })
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

    it('should PREVENT direct transition from "結案" to any state', async () => {
      const tour = mockTour('結案')
      getByIdMock.mockResolvedValue(tour)

      await expect(tourService.updateTourStatus('test-tour-id', '提案')).rejects.toThrow(ValidationError)
      expect(updateMock).not.toHaveBeenCalled()
    })
  })

  describe('Terminal States', () => {
    it('should PREVENT any transition from "結案"', async () => {
      const tour = mockTour('結案')
      getByIdMock.mockResolvedValue(tour)

      await expect(tourService.updateTourStatus('test-tour-id', '進行中')).rejects.toThrow(ValidationError)
      expect(updateMock).not.toHaveBeenCalled()
    })

    it('should PREVENT any transition from "取消"', async () => {
      const tour = mockTour('取消')
      getByIdMock.mockResolvedValue(tour)

      await expect(tourService.updateTourStatus('test-tour-id', '提案')).rejects.toThrow(ValidationError)
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
