'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  PASSPORT_DELIVERY_OPTIONS,
  PASSPORT_REQUIREMENTS,
  PASSPORT_NOTES,
  TAIWAN_COMPATRIOT_DELIVERY_OPTIONS,
  TAIWAN_COMPATRIOT_REQUIREMENTS,
  TAIWAN_COMPATRIOT_NOTES,
  formatCurrency,
  VISA_INFO_TEXT,
  type DeliveryOption,
  type RequirementSection,
} from '../constants/visa-info';

interface VisasInfoDialogProps {
  open: boolean;
  onClose: () => void;
}

export function VisasInfoDialog({ open, onClose }: VisasInfoDialogProps) {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const copyStatusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyStatusTimeoutRef.current) {
        clearTimeout(copyStatusTimeoutRef.current);
      }
    };
  }, []);

  const handleCopyVisaInfo = useCallback(async () => {
    try {
      let copied = false;

      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(VISA_INFO_TEXT);
        copied = true;
      } else if (typeof document !== 'undefined') {
        const textarea = document.createElement('textarea');
        textarea.value = VISA_INFO_TEXT;
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
      if (copyStatusTimeoutRef.current) {
        clearTimeout(copyStatusTimeoutRef.current);
      }
      copyStatusTimeoutRef.current = setTimeout(() => {
        setCopyStatus('idle');
      }, 2000);
    }
  }, []);

  const renderVisaInfoContent = (
    options: DeliveryOption[],
    requirements: RequirementSection[],
    notes: string[],
  ) => (
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
        {requirements.map(section => (
          <div key={section.title} className="space-y-3">
            <h3 className="text-sm font-semibold text-morandi-primary">－{section.title}</h3>
            <ol className="list-decimal space-y-2 pl-5 text-sm text-morandi-secondary">
              {section.items.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ol>
          </div>
        ))}
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <DialogTitle>簽證資訊總覽</DialogTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={handleCopyVisaInfo}
              className="flex items-center gap-2"
            >
              <Copy size={16} />
              複製全部資訊
            </Button>
          </div>
        </DialogHeader>
        {copyStatus !== 'idle' && (
          <p
            className={cn(
              'text-xs',
              copyStatus === 'success' ? 'text-emerald-600' : 'text-red-500'
            )}
          >
            {copyStatus === 'success' ? '已複製簽證資訊' : '複製失敗，請手動複製。'}
          </p>
        )}
        <Tabs defaultValue="passport" className="mt-4">
          <TabsList className="grid h-12 grid-cols-2 rounded-lg bg-morandi-container text-sm text-morandi-secondary">
            <TabsTrigger value="passport">護照</TabsTrigger>
            <TabsTrigger value="taiwan">台胞證</TabsTrigger>
          </TabsList>
          <TabsContent value="passport" className="mt-4">
            {renderVisaInfoContent(PASSPORT_DELIVERY_OPTIONS, PASSPORT_REQUIREMENTS, PASSPORT_NOTES)}
          </TabsContent>
          <TabsContent value="taiwan" className="mt-4">
            {renderVisaInfoContent(
              TAIWAN_COMPATRIOT_DELIVERY_OPTIONS,
              TAIWAN_COMPATRIOT_REQUIREMENTS,
              TAIWAN_COMPATRIOT_NOTES,
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
