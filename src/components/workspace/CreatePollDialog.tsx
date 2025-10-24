'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CreatePollFormValues {
  question: string;
  description?: string;
  options: string[];
  allowMultiple: boolean;
  allowAddOptions: boolean;
  anonymous: boolean;
  deadline?: string;
}

interface CreatePollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CreatePollFormValues) => Promise<void> | void;
  loading?: boolean;
}

export function CreatePollDialog({ open, onOpenChange, onSubmit, loading = false }: CreatePollDialogProps) {
  const [question, setQuestion] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [allowAddOptions, setAllowAddOptions] = useState(false);
  const [anonymous, setAnonymous] = useState(false);
  const [deadline, setDeadline] = useState('');
  const [error, setError] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setQuestion('');
    setDescription('');
    setOptions(['', '']);
    setAllowMultiple(false);
    setAllowAddOptions(false);
    setAnonymous(false);
    setDeadline('');
    setError(null);
  }, []);

  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open, resetForm]);

  const handleOptionChange = (index: number, value: string) => {
    setOptions(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleAddOption = () => {
    setOptions(prev => [...prev, '']);
  };

  const handleRemoveOption = (index: number) => {
    setOptions(prev => {
      if (prev.length <= 2) {
        return prev;
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const trimmedQuestion = question.trim();
    const sanitizedOptions = options.map(option => option.trim()).filter(Boolean);

    if (!trimmedQuestion) {
      setError('請輸入投票問題');
      return;
    }

    if (sanitizedOptions.length < 2) {
      setError('請至少輸入兩個選項');
      return;
    }

    setError(null);

    try {
      await onSubmit({
        question: trimmedQuestion,
        description: description.trim() ? description.trim() : undefined,
        options: sanitizedOptions,
        allowMultiple,
        allowAddOptions,
        anonymous,
        deadline: deadline || undefined,
      });
      resetForm();
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : '建立投票失敗';
      setError(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          <DialogHeader>
            <DialogTitle>建立投票</DialogTitle>
            <DialogDescription>為頻道成員建立一個新的投票。至少需要兩個選項才能建立。</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="poll-question">投票問題</Label>
              <Input
                id="poll-question"
                placeholder="例如：本週團建活動想去哪裡？"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="poll-description">補充說明（選填）</Label>
              <Textarea
                id="poll-description"
                placeholder="提供投票背景資訊或補充說明"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                disabled={loading}
                rows={3}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">投票選項</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleAddOption}
                  className="text-morandi-gold hover:text-morandi-gold-hover"
                  disabled={loading}
                >
                  <Plus size={16} className="mr-1" /> 新增選項
                </Button>
              </div>

              <div className="space-y-2">
                {options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      placeholder={`選項 ${index + 1}`}
                      value={option}
                      onChange={(event) => handleOptionChange(index, event.target.value)}
                      disabled={loading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveOption(index)}
                      className={cn(
                        'text-morandi-secondary hover:text-morandi-red',
                        options.length <= 2 && 'opacity-40 pointer-events-none'
                      )}
                      disabled={loading || options.length <= 2}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-morandi-primary">允許複選</p>
                  <p className="text-xs text-morandi-secondary">成員可選擇多個選項</p>
                </div>
                <Switch checked={allowMultiple} onCheckedChange={setAllowMultiple} disabled={loading} />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-morandi-primary">允許新增選項</p>
                  <p className="text-xs text-morandi-secondary">成員可自行新增投票選項</p>
                </div>
                <Switch checked={allowAddOptions} onCheckedChange={setAllowAddOptions} disabled={loading} />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-morandi-primary">匿名投票</p>
                  <p className="text-xs text-morandi-secondary">隱藏投票者資訊</p>
                </div>
                <Switch checked={anonymous} onCheckedChange={setAnonymous} disabled={loading} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="poll-deadline">截止時間（選填）</Label>
              <Input
                id="poll-deadline"
                type="datetime-local"
                value={deadline}
                onChange={(event) => setDeadline(event.target.value)}
                disabled={loading}
              />
            </div>

            {error && (
              <p className="text-sm text-morandi-red">{error}</p>
            )}
          </div>

          <DialogFooter className="flex flex-col sm:flex-row sm:justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              取消
            </Button>
            <Button type="submit" disabled={loading} className="bg-morandi-gold hover:bg-morandi-gold-hover text-white">
              {loading ? '建立中…' : '建立投票'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
