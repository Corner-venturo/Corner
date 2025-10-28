import { motion } from "framer-motion";

interface TourLeaderSectionProps {
  data: any;
  viewMode: 'desktop' | 'mobile';
}

export function TourLeaderSection({ data, viewMode }: TourLeaderSectionProps) {
  return (
    <section className="bg-white pt-8 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className={viewMode === 'mobile' ? 'text-2xl font-bold text-morandi-primary mb-4' : 'text-4xl font-bold text-morandi-primary mb-4'}>
            領隊與集合資訊
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* 領隊資訊 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl shadow-lg p-8 border border-border"
          >
            <h3 className="text-2xl font-bold text-morandi-primary mb-6 flex items-center gap-3">
              <span className="text-3xl">👤</span>
              領隊資訊
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-morandi-secondary mb-1">領隊姓名</p>
                <p className="text-lg font-semibold text-morandi-primary">{data.leader?.name || "待定"}</p>
              </div>
              <div>
                <p className="text-sm text-morandi-secondary mb-1">國內電話</p>
                <p className="text-lg font-semibold text-morandi-primary">{data.leader?.domesticPhone || "待定"}</p>
              </div>
              <div>
                <p className="text-sm text-morandi-secondary mb-1">國外電話</p>
                <p className="text-lg font-semibold text-morandi-primary">{data.leader?.overseasPhone || "待定"}</p>
              </div>
            </div>
          </motion.div>

          {/* 集合資訊 */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl shadow-lg p-8 border border-border"
          >
            <h3 className="text-2xl font-bold text-morandi-primary mb-6 flex items-center gap-3">
              <span className="text-3xl">📍</span>
              集合資訊
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-morandi-secondary mb-1">集合時間</p>
                <p className="text-xl font-semibold text-blue-600">
                  {data.meetingInfo?.time || "待定"}
                </p>
              </div>
              <div>
                <p className="text-sm text-morandi-secondary mb-1">集合地點</p>
                <p className="text-lg font-semibold text-morandi-primary">
                  {data.meetingInfo?.location || "待定"}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
