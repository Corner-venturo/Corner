'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // 記錄嚴重錯誤
    console.error('Global Error:', error)
  }, [error])

  return (
    <html lang="zh-TW">
      <head>
        <title>系統錯誤</title>
      </head>
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif' }}>
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
              系統發生嚴重錯誤
            </h1>

            {/* 描述 */}
            <p
              style={{
                color: '#94a3b8',
                marginBottom: '2rem',
              }}
            >
              很抱歉，應用程式遇到了無法恢復的錯誤
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
              重新載入應用程式
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
