'use client'

import React from 'react'
import { Plane } from 'lucide-react'
import { PnrForm } from './pnr/PnrForm'
import { PnrPreview } from './pnr/PnrPreview'
import { usePnrQuickAction } from './pnr/hooks/usePnrQuickAction'
import type { Todo } from '@/stores/types'

interface QuickPNRProps {
  todo?: Todo
  onUpdate?: (updates: Partial<Todo>) => void
  onClose?: () => void
}

export function QuickPNR({ todo, onUpdate, onClose }: QuickPNRProps) {
  const {
    rawPNR,
    isParsing,
    parsedData,
    showAdvanced,
    validation,
    setRawPNR,
    setShowAdvanced,
    handleParse,
    handleAddDeadline,
    handleAddToCalendar,
    handleReset,
  } = usePnrQuickAction({ todo, onUpdate, onClose })

  return (
    <div className="space-y-4">
      {/* 標題 */}
      <div className="flex items-center gap-2 pb-3 border-b border-morandi-container/20">
        <div className="p-1.5 bg-morandi-sky/10 rounded-lg">
          <Plane size={16} className="text-morandi-sky" />
        </div>
        <div>
          <h5 className="text-sm font-semibold text-morandi-primary">快速 PNR</h5>
          <p className="text-xs text-morandi-secondary">貼上 Amadeus 電報進行解析</p>
        </div>
      </div>

      {/* 電報輸入表單 */}
      {!parsedData && (
        <PnrForm
          rawPNR={rawPNR}
          isParsing={isParsing}
          validation={validation}
          onRawPNRChange={setRawPNR}
          onParse={handleParse}
        />
      )}

      {/* 解析結果預覽 */}
      {parsedData && (
        <PnrPreview
          parsedData={parsedData}
          showAdvanced={showAdvanced}
          onToggleAdvanced={() => setShowAdvanced(!showAdvanced)}
          onReset={handleReset}
          onAddDeadline={handleAddDeadline}
          onAddToCalendar={handleAddToCalendar}
          canAddDeadline={!!onUpdate}
        />
      )}
    </div>
  )
}
