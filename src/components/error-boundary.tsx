'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="morandi-card max-w-lg w-full text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-semibold text-morandi-primary">發生錯誤</h1>
              <p className="text-morandi-secondary">
                應用程式遇到未預期的錯誤，請嘗試重新載入頁面。
              </p>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="bg-gray-100 rounded-lg p-4 text-left">
                <h3 className="font-medium text-gray-900 mb-2">錯誤詳情：</h3>
                <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-auto">
                  {this.state.error.message}
                  {this.state.error.stack && (
                    <>
                      {'\n\n'}
                      {this.state.error.stack}
                    </>
                  )}
                </pre>
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                onClick={this.handleReset}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                重試
              </Button>
              <Button
                onClick={() => window.location.reload()}
                className="bg-morandi-gold hover:bg-morandi-gold/80 text-white"
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

// React Hook 版本的錯誤邊界（用於函數組件）
export function withErrorBoundary<T extends object>(
  Component: React.ComponentType<T>,
  fallback?: ReactNode
) {
  return function WrappedComponent(props: T) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}

// 輕量級錯誤邊界（用於小組件）
export function ErrorFallback({ error, resetError }: { error?: Error; resetError?: () => void }) {
  return (
    <div className="morandi-card p-4 text-center space-y-3">
      <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
      <div>
        <h3 className="font-medium text-morandi-primary">載入失敗</h3>
        <p className="text-sm text-morandi-secondary mt-1">{error?.message || '發生未知錯誤'}</p>
      </div>
      {resetError && (
        <Button
          variant="outline"
          size="sm"
          onClick={resetError}
          className="flex items-center gap-1 mx-auto"
        >
          <RefreshCw className="w-3 h-3" />
          重試
        </Button>
      )}
    </div>
  )
}
