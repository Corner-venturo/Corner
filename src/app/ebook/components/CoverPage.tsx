'use client'

import { motion } from 'framer-motion'
import { WavePattern } from './WavePattern'

interface CoverPageProps {
  onOpen: () => void
}

export function CoverPage({ onOpen }: CoverPageProps) {
  return (
    <motion.div
      className="w-full h-screen flex items-center justify-center bg-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* 書本封面容器 - A5 比例 380x540 */}
      <motion.div
        className="relative"
        style={{
          width: '380px',
          height: '540px',
          perspective: '2000px',
        }}
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        {/* 書本主體 */}
        <motion.div
          className="relative w-full h-full rounded-lg cursor-pointer overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #F5F2EE 0%, #E8E4E1 100%)',
            boxShadow: '0 10px 24px rgba(0,0,0,0.10)',
            border: '1px solid rgba(0,0,0,0.06)',
          }}
          onClick={onOpen}
          whileTap={{ scale: 0.98 }}
        >
          {/* 浪花背景 */}
          <WavePattern />

          {/* 紙張紋理 */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'repeating-linear-gradient(0deg, transparent, transparent 30px, rgba(60,80,100,0.15) 30px, rgba(60,80,100,0.15) 31px)',
              opacity: 0.05,
            }}
          />

          {/* 封面內容 */}
          <div className="relative z-10 h-full flex flex-col items-center justify-center p-12">
            {/* 主標題 */}
            <motion.div
              className="text-center mb-8"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              <h1
                className="text-5xl font-bold mb-4"
                style={{
                  fontFamily: '"Noto Serif TC", serif',
                  color: '#2C3E50',
                  letterSpacing: '0.1em',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.08)',
                }}
              >
                旅遊電子書
              </h1>

              {/* 裝飾線 */}
              <motion.div
                className="w-32 h-0.5 mx-auto mb-6"
                style={{
                  background: 'linear-gradient(to right, transparent, #8CBCD0, transparent)',
                }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.6, duration: 0.8 }}
              />

              {/* 副標題 - 改為中文 */}
              <motion.p
                className="text-lg"
                style={{
                  fontFamily: '"Noto Sans TC", sans-serif',
                  color: '#5A6C7D',
                  letterSpacing: '0.05em',
                  lineHeight: '1.8',
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9, duration: 0.8 }}
              >
                讓我們探索世界上每個角落
              </motion.p>
            </motion.div>

            {/* 開啟提示 */}
            <motion.div
              className="absolute bottom-12 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 1 }}
            >
              <motion.p
                className="text-sm"
                style={{
                  fontFamily: '"Noto Sans TC", sans-serif',
                  color: '#8CBCD0',
                  letterSpacing: '0.1em',
                }}
                animate={{
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                點擊開啟
              </motion.p>

              {/* 點擊圖示 */}
              <motion.div
                className="mt-2 flex justify-center"
                animate={{
                  y: [0, 4, 0],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M10 4V16M10 16L6 12M10 16L14 12"
                    stroke="#8CBCD0"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </motion.div>
            </motion.div>
          </div>

          {/* 書本邊緣高光 */}
          <div
            className="absolute inset-0 pointer-events-none rounded-lg"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 50%)',
            }}
          />
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
