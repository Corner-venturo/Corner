import { motion } from 'framer-motion'
import { Plane } from 'lucide-react'

interface FlightInfo {
  airline?: string | null
  flightNumber?: string | null
  departureAirport?: string | null
  departureTime?: string | null
  departureDate?: string | null
  arrivalAirport?: string | null
  arrivalTime?: string | null
  duration?: string | null
}

interface TourDisplayData {
  outboundFlight?: FlightInfo | null
  returnFlight?: FlightInfo | null
}

interface TourFlightSectionProps {
  data: TourDisplayData
  viewMode: 'desktop' | 'mobile'
}

export function TourFlightSection({ data, viewMode }: TourFlightSectionProps) {
  return (
    <section
      id="flight"
      className={viewMode === 'mobile' ? 'pt-4 pb-8 bg-white' : 'pt-8 pb-16 bg-white'}
    >
      <div className={viewMode === 'mobile' ? 'px-4' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'}>
        <div
          className={
            viewMode === 'mobile'
              ? 'grid grid-cols-1 gap-4'
              : 'grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6'
          }
        >
          {/* 去程航班 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl shadow-xl p-6 border border-morandi-gold/20"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-morandi-gold to-morandi-gold/80 rounded-xl flex items-center justify-center shadow-lg">
                <Plane className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-xs text-morandi-secondary">去程航班</div>
                <div className="text-xl font-bold text-morandi-primary">
                  {data.outboundFlight?.airline || '中華航空'}{' '}
                  {data.outboundFlight?.flightNumber || 'CI110'}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-xs text-morandi-secondary mb-1">出發</div>
                  <div className="text-2xl font-bold text-morandi-primary">
                    {data.outboundFlight?.departureAirport || 'TPE'}
                  </div>
                  <div className="text-base text-morandi-gold font-semibold">
                    {data.outboundFlight?.departureTime || '06:50'}
                  </div>
                  <div className="text-xs text-morandi-secondary mt-0.5">
                    {data.outboundFlight?.departureDate || '10/21'}
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
                    {data.outboundFlight?.duration || '2小時5分'}
                  </div>
                </div>

                <div className="flex-1 text-right">
                  <div className="text-xs text-morandi-secondary mb-1">抵達</div>
                  <div className="text-2xl font-bold text-morandi-primary">
                    {data.outboundFlight?.arrivalAirport || 'FUK'}
                  </div>
                  <div className="text-base text-morandi-gold font-semibold">
                    {data.outboundFlight?.arrivalTime || '09:55'}
                  </div>
                  <div className="text-xs text-morandi-secondary mt-0.5">當地時間</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 回程航班 */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-xl p-6 border border-morandi-secondary/20"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-morandi-secondary to-morandi-secondary/80 rounded-xl flex items-center justify-center shadow-lg">
                <Plane className="w-6 h-6 text-white -scale-x-100" />
              </div>
              <div>
                <div className="text-xs text-morandi-secondary">回程航班</div>
                <div className="text-xl font-bold text-morandi-primary">
                  {data.returnFlight?.airline || '中華航空'}{' '}
                  {data.returnFlight?.flightNumber || 'CI111'}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-xs text-morandi-secondary mb-1">出發</div>
                  <div className="text-2xl font-bold text-morandi-primary">
                    {data.returnFlight?.departureAirport || 'FUK'}
                  </div>
                  <div className="text-base text-morandi-secondary font-semibold">
                    {data.returnFlight?.departureTime || '11:00'}
                  </div>
                  <div className="text-xs text-morandi-secondary mt-0.5">
                    {data.returnFlight?.departureDate || '10/25'}
                  </div>
                </div>

                <div className="flex-1 flex flex-col items-center px-3">
                  <div className="text-xs text-morandi-secondary mb-3">飛行時間</div>
                  <div className="w-full flex items-center justify-center gap-2 my-2">
                    <div className="flex-1 border-t-2 border-dashed border-morandi-container" />
                    <div className="bg-morandi-secondary/10 px-2 py-1 rounded-full">
                      <Plane className="w-3 h-3 text-morandi-secondary -scale-x-100" />
                    </div>
                    <div className="flex-1 border-t-2 border-dashed border-morandi-container" />
                  </div>
                  <div className="text-xs font-semibold text-morandi-primary mt-3">
                    {data.returnFlight?.duration || '2小時30分'}
                  </div>
                </div>

                <div className="flex-1 text-right">
                  <div className="text-xs text-morandi-secondary mb-1">抵達</div>
                  <div className="text-2xl font-bold text-morandi-primary">
                    {data.returnFlight?.arrivalAirport || 'TPE'}
                  </div>
                  <div className="text-base text-morandi-secondary font-semibold">
                    {data.returnFlight?.arrivalTime || '12:30'}
                  </div>
                  <div className="text-xs text-morandi-secondary mt-0.5">台灣時間</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
