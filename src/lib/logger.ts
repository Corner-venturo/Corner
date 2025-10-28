/**
 * Venturo 統一日誌系統
 *
 * 功能：
 * - 開發環境：顯示所有日誌
 * - 生產環境：只顯示 warn 和 error
 * - 為未來 Sentry 整合預留接口
 */

type _LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogMeta {
  [key: string]: unknown;
}

class AppLogger {
  private isDev = process.env.NODE_ENV === 'development';

  /**
   * 除錯訊息（僅開發環境）
   */
  debug(message: string, meta?: LogMeta) {
    if (this.isDev) {
    }
  }

  /**
   * 一般訊息
   */
  info(message: string, meta?: LogMeta) {
    if (this.isDev) {
    }
  }

  /**
   * 警告訊息
   */
  warn(message: string, meta?: LogMeta) {
      }

  /**
   * 錯誤訊息
   */
  error(message: string, meta?: LogMeta) {
        // 生產環境可整合 Sentry
    if (!this.isDev && typeof window !== 'undefined') {
      // 整合 Sentry
      // Sentry.captureException(new Error(message), { extra: meta });
    }
  }
}

export const logger = new AppLogger();
