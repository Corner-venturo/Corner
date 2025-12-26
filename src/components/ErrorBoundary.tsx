'use client'

import React from 'react'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
        <div className="min-h-screen flex items-center justify-center bg-morandi-red/5">
          <div className="max-w-2xl w-full mx-4 p-6 bg-background rounded-lg shadow-lg border border-morandi-red/10">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-8 h-8 text-morandi-red" />
              <h1 className="text-2xl font-bold text-morandi-red">發生錯誤</h1>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-morandi-red/10 rounded-md">
                <p className="text-morandi-red font-semibold mb-2">錯誤訊息：</p>
                <code className="text-sm text-morandi-red">{this.state.error?.message}</code>
              </div>

              {process.env.NODE_ENV === 'development' && (
                <>
                  <div className="p-4 bg-muted rounded-md">
                    <p className="text-foreground font-semibold mb-2">錯誤堆疊：</p>
                    <pre className="text-xs text-foreground overflow-auto max-h-48">
                      {this.state.error?.stack}
                    </pre>
                  </div>

                  <div className="p-4 bg-muted rounded-md">
                    <p className="text-foreground font-semibold mb-2">組件堆疊：</p>
                    <pre className="text-xs text-foreground overflow-auto max-h-48">
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </div>
                </>
              )}

              <Button
                onClick={() => window.location.reload()}
                variant="secondary"
                className="w-full"
              >
                重新載入頁面
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
