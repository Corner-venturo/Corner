'use client'

import { motion } from 'framer-motion'
import { Plane } from 'lucide-react'
import { FlightCardProps } from './types'

export function OriginalFlightCard({
  flight,
  type,
  viewMode,
}: FlightCardProps) {
  const isOutbound = type === 'outbound'

  return (
    <motion.div
      initial={{ opacity: 0, x: isOutbound ? -20 : 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      className="bg-card rounded-2xl shadow-lg p-6 border border-morandi-gold/20"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-morandi-gold to-morandi-gold/80 rounded-xl flex items-center justify-center shadow-lg">
          <Plane className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="text-xs text-morandi-secondary">{isOutbound ? '去程航班' : '回程航班'}</div>
          <div className="text-xl font-bold text-morandi-primary">
            {flight?.airline || '--'} {flight?.flightNumber || '--'}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="text-xs text-morandi-secondary mb-1">出發</div>
            <div className="text-2xl font-bold text-morandi-primary">
              {flight?.departureAirport || '--'}
            </div>
            <div className="text-base text-morandi-gold font-semibold">
              {flight?.departureTime || '--:--'}
            </div>
            <div className="text-xs text-morandi-secondary mt-0.5">
              {flight?.departureDate || '--/--'}
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center px-3">
            <div className="text-xs text-morandi-secondary mb-3">飛行時間</div>
            <div className="w-full flex items-center justify-center gap-2 my-2">
              <div className="flex-1 border-t-2 border-dashed border-morandi-container" />
              <div className="bg-morandi-gold/10 px-2 py-1 rounded-full">
                <Plane className="w-3 h-3 text-morandi-gold" />
              </div>
              <div className="flex-1 border-t-2 border-dashed border-morandi-container" />
            </div>
            <div className="text-xs font-semibold text-morandi-primary mt-3">
              {flight?.duration || '--'}
            </div>
          </div>

          <div className="flex-1 text-right">
            <div className="text-xs text-morandi-secondary mb-1">抵達</div>
            <div className="text-2xl font-bold text-morandi-primary">
              {flight?.arrivalAirport || '--'}
            </div>
            <div className="text-base text-morandi-gold font-semibold">
              {flight?.arrivalTime || '--:--'}
            </div>
            <div className="text-xs text-morandi-secondary mt-0.5">當地時間</div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
