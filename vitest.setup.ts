import '@testing-library/jest-dom'
import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// Cleanup after each test case (e.g., clearing jsdom)
afterEach(() => {
  cleanup()
})

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
// eslint-disable-next-line no-undef
;(global as any).localStorage = localStorageMock

// Mock IndexedDB
// eslint-disable-next-line no-undef
;(global as any).indexedDB = {}
