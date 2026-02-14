'use client'

import { FLIGHT_SECTION_LABELS } from '../../constants/labels'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Loader2, Plane } from 'lucide-react'
import { FlightInfo } from '@/stores/types'
import { COMP_TOURS_LABELS, FLIGHT_INFO_SECTION_LABELS } from '../../constants/labels'

interface FlightInfoSectionProps {
  outboundFlight: FlightInfo
  returnFlight: FlightInfo
  loadingOutbound: boolean
  loadingReturn: boolean
  onUpdateFlight: (flightType: 'outboundFlight' | 'returnFlight', field: keyof FlightInfo, value: string) => void
  onSearchOutbound: () => void
  onSearchReturn: () => void
}

export function FlightInfoSection({
  outboundFlight,
  returnFlight,
  loadingOutbound,
  loadingReturn,
  onUpdateFlight,
  onSearchOutbound,
  onSearchReturn,
}: FlightInfoSectionProps) {
  return (
    <div className="border-t pt-4">
      <div className="flex items-center gap-2 mb-3">
        <Plane className="w-4 h-4 text-morandi-gold" />
        <label className="text-sm font-medium text-morandi-primary">{FLIGHT_INFO_SECTION_LABELS.航班資訊_選填}</label>
      </div>

      {/* 去程航班 */}
      <div className="bg-morandi-container/30 p-3 rounded-lg mb-3">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-bold text-morandi-primary">{FLIGHT_INFO_SECTION_LABELS.去程航班}</h4>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onSearchOutbound}
            disabled={loadingOutbound || !outboundFlight.flightNumber}
            className="h-7 text-xs gap-1"
          >
            {loadingOutbound ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Search size={12} />
            )}
            {FLIGHT_INFO_SECTION_LABELS.查詢航班}
          </Button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <div>
            <label className="block text-[10px] font-medium text-morandi-primary mb-0.5">{FLIGHT_SECTION_LABELS.FLIGHT_NUMBER}</label>
            <Input
              value={outboundFlight.flightNumber}
              onChange={e => onUpdateFlight('outboundFlight', 'flightNumber', e.target.value)}
              placeholder="BR158"
              className="text-xs h-8"
            />
          </div>
          <div>
            <label className="block text-[10px] font-medium text-morandi-primary mb-0.5">{FLIGHT_SECTION_LABELS.AIRLINE}</label>
            <Input
              value={outboundFlight.airline}
              onChange={e => onUpdateFlight('outboundFlight', 'airline', e.target.value)}
              placeholder={COMP_TOURS_LABELS.長榮航空}
              className="text-xs h-8"
            />
          </div>
          <div>
            <label className="block text-[10px] font-medium text-morandi-primary mb-0.5">{FLIGHT_SECTION_LABELS.DEPARTURE_AIRPORT}</label>
            <Input
              value={outboundFlight.departureAirport}
              onChange={e => onUpdateFlight('outboundFlight', 'departureAirport', e.target.value)}
              placeholder="TPE"
              className="text-xs h-8"
            />
          </div>
          <div>
            <label className="block text-[10px] font-medium text-morandi-primary mb-0.5">{FLIGHT_SECTION_LABELS.ARRIVAL_AIRPORT}</label>
            <Input
              value={outboundFlight.arrivalAirport}
              onChange={e => onUpdateFlight('outboundFlight', 'arrivalAirport', e.target.value)}
              placeholder="NRT"
              className="text-xs h-8"
            />
          </div>
          <div>
            <label className="block text-[10px] font-medium text-morandi-primary mb-0.5">{FLIGHT_SECTION_LABELS.DEPARTURE_TIME}</label>
            <Input
              value={outboundFlight.departureTime}
              onChange={e => onUpdateFlight('outboundFlight', 'departureTime', e.target.value)}
              placeholder="08:30"
              className="text-xs h-8"
            />
          </div>
          <div>
            <label className="block text-[10px] font-medium text-morandi-primary mb-0.5">{FLIGHT_SECTION_LABELS.ARRIVAL_TIME}</label>
            <Input
              value={outboundFlight.arrivalTime}
              onChange={e => onUpdateFlight('outboundFlight', 'arrivalTime', e.target.value)}
              placeholder="12:30"
              className="text-xs h-8"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-[10px] font-medium text-morandi-primary mb-0.5">{FLIGHT_SECTION_LABELS.FLIGHT_DURATION}</label>
            <Input
              value={outboundFlight.duration || ''}
              onChange={e => onUpdateFlight('outboundFlight', 'duration', e.target.value)}
              placeholder="3h 30m"
              className="text-xs h-8"
            />
          </div>
        </div>
      </div>

      {/* 回程航班 */}
      <div className="bg-morandi-container/20 p-3 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-bold text-morandi-primary">{FLIGHT_SECTION_LABELS.RETURN_FLIGHT}</h4>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onSearchReturn}
            disabled={loadingReturn || !returnFlight.flightNumber}
            className="h-7 text-xs gap-1"
          >
            {loadingReturn ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Search size={12} />
            )}
            查詢航班
          </Button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <div>
            <label className="block text-[10px] font-medium text-morandi-primary mb-0.5">{FLIGHT_SECTION_LABELS.FLIGHT_NUMBER}</label>
            <Input
              value={returnFlight.flightNumber}
              onChange={e => onUpdateFlight('returnFlight', 'flightNumber', e.target.value)}
              placeholder="BR157"
              className="text-xs h-8"
            />
          </div>
          <div>
            <label className="block text-[10px] font-medium text-morandi-primary mb-0.5">{FLIGHT_SECTION_LABELS.AIRLINE}</label>
            <Input
              value={returnFlight.airline}
              onChange={e => onUpdateFlight('returnFlight', 'airline', e.target.value)}
              placeholder={COMP_TOURS_LABELS.長榮航空}
              className="text-xs h-8"
            />
          </div>
          <div>
            <label className="block text-[10px] font-medium text-morandi-primary mb-0.5">{FLIGHT_SECTION_LABELS.DEPARTURE_AIRPORT}</label>
            <Input
              value={returnFlight.departureAirport}
              onChange={e => onUpdateFlight('returnFlight', 'departureAirport', e.target.value)}
              placeholder="NRT"
              className="text-xs h-8"
            />
          </div>
          <div>
            <label className="block text-[10px] font-medium text-morandi-primary mb-0.5">{FLIGHT_SECTION_LABELS.ARRIVAL_AIRPORT}</label>
            <Input
              value={returnFlight.arrivalAirport}
              onChange={e => onUpdateFlight('returnFlight', 'arrivalAirport', e.target.value)}
              placeholder="TPE"
              className="text-xs h-8"
            />
          </div>
          <div>
            <label className="block text-[10px] font-medium text-morandi-primary mb-0.5">{FLIGHT_SECTION_LABELS.DEPARTURE_TIME}</label>
            <Input
              value={returnFlight.departureTime}
              onChange={e => onUpdateFlight('returnFlight', 'departureTime', e.target.value)}
              placeholder="14:00"
              className="text-xs h-8"
            />
          </div>
          <div>
            <label className="block text-[10px] font-medium text-morandi-primary mb-0.5">{FLIGHT_SECTION_LABELS.ARRIVAL_TIME}</label>
            <Input
              value={returnFlight.arrivalTime}
              onChange={e => onUpdateFlight('returnFlight', 'arrivalTime', e.target.value)}
              placeholder="17:00"
              className="text-xs h-8"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-[10px] font-medium text-morandi-primary mb-0.5">{FLIGHT_SECTION_LABELS.FLIGHT_DURATION}</label>
            <Input
              value={returnFlight.duration || ''}
              onChange={e => onUpdateFlight('returnFlight', 'duration', e.target.value)}
              placeholder="3h 30m"
              className="text-xs h-8"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
