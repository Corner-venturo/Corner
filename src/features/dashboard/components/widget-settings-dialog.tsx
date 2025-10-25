'use client';

import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import type { WidgetType } from '../types';
import { AVAILABLE_WIDGETS } from './widget-config';

interface WidgetSettingsDialogProps {
  activeWidgets: WidgetType[];
  onToggleWidget: (widgetId: WidgetType) => void;
}

export function WidgetSettingsDialog({ activeWidgets, onToggleWidget }: WidgetSettingsDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 bg-white border-morandi-gold/20 hover:border-morandi-gold transition-all rounded-xl">
          <Settings className="h-4 w-4" />
          小工具設定
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md border-morandi-gold/20 shadow-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl text-morandi-primary">選擇要顯示的小工具</DialogTitle>
          <p className="text-sm text-morandi-muted mt-1">勾選你想在首頁顯示的小工具</p>
        </DialogHeader>
        <div className="space-y-2 py-4">
          {AVAILABLE_WIDGETS.map((widget) => {
            const Icon = widget.icon as React.ComponentType<{ className?: string }>;
            return (
              <div
                key={widget.id}
                className="flex items-center space-x-3 p-4 rounded-xl border border-morandi-gold/20 bg-white hover:border-morandi-gold cursor-pointer transition-all shadow-sm"
                onClick={() => onToggleWidget(widget.id)}
              >
                <Checkbox
                  checked={activeWidgets.includes(widget.id)}
                  onCheckedChange={() => onToggleWidget(widget.id)}
                />
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#B5986A]/10 to-[#D4C4A8]/10 flex items-center justify-center shadow-sm">
                    <Icon className="h-5 w-5 text-morandi-gold" />
                  </div>
                  <span className="font-medium text-morandi-primary">{widget.name}</span>
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
