'use client'

import { ModuleError } from '@/components/module-error'

export default function ErpAccountingSettingsBanksError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <ModuleError error={error} reset={reset} moduleName="ErpAccountingSettingsBanks" />
}
