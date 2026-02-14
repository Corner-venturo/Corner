'use client'

import { ModuleError } from '@/components/module-error'

export default function ErpAccountingReportsTrialBalanceError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <ModuleError error={error} reset={reset} moduleName="ErpAccountingReportsTrialBalance" />
}
