'use client';

import { useState, useEffect } from 'react';
import { useManifestationStore } from '@/stores/manifestation-store';
import { chapters, getChapter, getNextChapter, getPreviousChapter } from '@/data/manifestation-chapters';
import { BreathingExercise } from '@/components/manifestation/BreathingExercise';
import { ChapterList } from '@/components/manifestation/ChapterList';
import { ChapterContent } from '@/components/manifestation/ChapterContent';
import { WishWall } from '@/components/manifestation/WishWall';
import { Button } from '@/components/ui/button';
import { Sparkles, Book, Heart} from 'lucide-react';
// import { cn } from '@/lib/utils';

type ViewMode = 'journal' | 'manifestation' | 'wish-wall';

export default function ManifestationPage() {
  const [showBreathing, setShowBreathing] = useState(false);
  const [hasSeenBreathing, setHasSeenBreathing] = useState(false);
  const [currentChapter, setCurrentChapter] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>('manifestation');
  const { fetchEntries, fetchProgress } = useManifestationStore();

  // 首次進入顯示呼吸練習
  useEffect(() => {
    const seen = localStorage.getItem('manifestation_breathing_seen');
    if (!seen) {
      setShowBreathing(true);
    }
    setHasSeenBreathing(!!seen);
  }, []);

  // 載入數據
  useEffect(() => {
    fetchEntries();
    fetchProgress();
  }, [fetchEntries, fetchProgress]);

  const handleBreathingComplete = () => {
    localStorage.setItem('manifestation_breathing_seen', 'true');
    setShowBreathing(false);
    setHasSeenBreathing(true);
  };

  const handleBreathingSkip = () => {
    setShowBreathing(false);
  };

  const handleChapterSelect = (chapterId: number) => {
    setCurrentChapter(chapterId);
    setViewMode('manifestation');
  };

  const handleNextChapter = () => {
    const next = getNextChapter(currentChapter);
    if (next) {
      setCurrentChapter(next.id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePreviousChapter = () => {
    const prev = getPreviousChapter(currentChapter);
    if (prev) {
      setCurrentChapter(prev.id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const chapter = getChapter(currentChapter);

  if (showBreathing) {
    return (
      <BreathingExercise
        onComplete={handleBreathingComplete}
        onSkip={handleBreathingSkip}
      />
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* 側邊欄 - 章節列表 */}
      <aside className="w-80 border-r border-border bg-card overflow-y-auto">
        <div className="p-6">
          {/* 標題 */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-morandi-gold/30 to-morandi-gold/10 flex items-center justify-center">
                <Sparkles className="text-morandi-gold" size={20} />
              </div>
              <h1 className="text-xl font-medium text-morandi-primary">
                顯化魔法
              </h1>
            </div>
            <p className="text-sm text-morandi-secondary">
              15 個章節的靈性成長旅程
            </p>
          </div>

          {/* 視圖切換 */}
          <div className="flex gap-2 mb-6">
            <Button
              variant={viewMode === 'manifestation' ? 'default' : 'outline'}
              onClick={() => setViewMode('manifestation')}
              size="sm"
              className="flex-1"
            >
              <Book className="mr-2" size={14} />
              練習
            </Button>
            <Button
              variant={viewMode === 'wish-wall' ? 'default' : 'outline'}
              onClick={() => setViewMode('wish-wall')}
              size="sm"
              className="flex-1"
            >
              <Heart className="mr-2" size={14} />
              願望牆
            </Button>
          </div>

          {/* 章節列表 */}
          {viewMode === 'manifestation' && (
            <ChapterList
              currentChapter={currentChapter}
              onChapterSelect={handleChapterSelect}
            />
          )}
        </div>
      </aside>

      {/* 主要內容區 */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-8">
          {viewMode === 'manifestation' && chapter && (
            <ChapterContent
              chapter={chapter}
              onNext={getNextChapter(currentChapter) ? handleNextChapter : undefined}
              onPrevious={getPreviousChapter(currentChapter) ? handlePreviousChapter : undefined}
            />
          )}

          {viewMode === 'wish-wall' && (
            <WishWall />
          )}
        </div>
      </main>
    </div>
  );
}
