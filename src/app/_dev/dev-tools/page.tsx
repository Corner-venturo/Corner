'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { initializeEmployeePasswords, createTestEmployees } from '@/lib/init-passwords';
import { useUserStore } from '@/stores/user-store';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { DB_NAME } from '@/lib/db/schemas';
import { Shield, Users, Key, AlertTriangle,  /* CheckCircle, */ Settings, Trash2, Hash } from 'lucide-react';

export default function DevToolsPage() {
  const [isInitializing, setIsInitializing] = useState(false);
  const [isCreatingTest, setIsCreatingTest] = useState(false);
  const [devMode, setDevMode] = useState(process.env.NODE_ENV === 'development');
  const [logs, setLogs] = useState<string[]>([]);
  const { items: users } = useUserStore();
  const { channels } = useWorkspaceStore();

  // 攔截 console.log 以顯示在頁面上
  const captureLog = (callback: () => Promise<void>) => {
    return async () => {
      const originalLog = console.log;
      const newLogs: string[] = [];
      
      console.log = (...args) => {
        newLogs.push(args.join(' '));
        originalLog(...args);
      };

      try {
        await callback();
      } finally {
        console.log = originalLog;
        setLogs(newLogs);
      }
    };
  };

  const handleInitPasswords = captureLog(async () => {
    setIsInitializing(true);
    try {
      await initializeEmployeePasswords();
    } finally {
      setIsInitializing(false);
    }
  });

  const handleCreateTestEmployees = captureLog(async () => {
    setIsCreatingTest(true);
    try {
      await createTestEmployees();
    } finally {
      setIsCreatingTest(false);
    }
  });

  const toggleDevMode = () => {
    const newMode = !devMode;
    setDevMode(newMode);
    
    if (newMode) {
      localStorage.setItem('dev-mode', 'true');
    } else {
      localStorage.removeItem('dev-mode');
    }
    
    setLogs([`開發模式已${newMode ? '啟用' : '停用'}`]);
  };

  const clearAllData = () => {
    if (confirm('⚠️ 確定要清除所有本地資料嗎？此操作無法復原！')) {
      localStorage.clear();
      sessionStorage.clear();
      indexedDB.deleteDatabase(DB_NAME);
      setLogs(['✅ 已清除所有本地資料，請重新整理頁面']);
    }
  };

  const clearTestData = async () => {
    if (confirm('⚠️ 確定要清理所有測試資料嗎？（保留人資管理資料）\n\n將清理：\n• 工作空間頻道\n• 旅遊團\n• 報價單\n• 訂單\n• 客戶\n• 待辦事項\n• IndexedDB 所有表格')) {
      const logs: string[] = [];

      try {
        // 1. 清空工作空間頻道（保留一般討論）
        const workspaceData = localStorage.getItem('workspace-storage');
        if (workspaceData) {
          const data = JSON.parse(workspaceData);
          const channelCount = data.state?.channels?.length || 0;
          data.state.channels = [
            {
              id: 'channel-001',
              workspace_id: data.state.currentWorkspace?.id || 'workspace-001',
              name: '一般討論',
              description: '一般事務討論',
              type: 'public',
              created_at: new Date().toISOString()
            }
          ];
          data.state.messages = [];
          localStorage.setItem('workspace-storage', JSON.stringify(data));
          logs.push(`✅ 清空 ${channelCount} 個頻道`);
        }

        // 2. 清空 IndexedDB 所有表格（保留 employees）
        const db = await indexedDB.databases();
        const venturoDb = db.find(d => d.name === DB_NAME);

        if (venturoDb) {
          const request = indexedDB.open(DB_NAME);
          request.onsuccess = (event) => {
            const database = (event.target as IDBOpenDBRequest).result;
            const transaction = database.transaction(database.objectStoreNames, 'readwrite');

            // 清空除了 employees 以外的所有表格
            Array.from(database.objectStoreNames).forEach(storeName => {
              if (storeName !== 'employees') {
                try {
                  transaction.objectStore(storeName).clear();
                  logs.push(`✅ 清空 ${storeName}`);
                } catch (error) {
                  logs.push(`⚠️ 清空 ${storeName} 失敗`);
                }
              }
            });

            transaction.oncomplete = () => {
              logs.push('✅ IndexedDB 清理完成');
              logs.push('⚠️ 請重新整理頁面以載入最新資料');
              setLogs(logs);
            };
          };
        }

        // 3. 清空其他 localStorage 資料（保留認證和員工相關）
        const keysToKeep = ['auth-storage', 'user-storage', 'dev-mode'];
        const allKeys = Object.keys(localStorage);

        allKeys.forEach(key => {
          if (!keysToKeep.some(keep => key.includes(keep))) {
            localStorage.removeItem(key);
          }
        });

        logs.push('✅ 測試資料清理完成');
        logs.push('✅ 已保留：員工資料、認證資訊');
        setLogs(logs);

      } catch (error) {
        console.error('清理失敗:', error);
        setLogs([...logs, '❌ 清理過程發生錯誤']);
      }
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* 標題 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-morandi-primary flex items-center gap-2">
            <Settings size={28} />
            開發者工具
          </h1>
          <p className="text-morandi-secondary mt-2">
            系統初始化和測試工具
          </p>
        </div>

        {/* 系統狀態 */}
        <div className="bg-white rounded-lg border border-border p-4 mb-6">
          <h2 className="font-semibold text-morandi-primary mb-3">系統狀態</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-morandi-secondary" />
              <span className="text-sm text-morandi-secondary">員工數量：</span>
              <span className="font-semibold text-morandi-primary">{users.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <Hash size={18} className="text-morandi-secondary" />
              <span className="text-sm text-morandi-secondary">頻道數量：</span>
              <span className="font-semibold text-morandi-primary">{channels.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield size={18} className="text-morandi-secondary" />
              <span className="text-sm text-morandi-secondary">開發模式：</span>
              <span className={`font-semibold ${devMode ? 'text-green-600' : 'text-red-600'}`}>
                {devMode ? '已啟用' : '已停用'}
              </span>
            </div>
          </div>
        </div>

        {/* 工具按鈕 */}
        <div className="space-y-4">
          {/* 密碼管理 */}
          <div className="bg-white rounded-lg border border-border p-4">
            <h3 className="font-semibold text-morandi-primary mb-3 flex items-center gap-2">
              <Key size={18} />
              密碼管理
            </h3>
            <div className="space-y-3">
              <div>
                <Button
                  onClick={handleInitPasswords}
                  disabled={isInitializing}
                  className="w-full"
                >
                  {isInitializing ? '初始化中...' : '初始化員工密碼'}
                </Button>
                <p className="text-xs text-morandi-secondary mt-1">
                  為現有員工設定預設密碼，格式：員工編號@當前年份
                </p>
              </div>
            </div>
          </div>

          {/* 測試資料 */}
          <div className="bg-white rounded-lg border border-border p-4">
            <h3 className="font-semibold text-morandi-primary mb-3 flex items-center gap-2">
              <Users size={18} />
              測試資料
            </h3>
            <div className="space-y-3">
              <div>
                <Button
                  onClick={handleCreateTestEmployees}
                  disabled={isCreatingTest}
                  variant="outline"
                  className="w-full"
                >
                  {isCreatingTest ? '建立中...' : '建立測試員工'}
                </Button>
                <p className="text-xs text-morandi-secondary mt-1">
                  建立 3 個測試員工帳號（john01, mary01, peter01）
                </p>
              </div>
            </div>
          </div>

          {/* 系統設定 */}
          <div className="bg-white rounded-lg border border-border p-4">
            <h3 className="font-semibold text-morandi-primary mb-3 flex items-center gap-2">
              <Settings size={18} />
              系統設定
            </h3>
            <div className="space-y-3">
              <Button
                onClick={toggleDevMode}
                variant={devMode ? 'default' : 'outline'}
                className="w-full"
              >
                {devMode ? '停用開發模式' : '啟用開發模式'}
              </Button>

              <Button
                onClick={clearTestData}
                variant="outline"
                className="w-full border-orange-300 hover:bg-orange-50"
              >
                <Trash2 size={16} className="mr-2" />
                清理測試資料（保留員工）
              </Button>

              <Button
                onClick={clearAllData}
                variant="destructive"
                className="w-full"
              >
                <AlertTriangle size={16} className="mr-2" />
                清除所有本地資料
              </Button>
            </div>
          </div>
        </div>

        {/* 執行日誌 */}
        {logs.length > 0 && (
          <div className="mt-6 bg-gray-900 text-gray-100 rounded-lg p-4">
            <h3 className="font-semibold mb-2">執行日誌</h3>
            <div className="font-mono text-sm space-y-1">
              {logs.map((log, index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="text-gray-500">{index + 1}.</span>
                  <span className={
                    log.includes('✅') ? 'text-green-400' :
                    log.includes('⚠️') ? 'text-yellow-400' :
                    log.includes('❌') ? 'text-red-400' :
                    'text-gray-300'
                  }>{log}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 預設帳號資訊 */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">預設帳號資訊</h3>
          <div className="space-y-2 text-sm text-blue-800">
            <div className="font-mono bg-white rounded p-2">
              <div>🔐 管理員：admin / admin123</div>
            </div>
            <div className="font-mono bg-white rounded p-2">
              <div>👤 測試員工：</div>
              <div className="ml-4">john01 / john123 (業務部)</div>
              <div className="ml-4">mary01 / mary123 (財務部)</div>
              <div className="ml-4">peter01 / peter123 (人資部)</div>
            </div>
            <p className="text-xs text-blue-600 mt-2">
              ⚠️ 這些是測試用帳號，正式上線前請刪除或修改密碼
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
