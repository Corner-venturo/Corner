'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useOfflineStore } from '@/lib/offline/sync-manager';

export default function ClearOfflineDataPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingDetails, setPendingDetails] = useState<Record<string, number>>({});
  const [showDetails, setShowDetails] = useState(false);
  const router = useRouter();
  const { pendingChanges, clearPendingChanges } = useOfflineStore();

  useEffect(() => {
    setPendingCount(pendingChanges.length);

    // 按表格分組統計
    const byTable = pendingChanges.reduce((acc, op) => {
      acc[op.table] = (acc[op.table] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    setPendingDetails(byTable);
  }, [pendingChanges]);

  const clearOfflineData = async () => {
    setLoading(true);
    setMessage('正在清除...');

    try {
      // 1. 使用 store 的方法清除待同步變更
      clearPendingChanges();

      // 2. 清除 localStorage 中的離線儲存
      localStorage.removeItem('offline-storage');

      // 3. 清除其他可能的離線資料
      const keysToRemove = [
        'offline-queue',
        'offline-data',
        'sync-queue',
        'pending-changes',
        'offline-store'
      ];

      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });

      // 4. 清除所有包含 offline/sync/pending 的 key
      Object.keys(localStorage).forEach(key => {
        if (key.toLowerCase().includes('offline') ||
            key.toLowerCase().includes('sync') ||
            key.toLowerCase().includes('pending')) {
          localStorage.removeItem(key);
        }
      });

      // 5. 清除 IndexedDB 資料庫
      setMessage('正在清除 IndexedDB...');
      try {
        const deleteRequest = indexedDB.deleteDatabase('venturo-local');

        await new Promise((resolve, reject) => {
          deleteRequest.onsuccess = () => {
            console.log('✅ IndexedDB 已清除');
            resolve(true);
          };
          deleteRequest.onerror = () => {
            console.warn('⚠️ IndexedDB 清除失敗，但繼續執行');
            resolve(false);
          };
          deleteRequest.onblocked = () => {
            console.warn('⚠️ IndexedDB 刪除被阻擋，請關閉其他分頁');
            resolve(false);
          };
        });
      } catch (error) {
        console.warn('IndexedDB 清除失敗:', error);
      }

      setMessage('✅ 成功清除所有離線資料！\n\n⚠️ 請完全關閉瀏覽器後重新開啟（不是重新整理）');
      setPendingCount(0);
    } catch (error) {
      setMessage(`❌ 發生錯誤: ${error}`);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const reloadPage = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-orange-600 mb-4">🧹 清除離線資料</h1>
        <p className="text-gray-600 mb-6">
          這個頁面用於清除所有離線同步佇列和快取資料，解決同步錯誤問題。
        </p>

        {pendingCount > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-red-800 font-medium">
                ⚠️ 目前有 {pendingCount} 個待同步的變更
              </p>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-xs text-red-600 hover:text-red-800 underline"
              >
                {showDetails ? '隱藏詳情' : '查看詳情'}
              </button>
            </div>

            {showDetails && Object.keys(pendingDetails).length > 0 && (
              <div className="mt-3 pt-3 border-t border-red-200">
                <p className="text-xs text-red-700 mb-2 font-medium">待同步資料表：</p>
                <div className="space-y-1">
                  {Object.entries(pendingDetails).map(([table, count]) => (
                    <div key={table} className="text-xs text-red-700 flex justify-between">
                      <span className="font-mono">{table}</span>
                      <span className="font-medium">{count} 筆</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-800">
            ⚠️ 注意：這將清除所有待同步的離線變更。請確保已經連接網路並且重要資料已經同步。
          </p>
        </div>

        <Button
          onClick={clearOfflineData}
          disabled={loading}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white mb-4"
        >
          {loading ? '清除中...' : '🧹 清除離線資料'}
        </Button>

        {message && (
          <div className={`p-4 rounded-lg mb-4 whitespace-pre-line ${message.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {message}
          </div>
        )}

        {message.includes('✅') && (
          <Button
            onClick={reloadPage}
            className="w-full"
          >
            重新整理頁面
          </Button>
        )}

        <Button
          onClick={() => router.push('/')}
          variant="outline"
          className="w-full mt-2"
        >
          返回首頁
        </Button>
      </div>
    </div>
  );
}
