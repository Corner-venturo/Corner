'use client'

import { ModuleError } from '@/components/module-error'

export default function MTodosError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <ModuleError error={error} reset={reset} moduleName="MTodos" />
}
