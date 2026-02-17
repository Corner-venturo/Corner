import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/utils/logger', () => ({
  logger: { log: vi.fn(), info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

import {
  generateTourCode,
  generateOrderCode,
  generateCode,
  generateTourRequestCode,
  generateProposalCode,
  generateCompanyPaymentRequestCode,
} from '@/stores/utils/code-generator'

describe('code-generator', () => {
  describe('generateTourCode', () => {
    it('should generate first tour code for a date', () => {
      const result = generateTourCode('TP', 'CNX', '2025-01-28', [])
      expect(result).toBe('CNX250128A')
    })

    it('should increment letter for same date/city', () => {
      const existing = [{ code: 'CNX250128A' }]
      const result = generateTourCode('TP', 'CNX', '2025-01-28', existing)
      expect(result).toBe('CNX250128B')
    })

    it('should find max letter among existing tours', () => {
      const existing = [{ code: 'CNX250128A' }, { code: 'CNX250128C' }, { code: 'CNX250128B' }]
      const result = generateTourCode('TP', 'CNX', '2025-01-28', existing)
      expect(result).toBe('CNX250128D')
    })

    it('should not conflict with different city codes', () => {
      const existing = [{ code: 'BKK250128A' }]
      const result = generateTourCode('TP', 'CNX', '2025-01-28', existing)
      expect(result).toBe('CNX250128A')
    })
  })

  describe('generateOrderCode', () => {
    it('should generate first order code', () => {
      expect(generateOrderCode('CNX250128A', [])).toBe('CNX250128A-O01')
    })

    it('should increment order number', () => {
      const existing = [{ code: 'CNX250128A-O01' }, { code: 'CNX250128A-O02' }]
      expect(generateOrderCode('CNX250128A', existing)).toBe('CNX250128A-O03')
    })
  })

  describe('generateTourRequestCode', () => {
    it('should generate first request code', () => {
      expect(generateTourRequestCode('CNX250128A', [])).toBe('CNX250128A-RQ01')
    })
  })

  describe('generateCode (quote)', () => {
    it('should generate Q-prefixed code', () => {
      const result = generateCode('TP', {}, [])
      expect(result).toBe('Q000001')
    })

    it('should generate X-prefixed for quick quotes', () => {
      const result = generateCode('TP', { quoteType: 'quick' }, [])
      expect(result).toBe('X000001')
    })

    it('should increment from existing', () => {
      const existing = [{ id: '1', code: 'Q000005' }]
      const result = generateCode('TP', {}, existing)
      expect(result).toBe('Q000006')
    })
  })

  describe('generateProposalCode', () => {
    it('should generate first proposal code', () => {
      expect(generateProposalCode([])).toBe('P000001')
    })
  })

  describe('generateCompanyPaymentRequestCode', () => {
    it('should generate code with expense type and month', () => {
      expect(generateCompanyPaymentRequestCode('SAL', '2025-01-28', [])).toBe('SAL-202501-001')
    })

    it('should increment within same month/type', () => {
      const existing = [{ code: 'SAL-202501-002' }]
      expect(generateCompanyPaymentRequestCode('SAL', '2025-01-15', existing)).toBe('SAL-202501-003')
    })
  })
})
