'use client';

import { useState, useEffect } from 'react';
import { useManifestationStore } from '@/stores/manifestation-store';
import { getChapter, getNextChapter, getPreviousChapter } from '@/data/manifestation-chapters';
import { BreathingExercise } from '@/components/manifestation/BreathingExercise';
import { ChapterList } from '@/components/manifestation/ChapterList';
import { ChapterContent } from '@/components/manifestation/ChapterContent';
import { WishWall } from '@/components/manifestation/WishWall';
import { ResponsiveHeader } from '@/components/layout/responsive-header';
import { Sparkles, Book, Heart } from 'lucide-react';

type ViewMode = 'practice' | 'wish-wall';

export default function ManifestationPage() {
  const [showBreathing, setShowBreathing] = useState(false);
  const [hasSeenBreathing, setHasSeenBreathing] = useState(false);
  const [currentChapter, setCurrentChapter] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>('practice');
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
    setViewMode('practice');
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
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title="顯化魔法"
        icon={Sparkles}
        breadcrumb={[
          { label: '首頁', href: '/' },
          { label: '顯化魔法', href: '/manifestation' }
        ]}
        tabs={[
          { value: 'practice', label: '練習', icon: Book },
          { value: 'wish-wall', label: '願望牆', icon: Heart }
        ]}
        activeTab={viewMode}
        onTabChange={(tab) => setViewMode(tab as ViewMode)}
      />

      <div className="flex-1 overflow-auto flex">
        {/* 側邊欄 - 章節列表（僅在練習模式顯示） */}
        {viewMode === 'practice' && (
          <aside className="w-80 border-r border-border bg-card shrink-0 overflow-y-auto">
            <div className="p-6">
              <ChapterList
                currentChapter={currentChapter}
                onChapterSelect={handleChapterSelect}
              />
            </div>
          </aside>
        )}

        {/* 主要內容區 */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-8">
            {viewMode === 'practice' && chapter && (
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
    </div>
  );
}
