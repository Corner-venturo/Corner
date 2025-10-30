'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

/**
 * 電子書展示首頁 - 用於測試和展示
 */
export default function EbookDemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-8">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@400;700&family=Noto+Sans+TC:wght@400;500;700&display=swap');
      `}</style>

      <motion.div
        className="max-w-2xl w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        {/* 標題區 */}
        <div className="text-center mb-12">
          <motion.h1
            className="text-5xl font-bold mb-4"
            style={{
              fontFamily: '"Noto Serif TC", serif',
              color: '#2C3E50',
              letterSpacing: '0.1em',
            }}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            旅遊電子書展示
          </motion.h1>

          <motion.p
            className="text-lg"
            style={{
              fontFamily: '"Noto Sans TC", sans-serif',
              color: '#5A6C7D',
              letterSpacing: '0.05em',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            體驗真實書本翻頁的魔法
          </motion.p>
        </div>

        {/* 功能卡片 */}
        <div className="grid gap-6 mb-8">
          {/* 主展示 */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <Link href="/ebook">
              <motion.div
                className="bg-white rounded-2xl p-8 shadow-lg cursor-pointer border border-gray-100"
                whileHover={{
                  scale: 1.02,
                  boxShadow: '0 20px 40px rgba(140, 188, 208, 0.2)',
                }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
                    style={{ backgroundColor: '#8CBCD0' }}
                  >
                    📖
                  </div>
                  <div>
                    <h2
                      className="text-2xl font-bold mb-1"
                      style={{
                        fontFamily: '"Noto Serif TC", serif',
                        color: '#2C3E50',
                      }}
                    >
                      完整電子書體驗
                    </h2>
                    <p
                      className="text-sm"
                      style={{
                        fontFamily: '"Noto Sans TC", sans-serif',
                        color: '#8CBCD0',
                      }}
                    >
                      /ebook
                    </p>
                  </div>
                </div>
                <ul
                  className="space-y-2 text-sm"
                  style={{
                    fontFamily: '"Noto Sans TC", sans-serif',
                    color: '#5A6C7D',
                  }}
                >
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    日式浪花動畫封面
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    真實 3D 書本翻頁效果
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    左頁固定 + 右頁翻轉 + 書脊細節
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    紙張質感與高光陰影
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    精確動畫時間軸（開 1.4s / 闔 1.2s）
                  </li>
                </ul>
              </motion.div>
            </Link>
          </motion.div>

          {/* 技術規格 */}
          <motion.div
            className="bg-white rounded-2xl p-6 shadow-md border border-gray-100"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            <h3
              className="text-lg font-bold mb-4"
              style={{
                fontFamily: '"Noto Serif TC", serif',
                color: '#2C3E50',
              }}
            >
              技術規格
            </h3>
            <div
              className="grid grid-cols-2 gap-4 text-sm"
              style={{
                fontFamily: '"Noto Sans TC", sans-serif',
                color: '#5A6C7D',
              }}
            >
              <div>
                <p className="font-medium mb-1">封面尺寸</p>
                <p className="text-xs text-gray-500">380×540 (A5)</p>
              </div>
              <div>
                <p className="font-medium mb-1">展開尺寸</p>
                <p className="text-xs text-gray-500">760×540 (A4橫)</p>
              </div>
              <div>
                <p className="font-medium mb-1">透視距離</p>
                <p className="text-xs text-gray-500">2000px</p>
              </div>
              <div>
                <p className="font-medium mb-1">動畫引擎</p>
                <p className="text-xs text-gray-500">Framer Motion</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* 返回主系統連結 */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          <Link href="/">
            <motion.button
              className="px-6 py-2 rounded-lg text-sm"
              style={{
                fontFamily: '"Noto Sans TC", sans-serif',
                backgroundColor: '#E8E4E1',
                color: '#5A6C7D',
              }}
              whileHover={{
                backgroundColor: '#D8D4D1',
              }}
              whileTap={{ scale: 0.95 }}
            >
              ← 返回 Venturo 主系統
            </motion.button>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  )
}
