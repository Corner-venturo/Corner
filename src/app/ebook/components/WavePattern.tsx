'use client'

import { motion } from 'framer-motion'

/**
 * 日式浪花動畫組件 - 手繪風格
 * 參考葛飾北齋《神奈川沖浪裏》的浪潮風格
 */
export function WavePattern() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg
        className="absolute w-full h-full"
        viewBox="0 0 1200 800"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* 背景波浪層 - 最遠 */}
        <motion.g
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 0.15 }}
          transition={{ duration: 3, ease: 'easeOut' }}
        >
          <path
            d="M0,400 Q150,380 300,400 T600,400 T900,400 T1200,400 L1200,800 L0,800 Z"
            fill="url(#wave-gradient-1)"
            opacity="0.3"
          />
        </motion.g>

        {/* 中景波浪層 */}
        <motion.g
          initial={{ x: -150, opacity: 0 }}
          animate={{ x: 0, opacity: 0.25 }}
          transition={{ duration: 2.5, ease: 'easeOut', delay: 0.2 }}
        >
          <path
            d="M0,450 Q200,430 400,450 T800,450 T1200,450 L1200,800 L0,800 Z"
            fill="url(#wave-gradient-2)"
            opacity="0.4"
          />
          {/* 浪花細節 - 中景 */}
          <g className="wave-foam">
            <motion.circle
              cx="250"
              cy="445"
              r="4"
              fill="white"
              opacity="0.6"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.6, 0.8, 0.6],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            <motion.circle
              cx="270"
              cy="448"
              r="3"
              fill="white"
              opacity="0.5"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.5, 0.7, 0.5],
              }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 0.3,
              }}
            />
          </g>
        </motion.g>

        {/* 前景波浪層 - 最近，帶浪花 */}
        <motion.g
          initial={{ x: -200, opacity: 0 }}
          animate={{ x: 0, opacity: 0.35 }}
          transition={{ duration: 2, ease: 'easeOut', delay: 0.4 }}
        >
          <path
            d="M0,520 Q250,490 500,520 T1000,520 T1500,520 L1500,800 L0,800 Z"
            fill="url(#wave-gradient-3)"
            opacity="0.5"
          />

          {/* 浪花飛濺效果 - 前景 */}
          <g className="wave-splash">
            {/* 大浪花團 */}
            <motion.path
              d="M480,510 Q485,505 490,510 Q495,515 500,510 Q505,505 510,510 Q515,515 520,510 L520,520 L480,520 Z"
              fill="white"
              opacity="0.7"
              animate={{
                y: [0, -5, 0],
                opacity: [0.7, 0.9, 0.7],
              }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            {/* 小水滴 */}
            {[...Array(6)].map((_, i) => (
              <motion.circle
                key={i}
                cx={460 + i * 20}
                cy={515}
                r={2 + (i % 3)}
                fill="white"
                opacity="0.6"
                animate={{
                  y: [0, -8 - i * 2, 0],
                  opacity: [0.6, 0, 0.6],
                  scale: [1, 0.8, 1],
                }}
                transition={{
                  duration: 2 + i * 0.1,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 0.15,
                }}
              />
            ))}
          </g>
        </motion.g>

        {/* 漂浮的泡沫粒子 */}
        <g className="floating-foam">
          {[...Array(12)].map((_, i) => (
            <motion.circle
              key={`foam-${i}`}
              cx={100 + i * 90 + (i % 3) * 20}
              cy={380 + (i % 4) * 50}
              r={1.5 + (i % 2)}
              fill="white"
              opacity="0.4"
              animate={{
                x: [0, 10 + (i % 5) * 3, 0],
                y: [0, -15 - (i % 3) * 5, 0],
                opacity: [0.4, 0.7, 0.4],
              }}
              transition={{
                duration: 3 + (i % 4) * 0.5,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.2,
              }}
            />
          ))}
        </g>

        {/* 漸層定義 */}
        <defs>
          <linearGradient id="wave-gradient-1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#B8D4E8" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#E8F4F8" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="wave-gradient-2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#A0C8DC" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#D0E8F0" stopOpacity="0.15" />
          </linearGradient>
          <linearGradient id="wave-gradient-3" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#8CBCD0" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#C0DCE8" stopOpacity="0.2" />
          </linearGradient>
        </defs>
      </svg>

      {/* 額外的動態光影效果 */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-50/5 to-transparent"
        animate={{
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  )
}
