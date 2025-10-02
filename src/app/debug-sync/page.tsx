'use client';

import { useEffect, useState } from 'react';
import { useOfflineStore } from '@/lib/offline/sync-manager';
import { Button } from '@/components/ui/button';

export default function DebugSyncPage() {
  const [pendingChanges, setPendingChanges] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);
  const clearPendingChanges = useOfflineStore(state => state.clearPendingChanges);

  useEffect(() => {
    setMounted(true);
    const changes = useOfflineStore.getState().pendingChanges;
    setPendingChanges(changes);
  }, []);

  const handleClearAll = () => {
    if (confirm('確定要清除所有待同步項目嗎？這將無法復原。')) {
      clearPendingChanges();
      setPendingChanges([]);
      alert('已清除所有待同步項目');
    }
  };

  if (!mounted) {
    return <div className="p-6">載入中...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">同步狀態除錯</h1>
        <Button
          onClick={handleClearAll}
          variant="destructive"
          disabled={pendingChanges.length === 0}
        >
          清除所有待同步項目 ({pendingChanges.length})
        </Button>
      </div>

      <div className="bg-card border rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4">待同步項目詳情</h2>

        {pendingChanges.length === 0 ? (
          <p className="text-gray-500">沒有待同步的項目</p>
        ) : (
          <div className="space-y-4">
            {pendingChanges.map((change, index) => (
              <div key={change.id} className="border rounded p-4 bg-gray-50">
                <div className="grid grid-cols-2 gap-4 mb-2">
                  <div>
                    <span className="font-medium">項目 #{index + 1}</span>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded text-xs ${
                      change.type === 'CREATE' ? 'bg-green-100 text-green-800' :
                      change.type === 'UPDATE' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {change.type}
                    </span>
                  </div>
                </div>

                <div className="space-y-1 text-sm">
                  <div><strong>表格:</strong> {change.table}</div>
                  <div><strong>操作 ID:</strong> {change.id}</div>
                  <div><strong>本地 ID:</strong> {change.localId || 'N/A'}</div>
                  <div><strong>遠端 ID:</strong> {change.remoteId || 'N/A'}</div>
                  <div><strong>重試次數:</strong> {change.retryCount}</div>
                  <div><strong>時間戳:</strong> {new Date(change.timestamp).toLocaleString('zh-TW')}</div>
                  <div><strong>用戶 ID:</strong> {change.userId}</div>
                </div>

                <details className="mt-3">
                  <summary className="cursor-pointer text-sm font-medium">查看資料內容</summary>
                  <pre className="mt-2 p-2 bg-white rounded text-xs overflow-auto max-h-48">
                    {JSON.stringify(change.data, null, 2)}
                  </pre>
                </details>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-800 mb-2">說明</h3>
        <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
          <li>如果重試次數 &gt; 3，表示同步多次失敗</li>
          <li>檢查資料內容是否有不符合資料庫結構的欄位</li>
          <li>確認 Supabase 資料庫表格是否存在</li>
          <li>如果確定這些資料不需要，可以清除待同步項目</li>
        </ul>
      </div>
    </div>
  );
}
