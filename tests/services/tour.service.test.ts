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
    // Re-setup the default update mock after reset
    updateMock.mockResolvedValue({} as Tour)
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

  describe('Valid Transitions', () => {
    it('should allow transition from "開團" to "待出發"', async () => {
      const tour = mockTour('開團')
      getByIdMock.mockResolvedValue(tour)

      await expect(tourService.updateTourStatus('test-tour-id', '待出發')).resolves.not.toThrow()
      expect(updateMock).toHaveBeenCalledWith('test-tour-id', { status: '待出發', updated_at: expect.any(String) })
    })

    it('should allow transition from "待出發" to "已結團"', async () => {
      const tour = mockTour('待出發')
      getByIdMock.mockResolvedValue(tour)

      await expect(tourService.updateTourStatus('test-tour-id', '已結團')).resolves.not.toThrow()
      expect(updateMock).toHaveBeenCalledWith('test-tour-id', { status: '已結團', updated_at: expect.any(String) })
    })

    it('should allow transition from "待出發" to "取消"', async () => {
      const tour = mockTour('待出發')
      getByIdMock.mockResolvedValue(tour)

      await expect(tourService.updateTourStatus('test-tour-id', '取消')).resolves.not.toThrow()
      expect(updateMock).toHaveBeenCalledWith('test-tour-id', { status: '取消', updated_at: expect.any(String) })
    })

    it('should allow transition from "待出發" back to "開團" (unlock)', async () => {
      const tour = mockTour('待出發')
      getByIdMock.mockResolvedValue(tour)

      await expect(tourService.updateTourStatus('test-tour-id', '開團')).resolves.not.toThrow()
      expect(updateMock).toHaveBeenCalledWith('test-tour-id', { status: '開團', updated_at: expect.any(String) })
    })

    it('should allow cancellation from "開團"', async () => {
      const tour = mockTour('開團')
      getByIdMock.mockResolvedValue(tour)

      await expect(tourService.updateTourStatus('test-tour-id', '取消')).resolves.not.toThrow()
      expect(updateMock).toHaveBeenCalledWith('test-tour-id', { status: '取消', updated_at: expect.any(String) })
    })
  })

  describe('Invalid Transitions', () => {
    it('should PREVENT transition from "開團" to "已結團"', async () => {
      const tour = mockTour('開團')
      getByIdMock.mockResolvedValue(tour)

      await expect(tourService.updateTourStatus('test-tour-id', '已結團')).rejects.toThrow(ValidationError)
      await expect(tourService.updateTourStatus('test-tour-id', '已結團')).rejects.toThrow(
        '不允許的狀態轉換：無法從 "開團" 更新為 "已結團"'
      )
      expect(updateMock).not.toHaveBeenCalled()
    })

    it('should PREVENT direct transition from "已結團" to any state', async () => {
      const tour = mockTour('已結團')
      getByIdMock.mockResolvedValue(tour)

      await expect(tourService.updateTourStatus('test-tour-id', '開團')).rejects.toThrow(ValidationError)
      expect(updateMock).not.toHaveBeenCalled()
    })
  })

  describe('Terminal States', () => {
    it('should PREVENT any transition from "已結團"', async () => {
      const tour = mockTour('已結團')
      getByIdMock.mockResolvedValue(tour)

      await expect(tourService.updateTourStatus('test-tour-id', '待出發')).rejects.toThrow(ValidationError)
      expect(updateMock).not.toHaveBeenCalled()
    })

    it('should PREVENT any transition from "取消"', async () => {
      const tour = mockTour('取消')
      getByIdMock.mockResolvedValue(tour)

      await expect(tourService.updateTourStatus('test-tour-id', '開團')).rejects.toThrow(ValidationError)
      expect(updateMock).not.toHaveBeenCalled()
    })
  })

  describe('Edge Cases', () => {
    it('should do nothing if status is the same', async () => {
      const tour = mockTour('開團')
      getByIdMock.mockResolvedValue(tour)

      const result = await tourService.updateTourStatus('test-tour-id', '開團')

      expect(result).toEqual(tour)
      expect(updateMock).not.toHaveBeenCalled()
    })

    it('should throw an error if tour is not found', async () => {
      getByIdMock.mockResolvedValue(undefined)

      await expect(tourService.updateTourStatus('non-existent-id', '開團')).rejects.toThrow('Tour not found')
      expect(updateMock).not.toHaveBeenCalled()
    })
  })
})
