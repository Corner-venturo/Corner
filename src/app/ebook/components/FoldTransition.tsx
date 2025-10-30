'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Book3D, BookFrame, Page, Spine } from './Book3D';

interface FoldTransitionProps {
  isOpen: boolean;
  direction: 'opening' | 'closing';
  onComplete: () => void;
}

/**
 * 翻頁過渡動畫
 * Opening: 右頁旋轉 0 → -180°，書體右移至 +80px
 * Closing: 右頁旋轉 -180 → 0°，書體先右滑峰值 +120~140px，再回中央
 */
export function FoldTransition({ isOpen, direction, onComplete }: FoldTransitionProps) {
  if (!isOpen) return null;

  const isOpening = direction === 'opening';

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 bg-white"
          initial={{ opacity: 1 }}
          exit={{ opacity: 1 }}
        >
          <Book3D state={direction}>
            <BookFrame isOpen={isOpening}>
              {/* 左頁 - 固定不動 */}
              <Page side="left" isFlipping={isOpen}>
                <div className="w-full h-full flex items-center justify-center p-12">
                  <div className="text-center">
                    <h2
                      className="text-3xl font-bold mb-4"
                      style={{
                        fontFamily: '"Noto Serif TC", serif',
                        color: '#2C3E50',
                        letterSpacing: '0.08em',
                      }}
                    >
                      {isOpening ? '展開新世界' : '結束旅程'}
                    </h2>
                    <p
                      className="text-base"
                      style={{
                        fontFamily: '"Noto Sans TC", sans-serif',
                        color: '#5A6C7D',
                        letterSpacing: '0.05em',
                        lineHeight: '1.8',
                      }}
                    >
                      {isOpening ? '每一頁都是新的開始' : '帶著美好回憶返航'}
                    </p>
                  </div>
                </div>
              </Page>

              {/* 右頁 - 翻轉動畫 */}
              <Page
                side="right"
                isFlipping={isOpen}
                rotateY={isOpening ? -180 : 0}
              >
                <div className="w-full h-full flex items-center justify-center p-12">
                  {/* 右頁內容（翻轉時不太可見） */}
                  <div
                    className="text-center"
                    style={{
                      transform: 'rotateY(180deg)', // 反轉文字使其在背面可讀
                    }}
                  >
                    <p
                      className="text-sm"
                      style={{
                        fontFamily: '"Noto Sans TC", sans-serif',
                        color: '#8CBCD0',
                      }}
                    >
                      {isOpening ? '翻開...' : '闔上...'}
                    </p>
                  </div>
                </div>
              </Page>

              {/* 書脊 - 固定不動 */}
              <Spine opacity={isOpening ? 1.0 : 0.8} />
            </BookFrame>
          </Book3D>

          {/* 收合時的額外動態：書本先往右滑到峰值，再回中央 */}
          {!isOpening && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ x: 80 }}
              animate={{
                x: [80, 130, 0], // 關鍵幀：起始 → 峰值 → 中央
              }}
              transition={{
                duration: 1.2,
                times: [0, 0.5, 1], // 在 50% 時達到峰值
                ease: 'easeInOut',
              }}
              onAnimationComplete={onComplete}
            />
          )}

          {/* 開啟時的完成回調 */}
          {isOpening && (
            <motion.div
              className="hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                duration: 1.4,
                onComplete,
              }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
