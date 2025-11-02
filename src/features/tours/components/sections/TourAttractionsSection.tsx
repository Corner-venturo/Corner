import { motion } from 'framer-motion'
import { FocusCards } from '@/components/ui/focus-cards'

interface TourAttractionsSectionProps {
  data: any
  viewMode: 'desktop' | 'mobile'
  attractionsProgress: number
}

export function TourAttractionsSection({
  data,
  viewMode,
  attractionsProgress,
}: TourAttractionsSectionProps) {
  const focusCards = data.focusCards || []

  return (
    <section
      id="attractions"
      className="py-12 bg-white"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <h2 className="text-2xl sm:text-4xl font-bold text-morandi-primary">
            精選景點
          </h2>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.8, ease: 'easeOut' }}
        >
          <FocusCards cards={focusCards} viewMode={viewMode} />
        </motion.div>
      </div>
    </section>
  )
}
