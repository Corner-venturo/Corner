import { useState, useRef, useCallback, useEffect } from 'react';
import { PASSPORT_REQUIREMENTS, TAIWAN_COMPATRIOT_REQUIREMENTS, type RequirementSection } from '@/constants/visa-info';

type CopyStatus = 'idle' | 'success' | 'error';
type VisaTabType = 'passport' | 'taiwan';

/**
 * 簽證資訊複製 Hook
 * 處理簽證資訊的勾選、文字生成和複製到剪貼簿
 */
export const useCopyVisaInfo = () => {
  const [selectedPassportTypes, setSelectedPassportTypes] = useState<Set<number>>(new Set());
  const [selectedTaiwanTypes, setSelectedTaiwanTypes] = useState<Set<number>>(new Set());
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle');
  const copyStatusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 清理 timeout
  useEffect(() => {
    return () => {
      if (copyStatusTimeoutRef.current) {
        clearTimeout(copyStatusTimeoutRef.current);
      }
    };
  }, []);

  /**
   * 根據勾選項目建立複製文字
   */
  const buildSelectedVisaInfoText = useCallback((tabType: VisaTabType) => {
    const lines: string[] = [];

    if (tabType === 'passport') {
      const selectedIndexes = Array.from(selectedPassportTypes).sort((a, b) => a - b);
      selectedIndexes.forEach((index) => {
        const requirement = PASSPORT_REQUIREMENTS[index];
        const isChild = requirement.title.includes('未滿14歲');
        const fee = isChild ? 1400 : 1800;

        lines.push(`${requirement.title} - NT$${fee.toLocaleString()}`);
        requirement.items.forEach((item, itemIndex) => {
          lines.push(`  ${itemIndex + 1}. ${item}`);
        });
        lines.push('');
      });
    } else {
      const selectedIndexes = Array.from(selectedTaiwanTypes).sort((a, b) => a - b);
      selectedIndexes.forEach((index) => {
        const requirement = TAIWAN_COMPATRIOT_REQUIREMENTS[index];
        lines.push(`${requirement.title} - NT$1,800`);
        requirement.items.forEach((item, itemIndex) => {
          lines.push(`  ${itemIndex + 1}. ${item}`);
        });
        lines.push('');
      });
    }

    return lines.join('\n').trim();
  }, [selectedPassportTypes, selectedTaiwanTypes]);

  /**
   * 複製簽證資訊到剪貼簿
   */
  const handleCopyVisaInfo = useCallback(async (tabType: VisaTabType) => {
    try {
      const selectedSet = tabType === 'passport' ? selectedPassportTypes : selectedTaiwanTypes;

      if (selectedSet.size === 0) {
        setCopyStatus('error');
        return;
      }

      const textToCopy = buildSelectedVisaInfoText(tabType);
      let copied = false;

      // 嘗試使用現代 Clipboard API
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(textToCopy);
        copied = true;
      } else if (typeof document !== 'undefined') {
        // 降級方案：使用舊的 execCommand
        const textarea = document.createElement('textarea');
        textarea.value = textToCopy;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        copied = document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      if (!copied) {
        throw new Error('Clipboard not supported');
      }

      setCopyStatus('success');
    } catch (error) {
      setCopyStatus('error');
    } finally {
      // 2秒後重置狀態
      if (copyStatusTimeoutRef.current) {
        clearTimeout(copyStatusTimeoutRef.current);
      }
      copyStatusTimeoutRef.current = setTimeout(() => {
        setCopyStatus('idle');
      }, 2000);
    }
  }, [selectedPassportTypes, selectedTaiwanTypes, buildSelectedVisaInfoText]);

  /**
   * 切換選擇狀態
   */
  const toggleSelection = useCallback((tabType: VisaTabType, index: number) => {
    const selectedSet = tabType === 'passport' ? selectedPassportTypes : selectedTaiwanTypes;
    const setSelected = tabType === 'passport' ? setSelectedPassportTypes : setSelectedTaiwanTypes;

    const newSet = new Set(selectedSet);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setSelected(newSet);
  }, [selectedPassportTypes, selectedTaiwanTypes]);

  return {
    selectedPassportTypes,
    selectedTaiwanTypes,
    copyStatus,
    handleCopyVisaInfo,
    toggleSelection,
    buildSelectedVisaInfoText,
  };
};
