import { describe, it, expect, vi } from 'vitest'
import {
  generateTourCode,
  generateCode,
  generateOrderCode,
  generateProposalCode,
  generateTourRequestCode,
  generateCompanyPaymentRequestCode,
} from './code-generator'

// Mock logger
vi.mock('@/lib/utils/logger', () => ({ logger: { log: vi.fn() } }))

const makeEntity = (code: string) => ({ id: crypto.randomUUID(), code, created_at: '', updated_at: '' })

describe('generateTourCode', () => {
  it('generates first tour code for a date', () => {
    expect(generateTourCode('TP', 'CNX', '2025-01-28', [])).toBe('CNX250128A')
  })

  it('increments letter for existing tours', () => {
    const existing = [{ code: 'CNX250128A' }]
    expect(generateTourCode('TP', 'CNX', '2025-01-28', existing)).toBe('CNX250128B')
  })

  it('handles multiple existing tours', () => {
    const existing = [{ code: 'CNX250128A' }, { code: 'CNX250128B' }, { code: 'CNX250128C' }]
    expect(generateTourCode('TP', 'CNX', '2025-01-28', existing)).toBe('CNX250128D')
  })

  it('ignores tours from different dates', () => {
    const existing = [{ code: 'CNX250129A' }]
    expect(generateTourCode('TP', 'CNX', '2025-01-28', existing)).toBe('CNX250128A')
  })

  it('ignores tours from different cities', () => {
    const existing = [{ code: 'BKK250128A' }]
    expect(generateTourCode('TP', 'CNX', '2025-01-28', existing)).toBe('CNX250128A')
  })
})

describe('generateCode (quote codes)', () => {
  it('generates first quote code Q000001', () => {
    expect(generateCode('TP', {}, [])).toBe('Q000001')
  })

  it('increments from existing codes', () => {
    const existing = [makeEntity('Q000005')]
    expect(generateCode('TP', {}, existing)).toBe('Q000006')
  })

  it('generates X prefix for quick quotes', () => {
    expect(generateCode('TP', { quoteType: 'quick' }, [])).toBe('X000001')
  })

  it('handles legacy A-prefix codes', () => {
    const existing = [makeEntity('A010')]
    expect(generateCode('TP', {}, existing)).toBe('Q000011')
  })

  it('finds max across mixed formats', () => {
    const existing = [makeEntity('Q000003'), makeEntity('Q000010')]
    expect(generateCode('TP', {}, existing)).toBe('Q000011')
  })
})

describe('generateOrderCode', () => {
  it('generates first order code', () => {
    expect(generateOrderCode('CNX250128A', [])).toBe('CNX250128A-O01')
  })

  it('increments from existing orders', () => {
    const existing = [{ code: 'CNX250128A-O01' }, { code: 'CNX250128A-O02' }]
    expect(generateOrderCode('CNX250128A', existing)).toBe('CNX250128A-O03')
  })

  it('ignores orders from other tours', () => {
    const existing = [{ code: 'BKK250128A-O05' }]
    expect(generateOrderCode('CNX250128A', existing)).toBe('CNX250128A-O01')
  })
})

describe('generateProposalCode', () => {
  it('generates first proposal code', () => {
    expect(generateProposalCode([])).toBe('P000001')
  })

  it('increments from existing', () => {
    expect(generateProposalCode([{ code: 'P000003' }])).toBe('P000004')
  })

  it('ignores non-matching codes', () => {
    expect(generateProposalCode([{ code: 'P250128A' }])).toBe('P000001')
  })
})

describe('generateTourRequestCode', () => {
  it('generates first request code', () => {
    expect(generateTourRequestCode('CNX250128A', [])).toBe('CNX250128A-RQ01')
  })

  it('increments correctly', () => {
    const existing = [{ code: 'CNX250128A-RQ01' }]
    expect(generateTourRequestCode('CNX250128A', existing)).toBe('CNX250128A-RQ02')
  })
})

describe('generateCompanyPaymentRequestCode', () => {
  it('generates first code', () => {
    expect(generateCompanyPaymentRequestCode('SAL', '2025-01-28', [])).toBe('SAL-202501-001')
  })

  it('increments within same month', () => {
    const existing = [{ code: 'SAL-202501-003' }]
    expect(generateCompanyPaymentRequestCode('SAL', '2025-01-15', existing)).toBe('SAL-202501-004')
  })

  it('starts fresh for new month', () => {
    const existing = [{ code: 'SAL-202501-005' }]
    expect(generateCompanyPaymentRequestCode('SAL', '2025-02-01', existing)).toBe('SAL-202502-001')
  })

  it('handles different expense types', () => {
    expect(generateCompanyPaymentRequestCode('ENT', '2025-03-01', [])).toBe('ENT-202503-001')
  })
})
