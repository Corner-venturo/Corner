'use client'
/**
 * PrintControls - 列印控制按鈕組件（共用）
 */


import React from 'react'
import { Button } from '@/components/ui/button'
import { X, Printer } from 'lucide-react'
import { SHARED_LABELS } from './constants/labels'

interface PrintControlsProps {
  onClose: () => void
  onPrint: () => void
}

export const PrintControls: React.FC<PrintControlsProps> = ({ onClose, onPrint }) => {
  return (
    <div className="flex justify-end gap-2 p-4 print:hidden">
      <Button onClick={onClose} variant="outline" className="gap-2">
        <X className="h-4 w-4" />
        {SHARED_LABELS.CLOSE}
      </Button>
      <Button onClick={onPrint} className="gap-2 bg-morandi-gold hover:bg-morandi-gold-hover text-white">
        <Printer className="h-4 w-4" />
        {SHARED_LABELS.PRINT}
      </Button>
    </div>
  )
}
