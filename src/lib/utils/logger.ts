/**
 * Safe Logger for SSR
 * 防止 Next.js SSR 時的 console 錯誤
 * 使用動態引用避免 Turbopack 靜態分析錯誤
 */

const isDevelopment = process.env.NODE_ENV === 'development'
const isBrowser = typeof window !== 'undefined'

// 動態獲取 console，避免 SSR 編譯時的靜態分析
const getConsole = () => {
  if (!isBrowser) return null
  return typeof window !== 'undefined' ? window.console : null
}

export const logger = {
  log: (...args: unknown[]) => {
    if (isDevelopment && isBrowser) {
      const c = getConsole()
      c?.log(...args)
    }
  },

  error: (...args: unknown[]) => {
    if (isDevelopment && isBrowser) {
      const c = getConsole()
      c?.error(...args)
    }
  },

  warn: (...args: unknown[]) => {
    if (isDevelopment && isBrowser) {
      const c = getConsole()
      c?.warn(...args)
    }
  },

  info: (...args: unknown[]) => {
    if (isDevelopment && isBrowser) {
      const c = getConsole()
      c?.info(...args)
    }
  },

  debug: (...args: unknown[]) => {
    if (isDevelopment && isBrowser) {
      const c = getConsole()
      c?.debug(...args)
    }
  },
}
