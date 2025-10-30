import { motion } from 'framer-motion'
import { FocusCards } from '@/components/ui/focus-cards'
import { RefObject } from 'react'

interface TourAttractionsSectionProps {
  data: any
  viewMode: 'desktop' | 'mobile'
  attractionsProgress: number
  galleryRef?: RefObject<HTMLElement>
}

export function TourAttractionsSection({
  data,
  viewMode,
  attractionsProgress,
  galleryRef,
}: TourAttractionsSectionProps) {
  const focusCards = data.focusCards || []

  return (
    <section
      ref={galleryRef}
      id="attractions"
      className={
        viewMode === 'mobile'
          ? 'min-h-screen flex flex-col items-center justify-center py-12'
          : 'pt-8 pb-16 bg-white'
      }
      style={
        viewMode === 'mobile'
          ? {
              backgroundColor: `rgb(${Math.round(255 * (1 - attractionsProgress))}, ${Math.round(255 * (1 - attractionsProgress))}, ${Math.round(255 * (1 - attractionsProgress))})`,
              transition: 'background-color 0.3s ease-out',
            }
          : {}
      }
    >
      <div
        className={viewMode === 'mobile' ? 'px-4 w-full' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className={viewMode === 'mobile' ? 'text-center mb-8' : 'text-center mb-8'}
          style={
            viewMode === 'mobile'
              ? {
                  color: `rgb(${Math.round(255 * attractionsProgress)}, ${Math.round(255 * attractionsProgress)}, ${Math.round(255 * attractionsProgress)})`,
                  transition: 'color 0.3s ease-out',
                }
              : {}
          }
        >
          <h2
            className={
              viewMode === 'mobile'
                ? 'text-2xl font-bold'
                : 'text-4xl font-bold text-morandi-primary'
            }
          >
            精選景點
          </h2>
        </motion.div>
        <motion.div
          initial={viewMode === 'mobile' ? { opacity: 0 } : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.8, ease: 'easeOut' }}
          style={
            viewMode === 'mobile'
              ? {
                  transform: `scale(${0.8 + 0.2 * attractionsProgress})`,
                  transition: 'transform 0.3s ease-out',
                }
              : {}
          }
        >
          <FocusCards cards={focusCards} viewMode={viewMode} />
        </motion.div>
      </div>
    </section>
  )
}
