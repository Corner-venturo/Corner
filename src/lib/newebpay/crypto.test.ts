import { describe, it, expect } from 'vitest'
import {
  aesEncrypt,
  aesDecrypt,
  generateTransactionNo,
  convertTaxType,
  formatInvoiceDate,
  testEncryption,
} from './crypto'

describe('aesEncrypt', () => {
  const key = 'abcdefghijklmnopqrstuvwxyzabcdef'
  const iv = '1234567890123456'

  it('should encrypt test data correctly', () => {
    const result = aesEncrypt('ABCDEFGHIJ0123456789', key, iv)
    expect(result).toBe('f329a61f014cdad8acae2b497b32514fcb57dffb44dafd2b5531e8ac4d206093')
  })

  it('should return hex string', () => {
    const result = aesEncrypt('hello', key, iv)
    expect(/^[0-9a-f]+$/.test(result)).toBe(true)
  })

  it('should produce different output for different input', () => {
    const r1 = aesEncrypt('input1', key, iv)
    const r2 = aesEncrypt('input2', key, iv)
    expect(r1).not.toBe(r2)
  })
})

describe('aesDecrypt', () => {
  const key = 'abcdefghijklmnopqrstuvwxyzabcdef'
  const iv = '1234567890123456'

  it('should decrypt to original plaintext', () => {
    const encrypted = aesEncrypt('ABCDEFGHIJ0123456789', key, iv)
    const decrypted = aesDecrypt(encrypted, key, iv)
    expect(decrypted).toBe('ABCDEFGHIJ0123456789')
  })

  it('should roundtrip any string', () => {
    const original = 'MerchantID=12345&Amount=100'
    const encrypted = aesEncrypt(original, key, iv)
    expect(aesDecrypt(encrypted, key, iv)).toBe(original)
  })

  it('should roundtrip URL encoded data', () => {
    const original = 'key1%3Dvalue1%26key2%3Dvalue2'
    const encrypted = aesEncrypt(original, key, iv)
    expect(aesDecrypt(encrypted, key, iv)).toBe(original)
  })
})

describe('generateTransactionNo', () => {
  it('should start with TI', () => {
    expect(generateTransactionNo().startsWith('TI')).toBe(true)
  })

  it('should be 20 characters long', () => {
    // TI(2) + YYYYMMDD(8) + HHmmss(6) + random(4) = 20
    expect(generateTransactionNo().length).toBe(20)
  })

  it('should generate unique values', () => {
    const a = generateTransactionNo()
    const b = generateTransactionNo()
    expect(a).not.toBe(b)
  })
})

describe('convertTaxType', () => {
  it('should convert dutiable to 1', () => {
    expect(convertTaxType('dutiable')).toBe('1')
  })

  it('should convert zero to 2', () => {
    expect(convertTaxType('zero')).toBe('2')
  })

  it('should convert free to 3', () => {
    expect(convertTaxType('free')).toBe('3')
  })

  it('should default to 1 for unknown', () => {
    expect(convertTaxType('unknown')).toBe('1')
  })

  it('should default to 1 for empty string', () => {
    expect(convertTaxType('')).toBe('1')
  })
})

describe('formatInvoiceDate', () => {
  it('should remove dashes from date', () => {
    expect(formatInvoiceDate('2025-03-15')).toBe('20250315')
  })

  it('should handle already formatted date', () => {
    expect(formatInvoiceDate('20250315')).toBe('20250315')
  })
})

describe('testEncryption', () => {
  it('should return success', () => {
    const result = testEncryption()
    expect(result.success).toBe(true)
    expect(result.message).toContain('通過')
  })
})
