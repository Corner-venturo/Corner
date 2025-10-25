import { UI_DELAYS, SYNC_DELAYS } from '@/lib/constants/timeouts';
'use client';

import { useState, useEffect } from 'react';
import { Chapter } from '@/types/manifestation';
import { useManifestationStore } from '@/stores/manifestation-store';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, Save, Check } from 'lucide-react';
import { recordManifestationCompletion } from '@/lib/manifestation/reminder';

interface ChapterContentProps {
  chapter: Chapter;
  onPrevious?: () => void;
  onNext?: () => void;
}

export function ChapterContent({ chapter, onPrevious, onNext }: ChapterContentProps) {
  const { currentEntry, createEntry, updateEntry, fetchEntryByChapter } = useManifestationStore();
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // 載入章節記錄
  useEffect(() => {
    fetchEntryByChapter(chapter.id);
  }, [chapter.id, fetchEntryByChapter]);

  // 載入現有數據
  useEffect(() => {
    if (currentEntry && currentEntry.chapter_number === chapter.id) {
      setFormData({
        desire: currentEntry.desire || '',
        body_sensations: currentEntry.body_sensations || [],
        dialogue: currentEntry.dialogue || '',
        small_action: currentEntry.small_action || '',
        gratitude: currentEntry.gratitude || '',
        magic_phrases: currentEntry.magic_phrases || [],
        shared_wish: currentEntry.shared_wish || '',
        notes: currentEntry.notes || ''
      });
    } else {
      setFormData({});
    }
  }, [currentEntry, chapter.id]);

  // 處理輸入變化
  const handleChange = (field: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // 處理陣列輸入（用換行分隔）
  const handleArrayChange = (field: string, value: string) => {
    const array = value.split('\n').filter(line => line.trim());
    handleChange(field, array);
  };

  // 儲存記錄
  const handleSave = async (markAsCompleted: boolean = false) => {
    setIsSaving(true);
    setSaveSuccess(false);

    const entryData: any = {
      chapter_number: chapter.id,
      ...formData,
      is_completed: markAsCompleted
    };

    if (markAsCompleted) {
      entryData.completed_at = new Date().toISOString();
    }

    try {
      let success = false;
      if (currentEntry) {
        success = await updateEntry(currentEntry.id, entryData);
      } else {
        const newEntry = await createEntry(entryData);
        success = !!newEntry;
      }

      if (success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), UI_DELAYS.SUCCESS_MESSAGE);
        if (markAsCompleted) {
          recordManifestationCompletion();
        }
      }
    } finally {
      setIsSaving(false);
    }
  };

  // 渲染表單欄位
  const renderField = (field: string) => {
    switch (field) {
      case 'desire':
        return (
          <div key={field}>
            <label className="block text-sm font-medium text-morandi-primary mb-2">
              我想要……
            </label>
            <Textarea
              value={formData.desire || ''}
              onChange={(e) => handleChange('desire', e.target.value)}
              placeholder="寫下你的願望，誠實、赤裸地表達……"
              className="min-h-[120px]"
            />
          </div>
        );

      case 'body_sensations':
        return (
          <div key={field}>
            <label className="block text-sm font-medium text-morandi-primary mb-2">
              體感記錄（每行一個）
            </label>
            <Textarea
              value={formData.body_sensations?.join('\n') || ''}
              onChange={(e) => handleArrayChange('body_sensations', e.target.value)}
              placeholder="例如：\n心跳加速\n胸口溫暖\n手心出汗"
              className="min-h-[100px]"
            />
          </div>
        );

      case 'dialogue':
        return (
          <div key={field}>
            <label className="block text-sm font-medium text-morandi-primary mb-2">
              與渴望的對話
            </label>
            <Textarea
              value={formData.dialogue || ''}
              onChange={(e) => handleChange('dialogue', e.target.value)}
              placeholder="寫下你與內在渴望的對話……"
              className="min-h-[150px]"
            />
          </div>
        );

      case 'small_action':
        return (
          <div key={field}>
            <label className="block text-sm font-medium text-morandi-primary mb-2">
              我願意採取的小行動
            </label>
            <Input
              value={formData.small_action || ''}
              onChange={(e) => handleChange('small_action', e.target.value)}
              placeholder="一個小到不可能失敗的行動……"
            />
          </div>
        );

      case 'gratitude':
        return (
          <div key={field}>
            <label className="block text-sm font-medium text-morandi-primary mb-2">
              感恩記錄
            </label>
            <Textarea
              value={formData.gratitude || ''}
              onChange={(e) => handleChange('gratitude', e.target.value)}
              placeholder="今天我感謝……"
              className="min-h-[120px]"
            />
          </div>
        );

      case 'magic_phrases':
        return (
          <div key={field}>
            <label className="block text-sm font-medium text-morandi-primary mb-2">
              我的魔法語（每行一句）
            </label>
            <Textarea
              value={formData.magic_phrases?.join('\n') || ''}
              onChange={(e) => handleArrayChange('magic_phrases', e.target.value)}
              placeholder="例如：\n我值得被愛\n豐盛正在流向我\n我信任宇宙的安排"
              className="min-h-[120px]"
            />
          </div>
        );

      case 'shared_wish':
        return (
          <div key={field}>
            <label className="block text-sm font-medium text-morandi-primary mb-2">
              分享到願望之牆
            </label>
            <Textarea
              value={formData.shared_wish || ''}
              onChange={(e) => handleChange('shared_wish', e.target.value)}
              placeholder="寫下你想分享的願望，讓它被看見……"
              className="min-h-[100px]"
            />
            <p className="text-xs text-morandi-secondary mt-1">
              這個願望將會匿名分享到願望之牆
            </p>
          </div>
        );

      case 'notes':
        return (
          <div key={field}>
            <label className="block text-sm font-medium text-morandi-primary mb-2">
              其他筆記
            </label>
            <Textarea
              value={formData.notes || ''}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="任何你想記錄的想法、感受……"
              className="min-h-[100px]"
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* 章節標題 */}
      <div
        className="p-6 rounded-lg border"
        style={{
          backgroundColor: `${chapter.color}10`,
          borderColor: `${chapter.color}40`
        }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
            style={{ backgroundColor: chapter.color }}
          >
            {chapter.id}
          </div>
          <div>
            <h2 className="text-xl font-medium text-morandi-primary">
              {chapter.title}
            </h2>
            {chapter.subtitle && (
              <p className="text-sm text-morandi-secondary">
                {chapter.subtitle}
              </p>
            )}
          </div>
        </div>

        <blockquote className="text-sm italic text-morandi-secondary border-l-2 pl-4 mt-4"
          style={{ borderColor: chapter.color }}
        >
          {chapter.quote}
        </blockquote>
      </div>

      {/* 章節內容 */}
      <div className="prose prose-sm max-w-none">
        <div className="text-morandi-primary whitespace-pre-line">
          {chapter.content}
        </div>
      </div>

      {/* 練習說明 */}
      <div className="bg-morandi-container rounded-lg p-6">
        <h3 className="text-lg font-medium text-morandi-primary mb-4">
          練習步驟
        </h3>
        <ol className="space-y-2">
          {chapter.exercise.instructions.map((instruction, index) => (
            <li key={index} className="text-sm text-morandi-secondary">
              {index + 1}. {instruction}
            </li>
          ))}
        </ol>
      </div>

      {/* 練習表單 */}
      <div className="space-y-4">
        {chapter.exercise.fields.map(field => renderField(field))}
      </div>

      {/* 操作按鈕 */}
      <div className="flex items-center justify-between pt-6 border-t">
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={!onPrevious}
        >
          <ChevronLeft className="mr-2" size={16} />
          上一章
        </Button>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleSave(false)}
            disabled={isSaving}
          >
            {isSaving ? (
              '儲存中...'
            ) : saveSuccess ? (
              <>
                <Check className="mr-2" size={16} />
                已儲存
              </>
            ) : (
              <>
                <Save className="mr-2" size={16} />
                儲存
              </>
            )}
          </Button>

          <Button
            onClick={() => handleSave(true)}
            disabled={isSaving}
            className="bg-morandi-gold hover:bg-morandi-gold/90"
          >
            完成此章
          </Button>
        </div>

        <Button
          variant="outline"
          onClick={onNext}
          disabled={!onNext}
        >
          下一章
          <ChevronRight className="ml-2" size={16} />
        </Button>
      </div>
    </div>
  );
}
