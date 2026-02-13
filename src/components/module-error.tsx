'use client'

import { useEffect } from 'react'
import { logger } from '@/lib/utils/logger'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface ModuleErrorProps {
  error: Error & { digest?: string }
  reset: () => void
  moduleName?: string
}

export function ModuleError({ error, reset, moduleName }: ModuleErrorProps) {
  useEffect(() => {
    logger.error(`[${moduleName ?? 'Module'}] Error:`, error)
  }, [error, moduleName])

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-6">
      <div className="rounded-full bg-status-danger-bg p-4">
        <AlertCircle className="h-8 w-8 text-status-danger" />
      </div>
      <div className="text-center space-y-1">
        <h2 className="text-lg font-semibold text-foreground">此模組發生錯誤</h2>
        <p className="text-sm text-muted-foreground">其他功能仍可正常使用</p>
      </div>
      {process.env.NODE_ENV === 'development' && (
        <p className="text-xs font-mono text-destructive max-w-md text-center break-words">
          {error.message}
        </p>
      )}
      <Button onClick={reset} size="sm" className="gap-2">
        <RefreshCw className="h-4 w-4" />
        重試
      </Button>
    </div>
  )
}
