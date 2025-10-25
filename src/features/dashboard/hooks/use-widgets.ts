'use client';

import { useState, useEffect } from 'react';
import type { WidgetType } from '../types';

const STORAGE_KEY = 'homepage-widgets';
const DEFAULT_WIDGETS: WidgetType[] = ['calculator', 'currency'];

export function useWidgets() {
  const [activeWidgets, setActiveWidgets] = useState<WidgetType[]>(DEFAULT_WIDGETS);

  // 載入設定
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setActiveWidgets(JSON.parse(saved));
    }
  }, []);

  // 切換小工具
  const toggleWidget = (widgetId: WidgetType) => {
    const newWidgets = activeWidgets.includes(widgetId)
      ? activeWidgets.filter((id) => id !== widgetId)
      : [...activeWidgets, widgetId];
    setActiveWidgets(newWidgets);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newWidgets));
    }
  };

  return {
    activeWidgets,
    toggleWidget,
  };
}
