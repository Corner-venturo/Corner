import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/utils/logger', () => ({
  logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

import {
  generateDisbursementOrderCode,
  generateProposalCode,
  generateTourRequestCode,
  generateCompanyPaymentRequestCode,
  generatePaymentRequestCode,
  generateCustomerCode,
  generateEmployeeNumber,
} from '@/stores/utils/code-generator'

describe('generateDisbursementOrderCode', () => {
  it('第一張出納單用 A', () => {
    const result = generateDisbursementOrderCode('2025-01-28', [])
    expect(result).toBe('P250128A')
  })

  it('遞增字母', () => {
    const existing = [{ code: 'P250128A' }, { code: 'P250128B' }]
    const result = generateDisbursementOrderCode('2025-01-28', existing)
    expect(result).toBe('P250128C')
  })

  it('不同日期不衝突', () => {
    const existing = [{ code: 'P250128A' }]
    const result = generateDisbursementOrderCode('2025-01-29', existing)
    expect(result).toBe('P250129A')
  })
})

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

describe('generatePaymentRequestCode', () => {
  it('第一張請款單', () => {
    expect(generatePaymentRequestCode('CNX250128A', [])).toBe('CNX250128A-I01')
  })

  it('遞增', () => {
    const existing = [{ code: 'CNX250128A-I01' }]
    expect(generatePaymentRequestCode('CNX250128A', existing)).toBe('CNX250128A-I02')
  })
})

describe('generateCustomerCode', () => {
  it('第一位客戶', () => {
    expect(generateCustomerCode([])).toBe('C000001')
  })

  it('遞增', () => {
    const existing = [{ id: '1', code: 'C000003' }]
    expect(generateCustomerCode(existing)).toBe('C000004')
  })

  it('向後相容舊格式 C-A001', () => {
    const existing = [{ id: '1', code: 'C-A001' }]
    const result = generateCustomerCode(existing)
    // A=0 group, so C-A001 = 0*1000+1 = 1
    expect(result).toBe('C000002')
  })
})

describe('generateEmployeeNumber', () => {
  it('第一位員工', () => {
    expect(generateEmployeeNumber('TP', [])).toBe('E001')
  })

  it('遞增', () => {
    const existing = [{ id: '1', employee_number: 'E005' }]
    expect(generateEmployeeNumber('TP', existing)).toBe('E006')
  })

  it('向後相容舊格式 TP-E001', () => {
    const existing = [{ id: '1', employee_number: 'TP-E003' }]
    expect(generateEmployeeNumber('TP', existing)).toBe('E004')
  })
})
