/**
 * VENTURO 5.0 - 效能監控組件
 *
 * 開發模式下顯示效能指標
 */

'use client';

import React, { useState, useEffect } from 'react';
import { memoryManager, type MemoryStats } from './memory-manager';
import { cacheStrategy } from '@/lib/cache/cache-strategy';

export function PerformanceMonitor() {
  const [stats, setStats] = useState<MemoryStats | null>(null);
  const [cacheStats, setCacheStats] = useState<unknown>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 只在開發模式顯示
    if (process.env.NODE_ENV !== 'development') return;

    const interval = setInterval(() => {
      setStats(memoryManager.getMemoryStats());
      setCacheStats(cacheStrategy.getStats());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999]">
      {/* 切換按鈕 */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="mb-2 px-3 py-2 bg-black/80 text-white rounded-lg text-xs font-mono hover:bg-black/90 transition-colors"
      >
        {isVisible ? '隱藏' : '顯示'} 效能
      </button>

      {/* 效能面板 */}
      {isVisible && (
        <div className="bg-black/90 text-white rounded-lg p-4 font-mono text-xs space-y-3 backdrop-blur-sm">
          {/* 記憶體使用 */}
          <div>
            <div className="font-bold mb-1">記憶體使用</div>
            {stats ? (
              <>
                <div className="flex items-center gap-2">
                  <span>{stats.isUnderPressure ? '⚠️' : '✅'}</span>
                  <span>
                    {stats.usedMemory} MB / {stats.totalMemory} MB
                  </span>
                </div>
                <div className="mt-1">
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        stats.isUnderPressure ? 'bg-red-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${stats.usagePercent}%` }}
                    />
                  </div>
                  <div className="text-right mt-1 text-gray-400">
                    {stats.usagePercent}%
                  </div>
                </div>
              </>
            ) : (
              <div className="text-gray-400">無法取得記憶體資訊</div>
            )}
          </div>

          {/* 快取統計 */}
          <div>
            <div className="font-bold mb-1">快取統計</div>
            {cacheStats ? (
              <>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-400">熱快取 (記憶體):</span>
                    <span>{cacheStats.hot.size} 項</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">溫快取 (Session):</span>
                    <span>{cacheStats.warm.size} 項</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-gray-400">載入中...</div>
            )}
          </div>

          {/* 操作按鈕 */}
          <div className="pt-2 border-t border-gray-700 space-y-2">
            <button
              onClick={() => {
                memoryManager.cleanup({ clearHot: true, force: true });
                alert('已清理熱快取');
              }}
              className="w-full px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 rounded text-white transition-colors"
            >
              清理熱快取
            </button>
            <button
              onClick={() => {
                memoryManager.cleanup({ clearHot: true, clearWarm: true, force: true });
                alert('已清理所有快取');
              }}
              className="w-full px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded text-white transition-colors"
            >
              清理所有快取
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
