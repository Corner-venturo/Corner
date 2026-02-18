import { describe, it, expect } from 'vitest'
import { sanitizeHtml, sanitizeStrict, sanitizeSvg, sanitizeCss } from './sanitize'

describe('sanitizeHtml', () => {
  it('returns empty string for empty input', () => {
    expect(sanitizeHtml('')).toBe('')
  })

  it('returns empty string for null-like input', () => {
    expect(sanitizeHtml(undefined as unknown as string)).toBe('')
  })

  it('preserves safe HTML', () => {
    expect(sanitizeHtml('<p>Hello</p>')).toBe('<p>Hello</p>')
  })

  it('removes script tags', () => {
    expect(sanitizeHtml('<script>alert("xss")</script>')).toBe('')
  })

  it('removes iframe tags', () => {
    expect(sanitizeHtml('<iframe src="evil.com"></iframe>')).toBe('')
  })

  it('removes object tags', () => {
    expect(sanitizeHtml('<object data="evil.swf"></object>')).toBe('')
  })

  it('removes embed tags', () => {
    expect(sanitizeHtml('<embed src="evil.swf">')).toBe('')
  })

  it('removes form tags', () => {
    expect(sanitizeHtml('<form action="evil.com"><input></form>')).toBe('')
  })

  it('removes onclick attribute', () => {
    const result = sanitizeHtml('<div onclick="alert(1)">test</div>')
    expect(result).not.toContain('onclick')
  })

  it('removes onerror attribute', () => {
    const result = sanitizeHtml('<img onerror="alert(1)" src="x">')
    expect(result).not.toContain('onerror')
  })

  it('preserves safe attributes', () => {
    const result = sanitizeHtml('<a href="https://example.com">link</a>')
    expect(result).toContain('href')
  })

  it('preserves formatting tags', () => {
    expect(sanitizeHtml('<strong>bold</strong>')).toBe('<strong>bold</strong>')
  })

  it('preserves list tags', () => {
    const html = '<ul><li>item</li></ul>'
    expect(sanitizeHtml(html)).toBe(html)
  })

  it('removes onload attribute', () => {
    const result = sanitizeHtml('<body onload="alert(1)">test</body>')
    expect(result).not.toContain('onload')
  })
})

describe('sanitizeStrict', () => {
  it('returns empty string for empty input', () => {
    expect(sanitizeStrict('')).toBe('')
  })

  it('returns empty string for falsy input', () => {
    expect(sanitizeStrict(null as unknown as string)).toBe('')
  })

  it('allows p tags', () => {
    expect(sanitizeStrict('<p>text</p>')).toBe('<p>text</p>')
  })

  it('allows strong/bold tags', () => {
    expect(sanitizeStrict('<strong>bold</strong>')).toContain('bold')
  })

  it('allows links with href', () => {
    const result = sanitizeStrict('<a href="https://example.com">link</a>')
    expect(result).toContain('href')
  })

  it('removes div tags', () => {
    const result = sanitizeStrict('<div>text</div>')
    expect(result).not.toContain('<div>')
  })

  it('removes img tags', () => {
    const result = sanitizeStrict('<img src="photo.jpg">')
    expect(result).not.toContain('<img')
  })

  it('removes table tags', () => {
    const result = sanitizeStrict('<table><tr><td>cell</td></tr></table>')
    expect(result).not.toContain('<table')
  })

  it('allows heading tags', () => {
    expect(sanitizeStrict('<h1>Title</h1>')).toBe('<h1>Title</h1>')
  })

  it('allows blockquote', () => {
    expect(sanitizeStrict('<blockquote>quote</blockquote>')).toBe('<blockquote>quote</blockquote>')
  })
})

describe('sanitizeSvg', () => {
  it('returns empty string for empty input', () => {
    expect(sanitizeSvg('')).toBe('')
  })

  it('preserves basic SVG', () => {
    const svg = '<svg><circle cx="50" cy="50" r="40"></circle></svg>'
    const result = sanitizeSvg(svg)
    expect(result).toContain('<svg')
    expect(result).toContain('circle')
  })

  it('removes onclick from SVG elements', () => {
    const result = sanitizeSvg('<svg onclick="alert(1)"><rect></rect></svg>')
    expect(result).not.toContain('onclick')
  })
})

describe('sanitizeCss', () => {
  it('returns empty string for empty input', () => {
    expect(sanitizeCss('')).toBe('')
  })

  it('returns empty string for falsy input', () => {
    expect(sanitizeCss(null as unknown as string)).toBe('')
  })

  it('preserves safe CSS', () => {
    expect(sanitizeCss('color: red; font-size: 14px;')).toBe('color: red; font-size: 14px;')
  })

  it('removes expression()', () => {
    expect(sanitizeCss('width: expression(alert(1))')).not.toContain('expression')
  })

  it('removes javascript: protocol', () => {
    expect(sanitizeCss('background: url(javascript:alert(1))')).not.toContain('javascript')
  })

  it('removes @import url()', () => {
    expect(sanitizeCss('@import url(evil.css)')).not.toContain('@import')
  })

  it('removes behavior:', () => {
    expect(sanitizeCss('behavior: url(evil.htc)')).not.toContain('behavior')
  })

  it('removes -moz-binding:', () => {
    expect(sanitizeCss('-moz-binding: url(evil.xml)')).not.toContain('-moz-binding')
  })

  it('is case-insensitive for expression', () => {
    expect(sanitizeCss('width: EXPRESSION(alert(1))')).not.toContain('EXPRESSION')
  })
})
