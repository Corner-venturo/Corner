import { motion } from 'framer-motion'

interface HotelData {
  image?: string
  name?: string
  description?: string
}

interface TourData {
  showHotels?: boolean
  hotels?: HotelData[]
}

interface TourHotelsSectionProps {
  data: TourData
  viewMode: 'desktop' | 'mobile'
}

export function TourHotelsSection({ data, viewMode }: TourHotelsSectionProps) {
  const hotels = data.hotels || []

  if (!data.showHotels && hotels.length === 0) {
    return null
  }

  return (
    <section className="bg-white pt-8 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2
            className={
              viewMode === 'mobile'
                ? 'text-2xl font-bold text-morandi-primary mb-4'
                : 'text-4xl font-bold text-morandi-primary mb-4'
            }
          >
            飯店資訊
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {hotels.map((hotel, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden border border-border"
            >
              {hotel.image && (
                <div className="aspect-video w-full overflow-hidden">
                  <img src={hotel.image} alt={hotel.name} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-6">
                <h3 className="text-xl font-bold text-morandi-primary mb-3">
                  {hotel.name || '飯店名稱'}
                </h3>
                <p className="text-morandi-secondary leading-relaxed whitespace-pre-wrap">
                  {hotel.description || '飯店簡介...'}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
