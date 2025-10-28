'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { TABS } from './constants';
import { ToolTab } from './types';
import { Calculator } from './Calculator';
import { CurrencyConverter } from './CurrencyConverter';
import { Notes } from './Notes';
import { Checklist } from './Checklist';

export function QuickTools() {
  const [activeTab, setActiveTab] = useState<ToolTab>('calculator');

  return (
    <div className="h-full flex flex-col">
      {/* 工具選項卡 */}
      <div className="border-b border-border bg-white p-4">
        <div className="flex gap-2">
          {TABS.map(tab => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  activeTab === tab.id
                    ? "bg-morandi-gold text-white"
                    : "text-morandi-secondary hover:bg-morandi-container/20 hover:text-morandi-primary"
                )}
              >
                <IconComponent size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 工具內容區域 */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'calculator' && <Calculator />}
        {activeTab === 'currency' && <CurrencyConverter />}
        {activeTab === 'notes' && <Notes />}
        {activeTab === 'checklist' && <Checklist />}
      </div>
    </div>
  );
}
