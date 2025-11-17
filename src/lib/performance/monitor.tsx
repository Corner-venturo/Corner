/**
 * Performance Monitor
 * 效能監控工具 - 生產環境可用
 */

import { logger } from '@/lib/utils/logger'
import * as React from 'react'

// Window 擴展介面（開發工具）
declare global {
  interface Window {
    __perfMonitor?: PerformanceMonitor
  }
}

interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  context?: Record<string, unknown>
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private readonly maxMetrics = 100
  private enabled = process.env.NODE_ENV === 'development'

  /**
   * 測量函數執行時間
   */
  async measure<T>(
    name: string,
    fn: () => Promise<T> | T,
    context?: Record<string, unknown>
  ): Promise<T> {
    if (!this.enabled) return await fn()

    const start = performance.now()
    try {
      const result = await fn()
      const duration = performance.now() - start

      this.record({
        name,
        value: duration,
        timestamp: Date.now(),
        context,
      })

      // 警告慢速操作
      if (duration > 100) {
        logger.warn(`⚠️ Slow operation: ${name} took ${duration.toFixed(2)}ms`, context)
      }

      return result
    } catch (error) {
      const duration = performance.now() - start
      this.record({
        name: `${name} (error)`,
        value: duration,
        timestamp: Date.now(),
        context: { ...context, error },
      })
      throw error
    }
  }

  /**
   * 測量同步函數
   */
  measureSync<T>(name: string, fn: () => T, context?: Record<string, unknown>): T {
    if (!this.enabled) return fn()

    const start = performance.now()
    const result = fn()
    const duration = performance.now() - start

    this.record({
      name,
      value: duration,
      timestamp: Date.now(),
      context,
    })

    if (duration > 16) {
      // > 1 frame
      logger.warn(`⚠️ Slow sync operation: ${name} took ${duration.toFixed(2)}ms`)
    }

    return result
  }

  /**
   * 記錄效能指標
   */
  record(metric: PerformanceMetric): void {
    this.metrics.push(metric)

    // 保持最多 100 筆記錄
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift()
    }
  }

  /**
   * 取得統計資料
   */
  getStats(name?: string): {
    count: number
    avg: number
    min: number
    max: number
    p95: number
  } | null {
    const filtered = name ? this.metrics.filter(m => m.name === name) : this.metrics

    if (filtered.length === 0) return null

    const values = filtered.map(m => m.value).sort((a, b) => a - b)
    const sum = values.reduce((a, b) => a + b, 0)

    return {
      count: values.length,
      avg: sum / values.length,
      min: values[0]!,
      max: values[values.length - 1]!,
      p95: values[Math.floor(values.length * 0.95)]!,
    }
  }

  /**
   * 取得最慢的操作
   */
  getSlowest(limit = 10): PerformanceMetric[] {
    return [...this.metrics].sort((a, b) => b.value - a.value).slice(0, limit)
  }

  /**
   * 清除所有記錄
   */
  clear(): void {
    this.metrics = []
  }

  /**
   * 匯出報告
   */
  export(): string {
    const grouped = this.metrics.reduce(
      (acc, metric) => {
        if (!acc[metric.name]) {
          acc[metric.name] = []
        }
        acc[metric.name]!.push(metric.value)
        return acc
      },
      {} as Record<string, number[]>
    )

    const report = Object.entries(grouped).map(([name, values]) => {
      const avg = values.reduce((a, b) => a + b, 0) / values.length
      const max = Math.max(...values)
      return `${name}: avg=${avg.toFixed(2)}ms, max=${max.toFixed(2)}ms, count=${values.length}`
    })

    return report.join('\n')
  }

  /**
   * 啟用/停用監控
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }
}

// 全域實例
export const perfMonitor = new PerformanceMonitor()

/**
 * React Component 效能追蹤 HOC
 */
export function withPerformanceTracking<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) {
  const name = componentName || Component.displayName || Component.name || 'Component'

  return function PerformanceTrackedComponent(props: P) {
    const renderStart = performance.now()

    React.useEffect(() => {
      const renderTime = performance.now() - renderStart
      perfMonitor.record({
        name: `Render: ${name}`,
        value: renderTime,
        timestamp: Date.now(),
      })
    })

    return <Component {...props} />
  }
}

/**
 * Hook 效能追蹤
 */
export function usePerformanceTracking(hookName: string) {
  React.useEffect(() => {
    const start = performance.now()
    return () => {
      const duration = performance.now() - start
      if (duration > 50) {
        logger.warn(`⚠️ Slow hook: ${hookName} took ${duration.toFixed(2)}ms`)
      }
    }
  }, [hookName])
}

/**
 * 測量 API 呼叫
 */
export async function measureApiCall<T>(endpoint: string, fn: () => Promise<T>): Promise<T> {
  return perfMonitor.measure(`API: ${endpoint}`, fn, { endpoint })
}

/**
 * Web Vitals 整合
 */
export function reportWebVitals() {
  if (typeof window === 'undefined') return

  // Largest Contentful Paint (LCP)
  const observer = new PerformanceObserver(list => {
    for (const entry of list.getEntries()) {
      perfMonitor.record({
        name: 'LCP',
        value: entry.startTime,
        timestamp: Date.now(),
      })
    }
  })

  try {
    observer.observe({ entryTypes: ['largest-contentful-paint'] })
  } catch {
    // Not supported
  }
}

// 在開發環境自動啟用
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.__perfMonitor = perfMonitor
}
