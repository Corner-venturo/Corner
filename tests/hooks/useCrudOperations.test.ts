import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCrudOperations } from '@/hooks/useCrudOperations'

// Mock UUID generator
vi.mock('@/lib/utils/uuid', () => ({
  generateUUID: vi.fn(() => 'generated-uuid-123'),
}))

describe('useCrudOperations', () => {
  interface TestItem {
    id: string
    name: string
    value: number
    created_at?: string
    updated_at?: string
  }

  let mockItems: TestItem[]
  let mockSetItems: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    mockItems = [
      { id: 'item-1', name: 'First', value: 100 },
      { id: 'item-2', name: 'Second', value: 200 },
    ]
    mockSetItems = vi.fn((newItems) => {
      mockItems = typeof newItems === 'function' ? newItems(mockItems) : newItems
    })
  })

  describe('add', () => {
    it('should add a new item with generated id and timestamps', () => {
      const { result } = renderHook(() =>
        useCrudOperations(mockItems, mockSetItems)
      )

      let newItem: TestItem | undefined
      act(() => {
        newItem = result.current.add({ name: 'Third', value: 300 })
      })

      expect(mockSetItems).toHaveBeenCalled()
      expect(newItem).toBeDefined()
      expect(newItem?.id).toBe('generated-uuid-123')
      expect(newItem?.name).toBe('Third')
      expect(newItem?.value).toBe(300)
      expect(newItem?.created_at).toBeDefined()
      expect(newItem?.updated_at).toBeDefined()
    })

    it('should append new item to existing items', () => {
      const { result } = renderHook(() =>
        useCrudOperations(mockItems, mockSetItems)
      )

      act(() => {
        result.current.add({ name: 'Third', value: 300 })
      })

      const calledWith = mockSetItems.mock.calls[0][0]
      expect(calledWith).toHaveLength(3)
      expect(calledWith[2].name).toBe('Third')
    })
  })

  describe('update', () => {
    it('should update an existing item by id', () => {
      const { result } = renderHook(() =>
        useCrudOperations(mockItems, mockSetItems)
      )

      act(() => {
        result.current.update('item-1', { name: 'Updated First', value: 150 })
      })

      const calledWith = mockSetItems.mock.calls[0][0]
      expect(calledWith[0].name).toBe('Updated First')
      expect(calledWith[0].value).toBe(150)
      expect(calledWith[0].updated_at).toBeDefined()
    })

    it('should only update the specified item', () => {
      const { result } = renderHook(() =>
        useCrudOperations(mockItems, mockSetItems)
      )

      act(() => {
        result.current.update('item-1', { name: 'Updated' })
      })

      const calledWith = mockSetItems.mock.calls[0][0]
      expect(calledWith[1].name).toBe('Second') // Unchanged
    })

    it('should not update if id not found', () => {
      const { result } = renderHook(() =>
        useCrudOperations(mockItems, mockSetItems)
      )

      act(() => {
        result.current.update('non-existent', { name: 'Updated' })
      })

      const calledWith = mockSetItems.mock.calls[0][0]
      expect(calledWith[0].name).toBe('First') // Unchanged
      expect(calledWith[1].name).toBe('Second') // Unchanged
    })
  })

  describe('remove', () => {
    it('should remove an item by id', () => {
      const { result } = renderHook(() =>
        useCrudOperations(mockItems, mockSetItems)
      )

      act(() => {
        result.current.remove('item-1')
      })

      const calledWith = mockSetItems.mock.calls[0][0]
      expect(calledWith).toHaveLength(1)
      expect(calledWith[0].id).toBe('item-2')
    })

    it('should not remove anything if id not found', () => {
      const { result } = renderHook(() =>
        useCrudOperations(mockItems, mockSetItems)
      )

      act(() => {
        result.current.remove('non-existent')
      })

      const calledWith = mockSetItems.mock.calls[0][0]
      expect(calledWith).toHaveLength(2)
    })
  })
})
