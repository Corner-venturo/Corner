import { describe, it, expect } from 'vitest'
import {
  shouldCountPageNumber,
  calculatePageNumber,
  formatPageNumber,
  calculatePageNumberForToc,
} from './page-number'

const pages = [
  { id: 'cover', templateKey: 'cover' },
  { id: 'blank1', templateKey: 'blank' },
  { id: 'toc', templateKey: 'toc' },
  { id: 'day1', templateKey: 'itinerary' },
  { id: 'blank2', templateKey: 'blank' },
  { id: 'day2', templateKey: 'itinerary' },
]

describe('shouldCountPageNumber', () => {
  it('cover does not count', () => {
    expect(shouldCountPageNumber(pages[0], pages)).toBe(false)
  })

  it('blank before toc does not count', () => {
    expect(shouldCountPageNumber(pages[1], pages)).toBe(false)
  })

  it('toc counts', () => {
    expect(shouldCountPageNumber(pages[2], pages)).toBe(true)
  })

  it('content after toc counts', () => {
    expect(shouldCountPageNumber(pages[3], pages)).toBe(true)
  })

  it('blank after toc counts', () => {
    expect(shouldCountPageNumber(pages[4], pages)).toBe(true)
  })
})

describe('calculatePageNumber', () => {
  it('cover returns null', () => {
    expect(calculatePageNumber(0, pages)).toBeNull()
  })

  it('blank before toc returns null', () => {
    expect(calculatePageNumber(1, pages)).toBeNull()
  })

  it('toc is page 1', () => {
    expect(calculatePageNumber(2, pages)).toBe(1)
  })

  it('first content is page 2', () => {
    expect(calculatePageNumber(3, pages)).toBe(2)
  })

  it('blank after toc counts as page 3', () => {
    expect(calculatePageNumber(4, pages)).toBe(3)
  })

  it('last page is page 4', () => {
    expect(calculatePageNumber(5, pages)).toBe(4)
  })

  it('returns null for out-of-bounds index', () => {
    expect(calculatePageNumber(99, pages)).toBeNull()
  })
})

describe('formatPageNumber', () => {
  it('formats single digit', () => {
    expect(formatPageNumber(1)).toBe('p. 01')
  })

  it('formats double digit', () => {
    expect(formatPageNumber(12)).toBe('p. 12')
  })

  it('formats triple digit', () => {
    expect(formatPageNumber(100)).toBe('p. 100')
  })
})

describe('calculatePageNumberForToc', () => {
  it('returns page number for valid page', () => {
    expect(calculatePageNumberForToc('toc', pages)).toBe(1)
    expect(calculatePageNumberForToc('day1', pages)).toBe(2)
  })

  it('returns 0 for non-existent page', () => {
    expect(calculatePageNumberForToc('nonexistent', pages)).toBe(0)
  })

  it('returns 0 for cover (no page number)', () => {
    expect(calculatePageNumberForToc('cover', pages)).toBe(0)
  })
})
