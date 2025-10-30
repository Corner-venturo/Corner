'use client'

import React from 'react'
import { AlertCircle } from 'lucide-react'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    })

    // 將錯誤寫入 localStorage 以便持久化
    const errorLog = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    }

    const existingErrors = localStorage.getItem('errorLog')
    const errors = existingErrors ? JSON.parse(existingErrors) : []
    errors.push(errorLog)
    localStorage.setItem('errorLog', JSON.stringify(errors.slice(-10))) // 只保留最近10個錯誤
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50">
          <div className="max-w-2xl w-full mx-4 p-6 bg-white rounded-lg shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
              <h1 className="text-2xl font-bold text-red-700">發生錯誤</h1>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-red-100 rounded-md">
                <p className="text-red-800 font-semibold mb-2">錯誤訊息：</p>
                <code className="text-sm text-red-700">{this.state.error?.message}</code>
              </div>

              {process.env.NODE_ENV === 'development' && (
                <>
                  <div className="p-4 bg-gray-100 rounded-md">
                    <p className="text-morandi-primary font-semibold mb-2">錯誤堆疊：</p>
                    <pre className="text-xs text-morandi-primary overflow-auto max-h-48">
                      {this.state.error?.stack}
                    </pre>
                  </div>

                  <div className="p-4 bg-gray-100 rounded-md">
                    <p className="text-morandi-primary font-semibold mb-2">組件堆疊：</p>
                    <pre className="text-xs text-morandi-primary overflow-auto max-h-48">
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </div>
                </>
              )}

              <button
                onClick={() => window.location.reload()}
                className="w-full py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                重新載入頁面
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
