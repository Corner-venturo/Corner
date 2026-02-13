'use client'

import { ModuleError } from '@/components/module-error'

export default function TimeboxError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <ModuleError error={error} reset={reset} moduleName="Timebox" />
}
