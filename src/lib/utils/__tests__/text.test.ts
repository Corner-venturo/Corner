import { describe, it, expect } from 'vitest'
import { toHalfWidth, tryCalculateMath } from '../text'

describe('text', () => {
  describe('toHalfWidth', () => {
    it('converts fullwidth digits', () => {
      expect(toHalfWidth('０１２３４５６７８９')).toBe('0123456789')
    })

    it('converts fullwidth uppercase', () => {
      expect(toHalfWidth('ＡＢＣ')).toBe('ABC')
    })

    it('converts fullwidth lowercase', () => {
      expect(toHalfWidth('ａｂｃ')).toBe('abc')
    })

    it('converts fullwidth colon', () => {
      expect(toHalfWidth('：')).toBe(':')
    })

    it('converts fullwidth space', () => {
      expect(toHalfWidth('　')).toBe(' ')
    })

    it('converts math operators', () => {
      expect(toHalfWidth('＋－×÷')).toBe('+-*/')
    })

    it('preserves CJK punctuation', () => {
      expect(toHalfWidth('，。？！')).toBe('，。？！')
    })

    it('returns empty/null as-is', () => {
      expect(toHalfWidth('')).toBe('')
      expect(toHalfWidth(null as unknown as string)).toBe(null)
    })

    it('handles mixed content', () => {
      expect(toHalfWidth('價格：１２３元')).toBe('價格:123元')
    })
  })

  describe('tryCalculateMath', () => {
    it('calculates simple addition', () => {
      expect(tryCalculateMath('1+2')).toBe('3')
    })

    it('calculates with fullwidth', () => {
      expect(tryCalculateMath('１＋２')).toBe('3')
    })

    it('returns original for non-expression', () => {
      expect(tryCalculateMath('hello')).toBe('hello')
    })

    it('returns original for single number', () => {
      expect(tryCalculateMath('42')).toBe('42')
    })

    it('handles empty/null', () => {
      expect(tryCalculateMath('')).toBe('')
      expect(tryCalculateMath(null as unknown as string)).toBe(null)
    })

    it('handles multiplication', () => {
      expect(tryCalculateMath('3*4')).toBe('12')
    })

    it('handles parentheses', () => {
      expect(tryCalculateMath('(2+3)*4')).toBe('20')
    })

    it('handles percentage', () => {
      expect(tryCalculateMath('200*10%')).toBe('20')
    })

    it('handles decimal results', () => {
      expect(tryCalculateMath('10/3')).toBe('3.33')
    })

    it('handles negative result', () => {
      expect(tryCalculateMath('5-10')).toBe('-5')
    })
  })
})
