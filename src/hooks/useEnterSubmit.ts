import { KeyboardEvent } from 'react';

/**
 * 統一的 Enter 鍵提交處理 Hook
 *
 * 使用方式：
 * const handleKeyDown = useEnterSubmit(handleSubmit);
 * <Input onKeyDown={handleKeyDown} />
 */
export function useEnterSubmit(onSubmit: () => void) {
  return (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };
}

/**
 * 支援 Shift+Enter 換行的版本 (用於 Textarea)
 *
 * 使用方式：
 * const handleKeyDown = useEnterSubmitWithShift(handleSubmit);
 * <Textarea onKeyDown={handleKeyDown} />
 */
export function useEnterSubmitWithShift(onSubmit: () => void) {
  return (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Shift+Enter = 換行，Enter = 提交
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };
}
