import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/utils/logger', () => ({
  logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

import {
  generateProposalCode,
  generateTourRequestCode,
  generateCompanyPaymentRequestCode,
} from '@/stores/utils/code-generator'

describe('generateProposalCode', () => {
  it('第一個提案', () => {
    expect(generateProposalCode([])).toBe('P000001')
  })

  it('遞增', () => {
    const existing = [{ code: 'P000001' }, { code: 'P000005' }]
    expect(generateProposalCode(existing)).toBe('P000006')
  })

  it('忽略不匹配的格式', () => {
    const existing = [{ code: 'X000001' }, { code: 'P250128A' }]
    expect(generateProposalCode(existing)).toBe('P000001')
  })
})

describe('generateTourRequestCode', () => {
  it('第一張需求單', () => {
    expect(generateTourRequestCode('CNX250128A', [])).toBe('CNX250128A-RQ01')
  })

  it('遞增', () => {
    const existing = [{ code: 'CNX250128A-RQ01' }, { code: 'CNX250128A-RQ02' }]
    expect(generateTourRequestCode('CNX250128A', existing)).toBe('CNX250128A-RQ03')
  })
})

describe('generateCompanyPaymentRequestCode', () => {
  it('第一張公司請款單', () => {
    expect(generateCompanyPaymentRequestCode('SAL', '2025-01-28', [])).toBe('SAL-202501-001')
  })

  it('遞增', () => {
    const existing = [{ code: 'SAL-202501-001' }, { code: 'SAL-202501-002' }]
    expect(generateCompanyPaymentRequestCode('SAL', '2025-01-28', existing)).toBe('SAL-202501-003')
  })

  it('不同月份不衝突', () => {
    const existing = [{ code: 'SAL-202501-001' }]
    expect(generateCompanyPaymentRequestCode('SAL', '2025-02-15', existing)).toBe('SAL-202502-001')
  })

  it('不同費用類型不衝突', () => {
    const existing = [{ code: 'SAL-202501-001' }]
    expect(generateCompanyPaymentRequestCode('ENT', '2025-01-15', existing)).toBe('ENT-202501-001')
  })
})

