'use client';

import { motion } from 'framer-motion';
import { Book3D, BookFrame, Page, Spine } from './Book3D';

interface ClosingSceneProps {
  onReset: () => void;
}

/**
 * 收合完成畫面 - 顯示結語並提供重新開始按鈕
 */
export function ClosingScene({ onReset }: ClosingSceneProps) {
  return (
    <motion.div
      className="fixed inset-0 bg-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Book3D state="closing">
        <BookFrame isOpen={false}>
          {/* 封面（收合後） */}
          <Page side="right">
            <div className="w-full h-full flex items-center justify-center p-12">
              {/* 收合後的封面裝飾 */}
              <motion.div
                className="text-center"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.8 }}
              >
                <div
                  className="text-6xl mb-4"
                  style={{ opacity: 0.2 }}
                >
                  ✨
                </div>
              </motion.div>
            </div>
          </Page>

          {/* 書脊 */}
          <Spine opacity={0.8} />
        </BookFrame>
      </Book3D>

      {/* 結語文案層 - 浮在書上方 */}
      <motion.div
        className="fixed inset-0 z-20 flex flex-col items-center justify-center pointer-events-none"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 1.2 }}
      >
        <div className="text-center pointer-events-auto">
          <h2
            className="text-4xl font-bold mb-4"
            style={{
              fontFamily: '"Noto Serif TC", serif',
              color: '#2C3E50',
              letterSpacing: '0.1em',
              textShadow: '2px 2px 4px rgba(0,0,0,0.05)',
            }}
          >
            旅程結束
          </h2>
          <p
            className="text-lg mb-8"
            style={{
              fontFamily: '"Noto Sans TC", sans-serif',
              color: '#5A6C7D',
              letterSpacing: '0.05em',
            }}
          >
            感謝您的閱讀，期待下次再會
          </p>

          {/* 重新開始按鈕 */}
          <motion.button
            className="px-8 py-3 rounded-lg"
            style={{
              fontFamily: '"Noto Sans TC", sans-serif',
              backgroundColor: '#8CBCD0',
              color: 'white',
              fontSize: '16px',
              letterSpacing: '0.05em',
              boxShadow: '0 4px 12px rgba(140, 188, 208, 0.3)',
            }}
            onClick={onReset}
            whileHover={{
              scale: 1.05,
              boxShadow: '0 6px 16px rgba(140, 188, 208, 0.4)',
            }}
            whileTap={{ scale: 0.95 }}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.6 }}
          >
            重新開始
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
