'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'
import { ERROR_PAGE_LABELS } from './constants/labels'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // 記錄嚴重錯誤到 Sentry
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="zh-TW">
      <head>
        <title>{ERROR_PAGE_LABELS.LABEL_4210}</title>
      </head>
      <body style={{ margin: 0, fontFamily: "'Noto Sans TC', sans-serif" }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            backgroundColor: '#0f172a',
          }}
        >
          <div
            style={{
              maxWidth: '28rem',
              width: '100%',
              textAlign: 'center',
              color: '#e2e8f0',
            }}
          >
            {/* 錯誤圖示 */}
            <div style={{ marginBottom: '1.5rem', fontSize: '4rem' }}>⚠️</div>

            {/* 標題 */}
            <h1
              style={{
                fontSize: '1.875rem',
                fontWeight: 'bold',
                marginBottom: '0.5rem',
              }}
            >
              {ERROR_PAGE_LABELS.LABEL_3257}
            </h1>

            {/* 描述 */}
            <p
              style={{
                color: '#94a3b8',
                marginBottom: '2rem',
              }}
            >
              {ERROR_PAGE_LABELS.LABEL_4904}
            </p>

            {/* 錯誤訊息（開發模式） */}
            {process.env.NODE_ENV === 'development' && (
              <div
                style={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  marginBottom: '1.5rem',
                  textAlign: 'left',
                }}
              >
                <p
                  style={{
                    fontSize: '0.875rem',
                    fontFamily: 'monospace',
                    color: '#ef4444',
                    wordBreak: 'break-word',
                  }}
                >
                  {error.message}
                </p>
              </div>
            )}

            {/* 重試按鈕 */}
            <button
              onClick={reset}
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                padding: '0.5rem 1.5rem',
                borderRadius: '0.375rem',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '500',
              }}
            >
              {ERROR_PAGE_LABELS.LOADING_1029}
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
