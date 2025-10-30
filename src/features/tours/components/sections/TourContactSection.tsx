import { motion } from 'framer-motion'

interface TourContactSectionProps {
  data: any
  viewMode: 'desktop' | 'mobile'
}

export function TourContactSection({ data, viewMode }: TourContactSectionProps) {
  return (
    <section
      id="contact"
      className={
        viewMode === 'mobile'
          ? 'bg-gradient-to-br from-blue-600 to-indigo-600 py-12'
          : 'bg-gradient-to-br from-blue-600 to-indigo-600 py-20'
      }
    >
      <div className={viewMode === 'mobile' ? 'px-4' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2
            className={
              viewMode === 'mobile'
                ? 'text-2xl font-bold text-white mb-4'
                : 'text-4xl font-bold text-white mb-4'
            }
          >
            聯絡我們
          </h2>
          <p className="text-xl text-blue-100">有任何問題歡迎隨時聯繫</p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center"
          >
            <div className="text-4xl mb-4">👤</div>
            <h3 className="text-xl font-bold text-white mb-2">領隊</h3>
            <p className="text-blue-100">{data.leader?.name || '待定'}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center"
          >
            <div className="text-4xl mb-4">📱</div>
            <h3 className="text-xl font-bold text-white mb-2">國內電話</h3>
            <p className="text-blue-100">{data.leader?.domesticPhone || '待定'}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center"
          >
            <div className="text-4xl mb-4">📞</div>
            <h3 className="text-xl font-bold text-white mb-2">國外電話</h3>
            <p className="text-blue-100">{data.leader?.overseasPhone || '待定'}</p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
