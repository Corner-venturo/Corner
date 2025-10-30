'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { Book3D, BookFrame, Page, Spine } from './Book3D';

interface OpeningSpreadProps {
  onComplete: () => void;
}

/**
 * 攤開完成態 - A4 橫向展示
 * 左頁固定，右頁可切換圖片內容（帶不規則 mask）
 */
export function OpeningSpread({ onComplete }: OpeningSpreadProps) {
  const [currentImage, setCurrentImage] = useState(0);

  // 示例圖片數據（可替換為真實旅遊圖片）
  const images = [
    { id: 1, title: '巴黎鐵塔', location: '法國', color: '#E8D5C4' },
    { id: 2, title: '富士山', location: '日本', color: '#D5E8E0' },
    { id: 3, title: '大峽谷', location: '美國', color: '#E8DDD5' },
  ];

  const handleNext = () => {
    if (currentImage < images.length - 1) {
      setCurrentImage(currentImage + 1);
    } else {
      // 結束瀏覽，進入收合
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentImage > 0) {
      setCurrentImage(currentImage - 1);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Book3D state="spread">
        <BookFrame isOpen={true}>
          {/* 左頁 - 目錄或簡介 */}
          <Page side="left">
            <div className="w-full h-full p-12 flex flex-col justify-between">
              <div>
                <h2
                  className="text-2xl font-bold mb-6"
                  style={{
                    fontFamily: '"Noto Serif TC", serif',
                    color: '#2C3E50',
                    letterSpacing: '0.08em',
                  }}
                >
                  旅程目錄
                </h2>

                <div className="space-y-4">
                  {images.map((img, idx) => (
                    <motion.div
                      key={img.id}
                      className="flex items-center gap-3 cursor-pointer"
                      onClick={() => setCurrentImage(idx)}
                      whileHover={{ x: 4 }}
                      animate={{
                        opacity: currentImage === idx ? 1 : 0.5,
                      }}
                    >
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor: currentImage === idx ? '#8CBCD0' : '#D0D0D0',
                        }}
                      />
                      <div>
                        <p
                          className="text-base font-medium"
                          style={{
                            fontFamily: '"Noto Sans TC", sans-serif',
                            color: '#2C3E50',
                          }}
                        >
                          {img.title}
                        </p>
                        <p
                          className="text-sm"
                          style={{
                            fontFamily: '"Noto Sans TC", sans-serif',
                            color: '#8CBCD0',
                          }}
                        >
                          {img.location}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* 旅程路徑線動畫 */}
              <motion.svg
                className="w-full h-16"
                viewBox="0 0 300 60"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.8 }}
              >
                <motion.path
                  d="M10,30 Q80,10 150,30 T290,30"
                  stroke="#9BB3A5"
                  strokeWidth="1.5"
                  fill="none"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 2, ease: 'easeInOut', delay: 0.8 }}
                />
                {/* 路徑點 */}
                {[10, 150, 290].map((cx, idx) => (
                  <motion.circle
                    key={idx}
                    cx={cx}
                    cy={30}
                    r="3"
                    fill="#9BB3A5"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.8 + idx * 0.3, duration: 0.4 }}
                  />
                ))}
              </motion.svg>
            </div>
          </Page>

          {/* 右頁 - 圖片內容區 */}
          <Page side="right">
            <motion.div
              key={currentImage}
              className="w-full h-full p-12 flex flex-col"
              initial={{ opacity: 0, skewX: 1.5 }}
              animate={{ opacity: 1, skewX: 0 }}
              exit={{ opacity: 0.6 }}
              transition={{ duration: 0.8 }}
            >
              {/* 圖片區域 - 不規則 mask */}
              <div className="flex-1 relative mb-6 rounded-lg overflow-hidden">
                <motion.div
                  className="absolute inset-0"
                  style={{
                    backgroundColor: images[currentImage].color,
                    clipPath: 'polygon(0 0, 100% 0, 100% 95%, 95% 100%, 0 100%)',
                  }}
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.6 }}
                >
                  {/* 圖片佔位（可替換為真實圖片） */}
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <div
                        className="text-6xl mb-4"
                        style={{ opacity: 0.3 }}
                      >
                        🗺️
                      </div>
                      <p
                        className="text-xl font-bold"
                        style={{
                          fontFamily: '"Noto Serif TC", serif',
                          color: 'rgba(0,0,0,0.4)',
                        }}
                      >
                        {images[currentImage].title}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* 描述文字 */}
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                <h3
                  className="text-xl font-bold mb-2"
                  style={{
                    fontFamily: '"Noto Serif TC", serif',
                    color: '#2C3E50',
                  }}
                >
                  {images[currentImage].title}
                </h3>
                <p
                  className="text-sm mb-4"
                  style={{
                    fontFamily: '"Noto Sans TC", sans-serif',
                    color: '#5A6C7D',
                    lineHeight: '1.6',
                  }}
                >
                  探索{images[currentImage].location}的美麗風光，感受異國文化的獨特魅力。
                </p>

                {/* 導航按鈕 */}
                <div className="flex gap-3">
                  <motion.button
                    className="px-4 py-2 rounded text-sm"
                    style={{
                      fontFamily: '"Noto Sans TC", sans-serif',
                      backgroundColor: currentImage > 0 ? '#8CBCD0' : '#E0E0E0',
                      color: currentImage > 0 ? 'white' : '#A0A0A0',
                    }}
                    onClick={handlePrev}
                    disabled={currentImage === 0}
                    whileHover={currentImage > 0 ? { scale: 1.05 } : {}}
                    whileTap={currentImage > 0 ? { scale: 0.95 } : {}}
                  >
                    上一頁
                  </motion.button>
                  <motion.button
                    className="px-4 py-2 rounded text-sm"
                    style={{
                      fontFamily: '"Noto Sans TC", sans-serif',
                      backgroundColor: '#8CBCD0',
                      color: 'white',
                    }}
                    onClick={handleNext}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {currentImage < images.length - 1 ? '下一頁' : '結束閱讀'}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          </Page>

          {/* 書脊 */}
          <Spine opacity={1.0} />
        </BookFrame>
      </Book3D>
    </motion.div>
  );
}
