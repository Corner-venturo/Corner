import { motion } from "framer-motion";

interface TourHeroSectionProps {
  data: any;
  viewMode: 'desktop' | 'mobile';
}

export function TourHeroSection({ data, viewMode }: TourHeroSectionProps) {
  return (
    <section id="top" className="relative h-screen overflow-hidden bg-slate-900">
      {/* 動態背景 */}
      <div className="absolute inset-0">
        <img
          src={data.coverImage || "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=1200&q=75&auto=format&fit=crop"}
          alt="Cover"
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
          style={{ filter: "brightness(0.7)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-black/70" />
      </div>

      {/* 主要內容 */}
      <div className={viewMode === 'mobile' ? 'relative z-10 h-full flex flex-col items-center justify-center px-4' : 'relative z-10 h-full flex flex-col items-center justify-center px-4'}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className={viewMode === 'mobile' ? 'text-center mb-40' : 'text-center mb-16'}
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className={viewMode === 'mobile' ? 'inline-block px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white/90 text-xs font-medium mb-8' : 'inline-block px-4 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white/90 text-xs sm:text-sm font-medium mb-4'}
          >
            {data.tagline || "Venturo Travel 2025 秋季精選"}
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className={viewMode === 'mobile' ? 'text-2xl font-bold text-white mb-4' : 'text-4xl md:text-6xl lg:text-8xl font-bold text-white mb-4'}
          >
            {data.title}
            <br />
            <span className={viewMode === 'mobile' ? 'text-base text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500' : 'text-2xl md:text-4xl lg:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500'}>
              {data.subtitle}
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className={viewMode === 'mobile' ? 'text-xs text-white/80 max-w-3xl mx-auto mb-8 px-4' : 'text-base md:text-xl lg:text-2xl text-white/80 max-w-3xl mx-auto mb-8 px-4'}
          >
            {data.description}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-wrap justify-center gap-4 sm:gap-6 px-4"
          >
            <div className={viewMode === 'mobile' ? 'bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full text-center' : 'bg-white/10 backdrop-blur-md border border-white/20 px-6 sm:px-8 py-4 rounded-full text-center'}>
              <div className={viewMode === 'mobile' ? 'text-xs text-white/70' : 'text-xs sm:text-sm text-white/70'}>出發日期</div>
              <div className={viewMode === 'mobile' ? 'font-bold text-sm text-white' : 'font-bold text-base sm:text-xl text-white'}>{data.departureDate}</div>
            </div>
            <div className={viewMode === 'mobile' ? 'bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full text-center' : 'bg-white/10 backdrop-blur-md border border-white/20 px-6 sm:px-8 py-4 rounded-full text-center'}>
              <div className={viewMode === 'mobile' ? 'text-xs text-white/70' : 'text-xs sm:text-sm text-white/70'}>行程代碼</div>
              <div className={viewMode === 'mobile' ? 'font-bold text-sm text-white' : 'font-bold text-base sm:text-xl text-white'}>{data.tourCode}</div>
            </div>
          </motion.div>
        </motion.div>

        {/* 滾動提示 */}
        <motion.div
          className="text-white/80 text-center"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <p className={viewMode === 'mobile' ? 'text-sm mb-2 font-medium' : 'text-sm mb-2'}>探索行程</p>
          <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </motion.div>
      </div>
    </section>
  );
}
