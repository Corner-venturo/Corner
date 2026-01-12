import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDialog } from '@/hooks/useDialog'

describe('useDialog', () => {
  interface TestData {
    id: string
    name: string
  }

  describe('initial state', () => {
    it('should have dialog closed initially', () => {
      const { result } = renderHook(() => useDialog<TestData>())

      expect(result.current.isOpen).toBe(false)
      expect(result.current.dialogType).toBeNull()
      expect(result.current.dialogData).toBeNull()
      expect(result.current.dialogMeta).toBeUndefined()
    })
  })

  describe('openDialog', () => {
    it('should open dialog with type only', () => {
      const { result } = renderHook(() => useDialog<TestData>())

      act(() => {
        result.current.openDialog('create')
      })

      expect(result.current.isOpen).toBe(true)
      expect(result.current.dialogType).toBe('create')
      expect(result.current.dialogData).toBeNull()
    })

    it('should open dialog with type and data', () => {
      const { result } = renderHook(() => useDialog<TestData>())
      const testData: TestData = { id: '1', name: 'Test' }

      act(() => {
        result.current.openDialog('edit', testData)
      })

      expect(result.current.isOpen).toBe(true)
      expect(result.current.dialogType).toBe('edit')
      expect(result.current.dialogData).toEqual(testData)
    })

    it('should open dialog with type, data, and meta', () => {
      const { result } = renderHook(() => useDialog<TestData>())
      const testData: TestData = { id: '1', name: 'Test' }
      const testMeta = { confirmMessage: 'Are you sure?' }

      act(() => {
        result.current.openDialog('delete', testData, testMeta)
      })

      expect(result.current.isOpen).toBe(true)
      expect(result.current.dialogType).toBe('delete')
      expect(result.current.dialogData).toEqual(testData)
      expect(result.current.dialogMeta).toEqual(testMeta)
    })
  })

  describe('closeDialog', () => {
    it('should close dialog and reset state', () => {
      const { result } = renderHook(() => useDialog<TestData>())

      act(() => {
        result.current.openDialog('edit', { id: '1', name: 'Test' })
      })

      expect(result.current.isOpen).toBe(true)

      act(() => {
        result.current.closeDialog()
      })

      expect(result.current.isOpen).toBe(false)
      expect(result.current.dialogType).toBeNull()
      expect(result.current.dialogData).toBeNull()
      expect(result.current.dialogMeta).toBeUndefined()
    })
  })

  describe('updateDialogData', () => {
    it('should update existing dialog data', () => {
      const { result } = renderHook(() => useDialog<TestData>())

      act(() => {
        result.current.openDialog('edit', { id: '1', name: 'Original' })
      })

      act(() => {
        result.current.updateDialogData({ name: 'Updated' })
      })

      expect(result.current.dialogData?.name).toBe('Updated')
      expect(result.current.dialogData?.id).toBe('1') // Preserved
    })

    it('should set data even if dialog data was null', () => {
      const { result } = renderHook(() => useDialog<TestData>())

      act(() => {
        result.current.openDialog('create')
      })

      act(() => {
        result.current.updateDialogData({ id: 'new', name: 'New Item' })
      })

      expect(result.current.dialogData?.id).toBe('new')
      expect(result.current.dialogData?.name).toBe('New Item')
    })
  })

  describe('dialog object', () => {
    it('should expose full dialog state object', () => {
      const { result } = renderHook(() => useDialog<TestData>())
      const testData: TestData = { id: '1', name: 'Test' }

      act(() => {
        result.current.openDialog('view', testData, { readOnly: true })
      })

      expect(result.current.dialog).toEqual({
        isOpen: true,
        type: 'view',
        data: testData,
        meta: { readOnly: true },
      })
    })
  })
})
