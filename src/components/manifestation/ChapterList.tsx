'use client';

import { chapters } from '@/data/manifestation-chapters';
import { cn } from '@/lib/utils';
import { Check, Lock } from 'lucide-react';
import { useManifestationStore } from '@/stores/manifestation-store';

interface ChapterListProps {
  currentChapter: number;
  onChapterSelect: (chapterId: number) => void;
}

export function ChapterList({ currentChapter, onChapterSelect }: ChapterListProps) {
  const { entries } = useManifestationStore();

  // 檢查章節是否已完成
  const isChapterCompleted = (chapterId: number) => {
    return entries.some(entry =>
      entry.chapter_number === chapterId && entry.is_completed
    );
  };

  // 檢查章節是否已開始
  const isChapterStarted = (chapterId: number) => {
    return entries.some(entry => entry.chapter_number === chapterId);
  };

  // 檢查章節是否解鎖（前一章完成或是第一章）
  const isChapterUnlocked = (chapterId: number) => {
    if (chapterId === 1) return true;
    return isChapterCompleted(chapterId - 1);
  };

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-medium text-morandi-primary mb-4">15 個魔法章節</h3>

      <div className="space-y-2">
        {chapters.map((chapter) => {
          const completed = isChapterCompleted(chapter.id);
          const started = isChapterStarted(chapter.id);
          const unlocked = isChapterUnlocked(chapter.id);
          const isCurrent = chapter.id === currentChapter;

          return (
            <button
              key={chapter.id}
              onClick={() => unlocked && onChapterSelect(chapter.id)}
              disabled={!unlocked}
              className={cn(
                'w-full text-left p-4 rounded-lg transition-all duration-200',
                'border border-border',
                isCurrent && 'bg-morandi-container border-morandi-gold shadow-sm',
                !isCurrent && unlocked && 'hover:bg-morandi-container/50',
                !unlocked && 'opacity-50 cursor-not-allowed'
              )}
              style={{
                backgroundColor: isCurrent ? `${chapter.color}10` : undefined,
                borderColor: isCurrent ? chapter.color : undefined
              }}
            >
              <div className="flex items-start gap-3">
                {/* 章節編號 */}
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0',
                    completed && 'bg-green-100 text-green-700',
                    !completed && started && 'bg-morandi-gold/20 text-morandi-gold',
                    !completed && !started && unlocked && 'bg-morandi-container text-morandi-secondary',
                    !unlocked && 'bg-gray-100 text-gray-400'
                  )}
                >
                  {completed ? <Check size={16} /> : !unlocked ? <Lock size={16} /> : chapter.id}
                </div>

                {/* 章節內容 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium text-morandi-primary truncate">
                      {chapter.title}
                    </h4>
                    {started && !completed && (
                      <span className="text-xs text-morandi-gold">進行中</span>
                    )}
                  </div>
                  {chapter.subtitle && (
                    <p className="text-xs text-morandi-secondary mt-0.5">
                      {chapter.subtitle}
                    </p>
                  )}
                </div>

                {/* 狀態指示器 */}
                {completed && (
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
