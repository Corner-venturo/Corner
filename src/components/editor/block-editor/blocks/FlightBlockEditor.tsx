/**
 * 航班區塊編輯器
 *
 * 編輯去程和回程航班資訊
 */

'use client'

import { useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plane, ArrowRight } from 'lucide-react'
import type { FlightBlockData } from '../types'
import type { FlightInfo, FlightStyleType } from '@/components/editor/tour-form/types'
import { COMP_EDITOR_LABELS } from '../../constants/labels'

interface FlightBlockEditorProps {
  data: FlightBlockData
  onChange: (data: Partial<FlightBlockData>) => void
}

export function FlightBlockEditor({ data, onChange }: FlightBlockEditorProps) {
  const updateFlight = useCallback((
    type: 'outboundFlight' | 'returnFlight',
    field: keyof FlightInfo,
    value: string
  ) => {
    onChange({
      [type]: {
        ...data[type],
        [field]: value,
      },
    })
  }, [data, onChange])

  const renderFlightInputs = (
    type: 'outboundFlight' | 'returnFlight',
    label: string
  ) => {
    const flight = data[type] || {}
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-morandi-primary">
          <Plane size={14} className={type === 'returnFlight' ? 'rotate-180' : ''} />
          {label}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-xs text-morandi-primary mb-1">航空公司</label>
            <Input
              value={flight.airline || ''}
              onChange={e => updateFlight(type, 'airline', e.target.value)}
              placeholder={COMP_EDITOR_LABELS.長榮航空}
              className="h-8 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-morandi-primary mb-1">航班編號</label>
            <Input
              value={flight.flightNumber || ''}
              onChange={e => updateFlight(type, 'flightNumber', e.target.value)}
              placeholder="BR108"
              className="h-8 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-morandi-primary mb-1">飛行時間</label>
            <Input
              value={flight.duration || ''}
              onChange={e => updateFlight(type, 'duration', e.target.value)}
              placeholder="2h 30m"
              className="h-8 text-sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1">
            <label className="block text-xs text-morandi-primary mb-1">起飛機場</label>
            <Input
              value={flight.departureAirport || ''}
              onChange={e => updateFlight(type, 'departureAirport', e.target.value)}
              placeholder={COMP_EDITOR_LABELS.桃園}
              className="h-8 text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-morandi-primary mb-1">起飛時間</label>
            <Input
              value={flight.departureTime || ''}
              onChange={e => updateFlight(type, 'departureTime', e.target.value)}
              placeholder="08:30"
              className="h-8 text-sm"
            />
          </div>
          <ArrowRight size={16} className="text-morandi-secondary mt-4" />
          <div className="flex-1">
            <label className="block text-xs text-morandi-primary mb-1">抵達機場</label>
            <Input
              value={flight.arrivalAirport || ''}
              onChange={e => updateFlight(type, 'arrivalAirport', e.target.value)}
              placeholder={COMP_EDITOR_LABELS.福岡}
              className="h-8 text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-morandi-primary mb-1">抵達時間</label>
            <Input
              value={flight.arrivalTime || ''}
              onChange={e => updateFlight(type, 'arrivalTime', e.target.value)}
              placeholder="11:30"
              className="h-8 text-sm"
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 航班風格 */}
      <div>
        <label className="block text-xs font-medium text-morandi-primary mb-1">航班風格</label>
        <Select
          value={data.flightStyle || 'original'}
          onValueChange={(value) => onChange({ flightStyle: value as FlightStyleType })}
        >
          <SelectTrigger className="h-8 text-sm w-48">
            <SelectValue placeholder={COMP_EDITOR_LABELS.選擇風格} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="original">經典莫蘭迪</SelectItem>
            <SelectItem value="chinese">中國風書法</SelectItem>
            <SelectItem value="japanese">日式和紙</SelectItem>
            <SelectItem value="luxury">奢華質感</SelectItem>
            <SelectItem value="art">藝術雜誌</SelectItem>
            <SelectItem value="dreamscape">夢幻漫遊</SelectItem>
            <SelectItem value="collage">互動拼貼</SelectItem>
            <SelectItem value="none">無航班（國內）</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 去程航班 */}
      {renderFlightInputs('outboundFlight', COMP_EDITOR_LABELS.去程航班)}

      <div className="border-t border-border/50" />

      {/* 回程航班 */}
      {renderFlightInputs('returnFlight', COMP_EDITOR_LABELS.回程航班)}
    </div>
  )
}
