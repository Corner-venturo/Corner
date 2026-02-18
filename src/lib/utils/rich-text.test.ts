import { describe, it, expect } from 'vitest'
import { isHtmlString, htmlToPlainText, cleanTiptapHtml, renderRichText } from './rich-text'

describe('isHtmlString', () => {
  it('returns false for null', () => {
    expect(isHtmlString(null)).toBe(false)
  })

  it('returns false for undefined', () => {
    expect(isHtmlString(undefined)).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(isHtmlString('')).toBe(false)
  })

  it('returns false for plain text', () => {
    expect(isHtmlString('Hello World')).toBe(false)
  })

  it('returns true for HTML with tags', () => {
    expect(isHtmlString('<p>Hello</p>')).toBe(true)
  })

  it('returns true for self-closing tags', () => {
    expect(isHtmlString('<br/>')).toBe(true)
  })

  it('returns true for tags with attributes', () => {
    expect(isHtmlString('<a href="url">link</a>')).toBe(true)
  })

  it('returns false for angle brackets without valid tags', () => {
    expect(isHtmlString('5 > 3')).toBe(false)
  })

  it('returns true for nested HTML', () => {
    expect(isHtmlString('<div><span>text</span></div>')).toBe(true)
  })
})

describe('htmlToPlainText', () => {
  it('returns empty string for null', () => {
    expect(htmlToPlainText(null)).toBe('')
  })

  it('returns empty string for undefined', () => {
    expect(htmlToPlainText(undefined)).toBe('')
  })

  it('returns empty string for empty string', () => {
    expect(htmlToPlainText('')).toBe('')
  })

  it('strips HTML tags', () => {
    expect(htmlToPlainText('<p>Hello</p>')).toBe('Hello')
  })

  it('strips nested tags', () => {
    expect(htmlToPlainText('<div><strong>bold</strong> text</div>')).toBe('bold text')
  })

  it('strips self-closing tags', () => {
    expect(htmlToPlainText('line1<br/>line2')).toBe('line1line2')
  })

  it('returns plain text unchanged', () => {
    expect(htmlToPlainText('just text')).toBe('just text')
  })

  it('strips tags with attributes', () => {
    expect(htmlToPlainText('<a href="url">link</a>')).toBe('link')
  })
})

describe('cleanTiptapHtml', () => {
  it('returns empty string for null', () => {
    expect(cleanTiptapHtml(null)).toBe('')
  })

  it('returns empty string for undefined', () => {
    expect(cleanTiptapHtml(undefined)).toBe('')
  })

  it('returns empty string for empty string', () => {
    expect(cleanTiptapHtml('')).toBe('')
  })

  it('removes outer p tags', () => {
    expect(cleanTiptapHtml('<p>Hello</p>')).toBe('Hello')
  })

  it('preserves inner formatting', () => {
    const result = cleanTiptapHtml('<p><strong>bold</strong> text</p>')
    expect(result).toContain('<strong>bold</strong>')
    expect(result).toContain('text')
  })

  it('does not remove non-outer p tags', () => {
    const result = cleanTiptapHtml('<p>first</p><p>second</p>')
    expect(result).toContain('second')
  })
})

describe('renderRichText', () => {
  it('returns text for null input with default', () => {
    const result = renderRichText(null, 'default')
    expect(result).toEqual({ text: 'default' })
  })

  it('returns text for undefined input', () => {
    const result = renderRichText(undefined)
    expect(result).toEqual({ text: '' })
  })

  it('returns text for plain text', () => {
    const result = renderRichText('hello')
    expect(result).toEqual({ text: 'hello' })
  })

  it('returns html for HTML content', () => {
    const result = renderRichText('<p>hello</p>')
    expect(result).toHaveProperty('html')
    expect(result.html).toContain('hello')
  })

  it('sanitizes HTML content', () => {
    const result = renderRichText('<script>alert(1)</script><p>safe</p>')
    expect(result.html).not.toContain('script')
    expect(result.html).toContain('safe')
  })

  it('uses default text when input is empty', () => {
    const result = renderRichText('', 'fallback')
    expect(result).toEqual({ text: 'fallback' })
  })
})
