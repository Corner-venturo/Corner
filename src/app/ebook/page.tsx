'use client';

import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { CoverPage } from './components/CoverPage';
import { FoldTransition } from './components/FoldTransition';
import { OpeningSpread } from './components/OpeningSpread';
import { ClosingScene } from './components/ClosingScene';

type PageState = 'cover' | 'fold-opening' | 'spread' | 'fold-closing' | 'closing';

/**
 * 旅遊電子書主頁面
 * 狀態機：cover → fold-opening → spread → fold-closing → closing → (reset) → cover
 */
export default function EbookPage() {
  const [pageState, setPageState] = useState<PageState>('cover');

  const handleOpenCover = () => {
    setPageState('fold-opening');
    // 翻頁動畫時長 1.4s
    setTimeout(() => {
      setPageState('spread');
    }, 1500);
  };

  const handleCompleteSpread = () => {
    setPageState('fold-closing');
    // 收合動畫時長 1.2s
    setTimeout(() => {
      setPageState('closing');
    }, 1300);
  };

  const handleReset = () => {
    setPageState('cover');
  };

  return (
    <div className="w-full h-screen overflow-hidden bg-white">
      {/* 載入字體 */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@400;700&family=Noto+Sans+TC:wght@400;500;700&display=swap');
      `}</style>

      <AnimatePresence mode="wait">
        {pageState === 'cover' && <CoverPage key="cover" onOpen={handleOpenCover} />}

        {pageState === 'spread' && (
          <OpeningSpread key="spread" onComplete={handleCompleteSpread} />
        )}

        {pageState === 'closing' && <ClosingScene key="closing" onReset={handleReset} />}
      </AnimatePresence>

      {/* 翻頁過渡層 - 開啟 */}
      <FoldTransition
        isOpen={pageState === 'fold-opening'}
        direction="opening"
        onComplete={() => {}}
      />

      {/* 翻頁過渡層 - 收合 */}
      <FoldTransition
        isOpen={pageState === 'fold-closing'}
        direction="closing"
        onComplete={() => {}}
      />
    </div>
  );
}
