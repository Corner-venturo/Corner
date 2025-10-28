'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  PASSPORT_DELIVERY_OPTIONS,
  PASSPORT_REQUIREMENTS,
  PASSPORT_NOTES,
  TAIWAN_COMPATRIOT_DELIVERY_OPTIONS,
  TAIWAN_COMPATRIOT_REQUIREMENTS,
  TAIWAN_COMPATRIOT_NOTES,
  formatCurrency,
  type DeliveryOption,
  type RequirementSection,
} from '@/constants/visa-info';

interface VisaInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visaInfoTab: 'passport' | 'taiwan';
  setVisaInfoTab: (tab: 'passport' | 'taiwan') => void;
  selectedPassportTypes: Set<number>;
  selectedTaiwanTypes: Set<number>;
  copyStatus: 'idle' | 'success' | 'error';
  handleCopyVisaInfo: (tabType: 'passport' | 'taiwan') => void;
  toggleSelection: (tabType: 'passport' | 'taiwan', index: number) => void;
}

/**
 * 簽證資訊對話框
 * 顯示護照和台胞證的詳細資訊，支援勾選和複製
 */
export const VisaInfoDialog: React.FC<VisaInfoDialogProps> = ({
  open,
  onOpenChange,
  visaInfoTab,
  setVisaInfoTab,
  selectedPassportTypes,
  selectedTaiwanTypes,
  copyStatus,
  handleCopyVisaInfo,
  toggleSelection,
}) => {
  const renderVisaInfoContent = (
    options: DeliveryOption[],
    requirements: RequirementSection[],
    notes: string[],
    tabType: 'passport' | 'taiwan',
  ) => {
    const selectedSet = tabType === 'passport' ? selectedPassportTypes : selectedTaiwanTypes;

    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="grid grid-cols-[1.5fr_1fr_1fr] bg-morandi-container text-xs font-medium uppercase tracking-wide text-morandi-secondary">
            <div className="px-4 py-3">取貨方式／身份</div>
            <div className="px-4 py-3">成人</div>
            <div className="px-4 py-3">兒童（未滿14歲）</div>
          </div>
          {options.map(option => (
            <div
              key={option.method}
              className="grid grid-cols-[1.5fr_1fr_1fr] border-t border-border text-sm text-morandi-primary"
            >
              <div className="px-4 py-3 font-medium">{option.method}</div>
              <div className="px-4 py-3">{formatCurrency(option.adult)}</div>
              <div className="px-4 py-3">{formatCurrency(option.child)}</div>
            </div>
          ))}
        </div>

        <div className="space-y-5">
          {requirements.map((section, index) => {
            const isChild = section.title.includes('未滿14歲');
            const fee = tabType === 'taiwan' ? 1800 : (isChild ? 1400 : 1800);

            return (
              <div key={section.title} className="space-y-3">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedSet.has(index)}
                    onChange={() => toggleSelection(tabType, index)}
                    className="mt-1 w-4 h-4 cursor-pointer"
                  />
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-morandi-primary">
                      {section.title} - NT${fee.toLocaleString()}
                    </h3>
                    <ol className="list-decimal space-y-2 pl-5 text-sm text-morandi-secondary mt-2">
                      {section.items.map((item, itemIndex) => (
                        <li key={itemIndex}>{item}</li>
                      ))}
                    </ol>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-lg bg-morandi-container p-4">
          <ul className="list-disc space-y-2 pl-5 text-sm text-morandi-secondary">
            {notes.map((note, index) => (
              <li key={index}>{note}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between flex-shrink-0 mb-2">
          <DialogTitle>簽證資訊總覽</DialogTitle>
          <Button
            variant="outline"
            onClick={() => handleCopyVisaInfo(visaInfoTab)}
            className="flex items-center gap-2 h-10"
            disabled={visaInfoTab === 'passport' ? selectedPassportTypes.size === 0 : selectedTaiwanTypes.size === 0}
          >
            <Copy size={16} />
            複製已勾選 {visaInfoTab === 'passport'
              ? (selectedPassportTypes.size > 0 && `(${selectedPassportTypes.size})`)
              : (selectedTaiwanTypes.size > 0 && `(${selectedTaiwanTypes.size})`)}
          </Button>
        </DialogHeader>
        {copyStatus !== 'idle' && (
          <p
            className={cn(
              'text-xs mb-2 flex-shrink-0',
              copyStatus === 'success' ? 'text-emerald-600' : 'text-red-500'
            )}
          >
            {copyStatus === 'success' ? '已複製選取的簽證資訊' : '複製失敗，請至少勾選一個項目。'}
          </p>
        )}
        <Tabs value={visaInfoTab} onValueChange={(v) => setVisaInfoTab(v as 'passport' | 'taiwan')} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="h-10 rounded-lg bg-morandi-container text-sm text-morandi-secondary flex-shrink-0">
            <TabsTrigger value="passport">護照</TabsTrigger>
            <TabsTrigger value="taiwan">台胞證</TabsTrigger>
          </TabsList>
          <TabsContent value="passport" className="flex-1 overflow-y-auto mt-4">
            {renderVisaInfoContent(PASSPORT_DELIVERY_OPTIONS, PASSPORT_REQUIREMENTS, PASSPORT_NOTES, 'passport')}
          </TabsContent>
          <TabsContent value="taiwan" className="flex-1 overflow-y-auto mt-4">
            {renderVisaInfoContent(
              TAIWAN_COMPATRIOT_DELIVERY_OPTIONS,
              TAIWAN_COMPATRIOT_REQUIREMENTS,
              TAIWAN_COMPATRIOT_NOTES,
              'taiwan'
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
