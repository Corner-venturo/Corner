import { describe, it, expect } from 'vitest'
import { stripHtml, truncateText, camelToKebab, kebabToCamel } from '../string-utils'

describe('string-utils', () => {
  describe('stripHtml', () => {
    it('removes HTML tags', () => {
      expect(stripHtml('<p>Hello <b>world</b></p>')).toBe('Hello world')
    })

    it('returns empty for null', () => {
      expect(stripHtml(null)).toBe('')
    })

    it('returns empty for undefined', () => {
      expect(stripHtml(undefined)).toBe('')
    })

    it('returns empty for empty string', () => {
      expect(stripHtml('')).toBe('')
    })

    it('handles text without HTML', () => {
      expect(stripHtml('plain text')).toBe('plain text')
    })

    it('handles nested tags', () => {
      expect(stripHtml('<div><p><span>nested</span></p></div>')).toBe('nested')
    })

    it('trims whitespace', () => {
      expect(stripHtml('  <p>hello</p>  ')).toBe('hello')
    })
  })

  describe('truncateText', () => {
    it('truncates long text', () => {
      expect(truncateText('Hello World', 5)).toBe('Hello...')
    })

    it('does not truncate short text', () => {
      expect(truncateText('Hi', 5)).toBe('Hi')
    })

    it('returns empty for null', () => {
      expect(truncateText(null, 5)).toBe('')
    })

    it('returns empty for undefined', () => {
      expect(truncateText(undefined, 5)).toBe('')
    })

    it('handles exact length', () => {
      expect(truncateText('Hello', 5)).toBe('Hello')
    })

    it('handles maxLength 0', () => {
      expect(truncateText('Hello', 0)).toBe('...')
    })
  })

  describe('camelToKebab', () => {
    it('converts camelCase', () => {
      expect(camelToKebab('helloWorld')).toBe('hello-world')
    })

    it('handles multiple capitals', () => {
      expect(camelToKebab('myTestCase')).toBe('my-test-case')
    })

    it('handles no capitals', () => {
      expect(camelToKebab('hello')).toBe('hello')
    })
  })

  describe('kebabToCamel', () => {
    it('converts kebab-case', () => {
      expect(kebabToCamel('hello-world')).toBe('helloWorld')
    })

    it('handles multiple dashes', () => {
      expect(kebabToCamel('my-test-case')).toBe('myTestCase')
    })

    it('handles no dashes', () => {
      expect(kebabToCamel('hello')).toBe('hello')
    })
  })
})
