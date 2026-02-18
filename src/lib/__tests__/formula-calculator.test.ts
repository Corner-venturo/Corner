import { describe, it, expect } from 'vitest'
import {
  calculateFormula,
  getFieldCoordinate,
  getFieldFromCoordinate,
  getMemberContext,
} from '../formula-calculator'

describe('formula-calculator', () => {
  describe('calculateFormula', () => {
    it('returns non-formula strings as-is', () => {
      expect(calculateFormula('hello', {})).toBe('hello')
    })

    it('evaluates simple addition', () => {
      expect(calculateFormula('=1+2', {})).toBe(3)
    })

    it('evaluates multiplication', () => {
      expect(calculateFormula('=3*4', {})).toBe(12)
    })

    it('evaluates division', () => {
      expect(calculateFormula('=10/4', {})).toBe(2.5)
    })

    it('evaluates expression with parentheses', () => {
      expect(calculateFormula('=(2+3)*4', {})).toBe(20)
    })

    it('substitutes Chinese field names', () => {
      const result = calculateFormula('=基本費用+加購費用', { basePrice: 1000, addOnTotal: 200 })
      expect(result).toBe(1200)
    })

    it('substitutes Excel coordinates', () => {
      const result = calculateFormula('=F1*2', { age: 25 })
      expect(result).toBe(50)
    })

    it('returns #ERROR for invalid formula', () => {
      expect(calculateFormula('=abc', {})).toBe('#ERROR')
    })

    it('handles complex calculation', () => {
      const result = calculateFormula('=基本費用*0.9', { basePrice: 10000 })
      expect(result).toBe(9000)
    })

    it('rounds to 2 decimal places', () => {
      const result = calculateFormula('=10/3', {})
      expect(result).toBe(3.33)
    })
  })

  describe('getFieldCoordinate', () => {
    it('returns coordinate for predefined field', () => {
      expect(getFieldCoordinate('name')).toBe('C1')
    })

    it('returns coordinate for age', () => {
      expect(getFieldCoordinate('age')).toBe('F1')
    })

    it('returns null for unknown field', () => {
      expect(getFieldCoordinate('nonexistent')).toBeNull()
    })

    it('returns coordinate for custom fields starting at M', () => {
      const customs = [
        { id: 'custom1', name: 'Custom 1' },
        { id: 'custom2', name: 'Custom 2' },
      ]
      expect(getFieldCoordinate('custom1', customs)).toBe('M1')
      expect(getFieldCoordinate('custom2', customs)).toBe('N1')
    })
  })

  describe('getFieldFromCoordinate', () => {
    it('returns field name for known coordinate', () => {
      expect(getFieldFromCoordinate('C1')).toBe('name')
    })

    it('is case insensitive', () => {
      expect(getFieldFromCoordinate('c1')).toBe('name')
    })

    it('returns null for unknown coordinate', () => {
      expect(getFieldFromCoordinate('Z9')).toBeNull()
    })
  })

  describe('getMemberContext', () => {
    it('creates context with member data', () => {
      const member = { name: 'John', age: 30, basePrice: 5000 }
      const ctx = getMemberContext(member)
      expect(ctx.name).toBe('John')
      expect(ctx.age).toBe(30)
      expect(ctx.basePrice).toBe(5000)
    })

    it('calculates addOnTotal', () => {
      const member = { addOns: ['a1', 'a2'] }
      const addOns = [
        { id: 'a1', price: 100 },
        { id: 'a2', price: 200 },
        { id: 'a3', price: 300 },
      ]
      const ctx = getMemberContext(member, addOns)
      expect(ctx.addOnTotal).toBe(300)
    })

    it('uses tourPrice as default basePrice', () => {
      const ctx = getMemberContext({}, [], 8000)
      expect(ctx.basePrice).toBe(8000)
    })

    it('calculates totalPrice correctly', () => {
      const member = { basePrice: 5000, addOns: ['a1'] }
      const addOns = [{ id: 'a1', price: 500 }]
      const ctx = getMemberContext(member, addOns)
      expect(ctx.totalPrice).toBe(5500)
    })

    it('includes custom fields', () => {
      const member = { customFields: { meal: 'vegetarian', extra: '100' } }
      const ctx = getMemberContext(member)
      expect(ctx.meal).toBe('vegetarian')
      expect(ctx.extra).toBe(100) // numeric string converted
    })

    it('defaults missing fields to empty/zero', () => {
      const ctx = getMemberContext({})
      expect(ctx.name).toBe('')
      expect(ctx.age).toBe(0)
    })
  })
})
