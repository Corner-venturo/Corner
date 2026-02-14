'use client'

import React from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Plane, CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react'
import type { validateAmadeusPNR } from '@/lib/pnr-parser'
import { PNR_LABELS } from './constants/labels'

interface PnrFormProps {
  rawPNR: string
  isParsing: boolean
  validation: ReturnType<typeof validateAmadeusPNR> | null
  onRawPNRChange: (value: string) => void
  onParse: () => void
}

export function PnrForm({
  rawPNR,
  isParsing,
  validation,
  onRawPNRChange,
  onParse,
}: PnrFormProps) {
  return (
    <div className="space-y-4">
      {/* 電報輸入 */}
      <div>
        <label className="block text-xs font-medium text-morandi-primary mb-1">
          Amadeus 電報內容
          {validation && (
            <span className={`ml-2 ${validation.isValid ? 'text-morandi-success' : validation.errors.length > 0 ? 'text-morandi-alert' : 'text-morandi-gold'}`}>
              {validation.isValid ? (
                <span className="inline-flex items-center gap-1">
                  <CheckCircle2 size={12} />
                  {PNR_LABELS.LABEL_5474}
                </span>
              ) : validation.errors.length > 0 ? (
                <span className="inline-flex items-center gap-1">
                  <XCircle size={12} />
                  {validation.errors[0]}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1">
                  <AlertTriangle size={12} />
                  {validation.warnings.length} 個警告
                </span>
              )}
            </span>
          )}
        </label>
        <Textarea
          placeholder={`範例：
RP/TPEW123ML/TPEW123ML        AA/SU  16NOV25/1238Z   FUM2GY
1.WU/MINGTUNG  2.CHANG/TSEYUN
3  BR 116 Q 15JAN 4 TPECTS HK2  0930 1405  15JAN  E  BR/FUM2GY
SRVGML/S3/P1
OSBR PASSENGER IS VIP
OPW-20NOV:2038/1C7/BR REQUIRES TICKET ON OR BEFORE 23NOV:2038
AP TPE 02-2712-8888`}
          rows={10}
          className={`shadow-sm text-xs font-mono transition-colors ${
            validation
              ? validation.isValid
                ? 'border-morandi-success/50 focus:border-morandi-success'
                : validation.errors.length > 0
                ? 'border-morandi-alert/50 focus:border-morandi-alert'
                : 'border-morandi-gold/50 focus:border-morandi-gold'
              : ''
          }`}
          value={rawPNR}
          onChange={e => onRawPNRChange(e.target.value)}
        />

        {/* 即時驗證提示 */}
        {validation && (validation.errors.length > 0 || validation.warnings.length > 0 || validation.suggestions.length > 0) && (
          <div className="mt-2 space-y-1">
            {validation.errors.map((error, idx) => (
              <div key={idx} className="flex items-center gap-1 text-xs text-morandi-alert">
                <XCircle size={10} />
                {error}
              </div>
            ))}
            {validation.warnings.map((warning, idx) => (
              <div key={idx} className="flex items-center gap-1 text-xs text-morandi-gold">
                <AlertTriangle size={10} />
                {warning}
              </div>
            ))}
            {validation.suggestions.map((suggestion, idx) => (
              <div key={idx} className="flex items-center gap-1 text-xs text-morandi-secondary">
                <Info size={10} />
                {suggestion}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 解析按鈕 */}
      <Button
        onClick={onParse}
        disabled={isParsing || !rawPNR.trim() || !!(validation && !validation.isValid)}
        className={`w-full shadow-md h-9 text-xs transition-colors ${
          validation?.isValid
            ? 'bg-morandi-success hover:bg-morandi-success/90'
            : 'bg-morandi-sky hover:bg-morandi-sky/90'
        }`}
      >
        <Plane size={14} className="mr-1.5" />
        {isParsing ? '解析中...' : validation?.isValid ? '解析電報 (驗證通過)' : '解析電報'}
      </Button>
    </div>
  )
}
