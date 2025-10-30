'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface Book3DProps {
  children: ReactNode
  state: 'cover' | 'opening' | 'spread' | 'closing'
}

/**
 * 書本 3D 容器 - 控制位移、縮放、陰影
 * 按照規格：封面 380x540 (A5)，展開 760x540 (A4橫向)
 */
export function Book3D({ children, state }: Book3DProps) {
  // 根據狀態計算位移、縮放、陰影
  const getTransformValues = () => {
    switch (state) {
      case 'cover':
        return {
          x: 0,
          scale: 1.0,
          boxShadow: '0 10px 24px rgba(0,0,0,0.10)',
        }
      case 'opening':
        return {
          x: 80, // 展開時右移 80px
          scale: 1.05,
          boxShadow: '0 12px 30px rgba(0,0,0,0.14)',
        }
      case 'spread':
        return {
          x: 80,
          scale: 1.05,
          boxShadow: '0 12px 30px rgba(0,0,0,0.14)',
        }
      case 'closing':
        return {
          x: 0,
          scale: 0.95, // 收合後微縮
          boxShadow: '0 6px 18px rgba(0,0,0,0.10)',
        }
      default:
        return {
          x: 0,
          scale: 1.0,
          boxShadow: '0 10px 24px rgba(0,0,0,0.10)',
        }
    }
  }

  const transformValues = getTransformValues()

  return (
    <motion.div
      className="relative flex items-center justify-center"
      style={{
        perspective: '2000px',
        width: '100vw',
        height: '100vh',
      }}
      animate={{
        x: transformValues.x,
        scale: transformValues.scale,
      }}
      transition={{
        duration: state === 'opening' ? 1.4 : state === 'closing' ? 1.2 : 0.8,
        ease: 'easeInOut',
      }}
    >
      <motion.div
        className="relative"
        style={{
          transformStyle: 'preserve-3d',
        }}
        animate={{
          boxShadow: transformValues.boxShadow,
        }}
        transition={{ duration: 0.6 }}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}

interface BookFrameProps {
  isOpen: boolean
  children: ReactNode
}

/**
 * 書本框架 - 控制寬度變化（封面 380 → 展開 760）
 */
export function BookFrame({ isOpen, children }: BookFrameProps) {
  return (
    <motion.div
      className="relative rounded-lg"
      style={{
        height: '540px',
        transformStyle: 'preserve-3d',
      }}
      animate={{
        width: isOpen ? '760px' : '380px',
      }}
      transition={{
        duration: isOpen ? 1.4 : 1.2,
        ease: 'easeInOut',
      }}
    >
      {children}
    </motion.div>
  )
}

interface PageProps {
  side: 'left' | 'right'
  children: ReactNode
  isFlipping?: boolean
  rotateY?: number
}

/**
 * 書頁組件 - 左頁固定，右頁可翻轉
 */
export function Page({ side, children, isFlipping = false, rotateY = 0 }: PageProps) {
  const isLeft = side === 'left'

  return (
    <motion.div
      className="absolute top-0 rounded-lg overflow-hidden"
      style={{
        width: '380px',
        height: '540px',
        left: isLeft ? 0 : '380px',
        transformStyle: 'preserve-3d',
        transformOrigin: isLeft ? 'right center' : 'left center',
        backfaceVisibility: 'hidden',
        // 紙張底色與紋理
        background: 'linear-gradient(to bottom right, #F5F2EE, #E8E4E1)',
        border: '1px solid rgba(0,0,0,0.06)',
      }}
      animate={{
        rotateY: isLeft ? 0 : rotateY,
      }}
      transition={{
        duration: 1.4,
        ease: 'easeInOut',
      }}
    >
      {/* 紙張紋理 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'repeating-linear-gradient(0deg, transparent, transparent 30px, rgba(60,80,100,0.15) 30px, rgba(60,80,100,0.15) 31px)',
          opacity: 0.05,
        }}
      />

      {/* 翻轉時的高光（右頁） */}
      {!isLeft && isFlipping && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(to right, rgba(255,255,255,0.25), transparent 50%)',
          }}
          animate={{
            opacity: [0, 0.8, 0],
          }}
          transition={{
            duration: 1.4,
            ease: 'easeInOut',
          }}
        />
      )}

      {/* 翻轉時的內陰影（左頁） */}
      {isLeft && isFlipping && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            boxShadow: 'inset -6px 0 16px rgba(0,0,0,0.10)',
          }}
          animate={{
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 1.4,
            ease: 'easeInOut',
          }}
        />
      )}

      {/* 內容層 */}
      <div className="relative z-10 w-full h-full">{children}</div>

      {/* 邊緣高光 */}
      <div
        className="absolute inset-0 pointer-events-none rounded-lg"
        style={{
          background: isLeft
            ? 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 40%)'
            : 'linear-gradient(225deg, rgba(255,255,255,0.2) 0%, transparent 40%)',
        }}
      />
    </motion.div>
  )
}

interface SpineProps {
  opacity?: number
}

/**
 * 書脊組件 - 固定在中線
 */
export function Spine({ opacity = 0.8 }: SpineProps) {
  return (
    <motion.div
      className="absolute top-0 z-20 pointer-events-none"
      style={{
        width: '5px',
        height: '540px',
        left: 'calc(50% - 2.5px)',
        background: 'linear-gradient(to right, rgba(0,0,0,0.20), rgba(0,0,0,0.06), transparent)',
        opacity,
      }}
      animate={{ opacity }}
      transition={{ duration: 0.6 }}
    />
  )
}
