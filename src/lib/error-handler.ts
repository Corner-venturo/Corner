/**
 * 統一的錯誤處理機制
 *
 * 使用範例：
 * import { handleError, AsyncErrorBoundary } from '@/lib/error-handler';
 *
 * try {
 *   await service.create(data);
 * } catch (error) {
 *   handleError(error, 'PaymentService.create');
 * }
 */

import { ValidationError, NotFoundError } from '@/core/errors/app-errors';
import { logger } from '@/lib/utils/logger';

export interface ErrorLogEntry {
  timestamp: string;
  level: 'error' | 'warn' | 'info';
  context: string;
  message: string;
  stack?: string;
  metadata?: Record<string, unknown>;
}

class ErrorHandler {
  private logs: ErrorLogEntry[] = [];
  private maxLogs = 1000;

  /**
   * 處理錯誤並記錄
   */
  handle(error: unknown, context: string, metadata?: Record<string, unknown>): void {
    const entry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      context,
      message: this.extractMessage(error),
      stack: error instanceof Error ? error.stack : undefined,
      metadata,
    };

    this.log(entry);
    this.notifyUser(error, context);

    // 如果是開發環境，直接拋出以便調試
    if (process.env.NODE_ENV === 'development') {
      logger.error(`[${context}]`, error);
    }
  }

  /**
   * 記錄錯誤
   */
  private log(entry: ErrorLogEntry): void {
    this.logs.push(entry);

    // 限制日誌數量
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // 持久化到 localStorage（可選）
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('venturo-error-logs', JSON.stringify(this.logs.slice(-100)));
      } catch (e) {
        // localStorage 可能已滿，忽略
      }
    }
  }

  /**
   * 提取錯誤訊息
   */
  private extractMessage(error: unknown): string {
    if (error instanceof ValidationError) {
      return `驗證錯誤: ${(error as unknown).field} - ${error.message}`;
    }

    if (error instanceof NotFoundError) {
      return `找不到資源: ${(error as unknown).resource} (ID: ${(error as unknown).id})`;
    }

    if (error instanceof Error) {
      return error.message;
    }

    return String(error);
  }

  /**
   * 通知用戶（可擴展為 Toast 通知）
   */
  private notifyUser(error: unknown, context: string): void {
    // TODO: 整合 Toast 通知系統
    const message = this.getUserFriendlyMessage(error);

    // 未來可以這樣：
    // toast.error(message);
    logger.warn(`[用戶通知] ${message}`);
  }

  /**
   * 轉換為用戶友善的錯誤訊息
   */
  private getUserFriendlyMessage(error: unknown): string {
    if (error instanceof ValidationError) {
      return `輸入錯誤：${error.message}`;
    }

    if (error instanceof NotFoundError) {
      return `找不到資料，請重新整理後再試`;
    }

    if (error instanceof Error) {
      // 隱藏技術細節
      if (error.message.includes('network') || error.message.includes('fetch')) {
        return '網路連線異常，請檢查網路後再試';
      }

      if (error.message.includes('timeout')) {
        return '操作逾時，請稍後再試';
      }

      return '操作失敗，請稍後再試';
    }

    return '發生未知錯誤';
  }

  /**
   * 獲取錯誤日誌
   */
  getLogs(limit = 100): ErrorLogEntry[] {
    return this.logs.slice(-limit);
  }

  /**
   * 清除錯誤日誌
   */
  clearLogs(): void {
    this.logs = [];
    if (typeof window !== 'undefined') {
      localStorage.removeItem('venturo-error-logs');
    }
  }

  /**
   * 導出日誌為 JSON（供調試使用）
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// 單例模式
export const errorHandler = new ErrorHandler();

/**
 * 便捷函數：處理錯誤
 */
export function handleError(
  error: unknown,
  context: string,
  metadata?: Record<string, unknown>
): void {
  errorHandler.handle(error, context, metadata);
}

/**
 * 異步操作的錯誤包裝器
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  context: string,
  metadata?: Record<string, unknown>
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    handleError(error, context, metadata);
    return null;
  }
}

/**
 * React Error Boundary 用的錯誤處理
 */
export function handleReactError(
  error: Error,
  errorInfo: { componentStack: string }
): void {
  handleError(error, 'React Error Boundary', {
    componentStack: errorInfo.componentStack,
  });
}
