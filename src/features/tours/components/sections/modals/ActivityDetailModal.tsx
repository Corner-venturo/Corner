'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { LUXURY, ActivityInfo } from '../utils/itineraryLuxuryUtils'

interface ActivityDetailModalProps {
  activity: ActivityInfo | null
  onClose: () => void
}

export function ActivityDetailModal({
  activity,
  onClose,
}: ActivityDetailModalProps) {
  return (
    <AnimatePresence>
      {activity && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl relative"
            onClick={e => e.stopPropagation()}
          >
            {/* X 關閉按鈕 */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-morandi-secondary" />
            </button>

            {activity.image && (
              <div className="relative h-48">
                <img
                  src={activity.image}
                  alt={activity.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 text-white">
                  <h3
                    className="text-xl font-bold"
                    style={{ fontFamily: "'Noto Serif TC', serif" }}
                  >
                    {activity.title}
                  </h3>
                </div>
              </div>
            )}
            <div className="p-6">
              {!activity.image && (
                <h3
                  className="text-xl font-bold mb-4 pr-8"
                  style={{
                    color: LUXURY.text,
                    fontFamily: "'Noto Serif TC', serif"
                  }}
                >
                  {activity.title}
                </h3>
              )}
              {activity.description && (
                <p
                  className="leading-relaxed"
                  style={{ color: LUXURY.muted }}
                >
                  {activity.description}
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
