'use client';

import { useState } from 'react';
import { Wrench, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface _FixResult {
  success: boolean;
  message: string;
  details?: unknown;
}

interface Issue {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'fixing' | 'success' | 'failed';
  error?: string;
}

export default function FixDatabasePage() {
  const [isFixing, setIsFixing] = useState(false);
  const [issues, setIssues] = useState<Issue[]>([
    {
      id: 'version',
      title: '資料庫版本升級',
      description: '檢查並升級到最新版本 (v2)',
      status: 'pending'
    },
    {
      id: 'regions',
      title: '地區資料表',
      description: '確保 regions 表存在並有正確結構',
      status: 'pending'
    },
    {
      id: 'duplicates',
      title: '重複資料清理',
      description: '移除 code 欄位的重複值',
      status: 'pending'
    },
    {
      id: 'validation',
      title: '結構驗證',
      description: '確認所有必要的表和索引都存在',
      status: 'pending'
    }
  ]);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const updateIssue = (id: string, updates: Partial<Issue>) => {
    setIssues(prev => prev.map(issue => 
      issue.id === id ? { ...issue, ...updates } : issue
    ));
  };

  const fixDatabase = async () => {
    setIsFixing(true);
    setLogs([]);
    addLog('開始修復資料庫問題...');

    try {
      // 1. 版本升級
      updateIssue('version', { status: 'fixing' });
      addLog('檢查資料庫版本...');
      await fixVersion();
      updateIssue('version', { status: 'success' });
      addLog('✅ 資料庫版本檢查完成');

      // 2. 修復 regions 表
      updateIssue('regions', { status: 'fixing' });
      addLog('修復 regions 表...');
      await fixRegionsTable();
      updateIssue('regions', { status: 'success' });
      addLog('✅ regions 表修復完成');

      // 3. 清理重複資料
      updateIssue('duplicates', { status: 'fixing' });
      addLog('清理重複資料...');
      const cleanedCount = await cleanupDuplicates();
      updateIssue('duplicates', { status: 'success' });
      addLog(`✅ 清理完成，移除 ${cleanedCount} 筆重複資料`);

      // 4. 驗證結構
      updateIssue('validation', { status: 'fixing' });
      addLog('驗證資料庫結構...');
      await validateStructure();
      updateIssue('validation', { status: 'success' });
      addLog('✅ 資料庫結構正常');

      addLog('🎉 所有問題已修復！');
    } catch (error) {
      addLog(`❌ 修復失敗: ${error}`);
          } finally {
      setIsFixing(false);
    }
  };

  const fixVersion = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const DB_NAME = 'VenturoOfflineDB';
      const CURRENT_VERSION = 2;
      
      const request = indexedDB.open(DB_NAME, CURRENT_VERSION);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // 如果 regions 表不存在，建立它
        if (!db.objectStoreNames.contains('regions')) {
          const regionsStore = db.createObjectStore('regions', {
            keyPath: 'id',
            autoIncrement: false,
          });

          // 建立索引
          regionsStore.createIndex('code', 'code', { unique: true });
          regionsStore.createIndex('name', 'name', { unique: false });
          regionsStore.createIndex('status', 'status', { unique: false });
          regionsStore.createIndex('is_active', 'is_active', { unique: false });
          regionsStore.createIndex('created_at', 'created_at', { unique: false });
          regionsStore.createIndex('updated_at', 'updated_at', { unique: false });
          regionsStore.createIndex('sync_status', 'sync_status', { unique: false });
        }
      };

      request.onsuccess = () => {
        request.result.close();
        resolve();
      };

      request.onerror = () => {
        reject(new Error(`版本升級失敗: ${request.error?.message}`));
      };
    });
  };

  const fixRegionsTable = async (): Promise<void> => {
    // 清除 localStorage 標記，允許重新初始化
    localStorage.removeItem('regions_initialized');
    
    // 清空 regions 表的現有資料
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('VenturoOfflineDB');
      
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (db.objectStoreNames.contains('regions')) {
          const transaction = db.transaction(['regions'], 'readwrite');
          const objectStore = transaction.objectStore('regions');
          const clearRequest = objectStore.clear();

          clearRequest.onsuccess = () => {
            db.close();
            resolve();
          };

          clearRequest.onerror = () => {
            db.close();
            reject(new Error('清空 regions 表失敗'));
          };
        } else {
          db.close();
          resolve();
        }
      };

      request.onerror = () => {
        reject(new Error('無法開啟資料庫'));
      };
    });
  };

  const cleanupDuplicates = async (): Promise<number> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('VenturoOfflineDB');
      let totalCleaned = 0;

      request.onsuccess = async (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        const tablesToCheck = [
          { table: 'regions', uniqueField: 'code' },
          { table: 'tours', uniqueField: 'code' },
          { table: 'orders', uniqueField: 'code' },
          { table: 'customers', uniqueField: 'code' },
        ];

        for (const { table, uniqueField } of tablesToCheck) {
          if (!db.objectStoreNames.contains(table)) continue;

          try {
            const cleaned = await cleanTableDuplicates(db, table, uniqueField);
            totalCleaned += cleaned;
            if (cleaned > 0) {
              addLog(`  清理 ${table}: 移除 ${cleaned} 筆重複資料`);
            }
          } catch (error) {
                      }
        }

        db.close();
        resolve(totalCleaned);
      };

      request.onerror = () => {
        reject(new Error('無法開啟資料庫'));
      };
    });
  };

  const cleanTableDuplicates = (
    db: IDBDatabase, 
    tableName: string, 
    uniqueField: string
  ): Promise<number> => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([tableName], 'readwrite');
      const objectStore = transaction.objectStore(tableName);
      const getAllRequest = objectStore.getAll();

      getAllRequest.onsuccess = () => {
        const records = getAllRequest.result;
        const seen = new Map<any, any>();
        const duplicates: string[] = [];

        // 找出重複資料
        for (const record of records) {
          const key = record[uniqueField];
          if (key && seen.has(key)) {
            const existing = seen.get(key);
            const existingTime = new Date(existing.updated_at || existing.created_at || 0).getTime();
            const currentTime = new Date(record.updated_at || record.created_at || 0).getTime();
            
            if (currentTime > existingTime) {
              duplicates.push(existing.id);
              seen.set(key, record);
            } else {
              duplicates.push(record.id);
            }
          } else if (key) {
            seen.set(key, record);
          }
        }

        // 刪除重複資料
        if (duplicates.length > 0) {
          for (const id of duplicates) {
            objectStore.delete(id);
          }
        }

        transaction.oncomplete = () => {
          resolve(duplicates.length);
        };

        transaction.onerror = () => {
          reject(new Error('刪除重複資料失敗'));
        };
      };

      getAllRequest.onerror = () => {
        reject(new Error(`讀取 ${tableName} 失敗`));
      };
    });
  };

  const validateStructure = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('VenturoOfflineDB');

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const requiredTables = ['regions', 'tours', 'orders', 'customers', 'employees'];
        const missingTables: string[] = [];

        for (const table of requiredTables) {
          if (!db.objectStoreNames.contains(table)) {
            missingTables.push(table);
          }
        }

        db.close();

        if (missingTables.length > 0) {
          reject(new Error(`缺少資料表: ${missingTables.join(', ')}`));
        } else {
          resolve();
        }
      };

      request.onerror = () => {
        reject(new Error('無法開啟資料庫'));
      };
    });
  };

  const clearDatabase = async () => {
    if (!confirm('確定要完全重置資料庫嗎？所有資料將被刪除！')) {
      return;
    }

    try {
      addLog('正在刪除資料庫...');
      await indexedDB.deleteDatabase('VenturoOfflineDB');
      localStorage.clear();
      addLog('✅ 資料庫已完全重置');
      addLog('請重新整理頁面');
      
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      addLog(`❌ 重置失敗: ${error}`);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
            <Wrench className="text-morandi-gold" />
            資料庫問題修復工具
          </h1>
          <p className="text-morandi-secondary">
            自動檢測並修復 IndexedDB 相關問題
          </p>
        </div>

        {/* Issues List */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="text-yellow-500" size={20} />
            檢測到的問題
          </h2>
          <div className="space-y-3">
            {issues.map(issue => (
              <div 
                key={issue.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border",
                  issue.status === 'success' && "bg-green-50 border-green-200 dark:bg-green-900/20",
                  issue.status === 'failed' && "bg-red-50 border-red-200 dark:bg-red-900/20",
                  issue.status === 'fixing' && "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20",
                  issue.status === 'pending' && "bg-gray-50 border-gray-200 dark:bg-gray-800"
                )}
              >
                <div>
                  <div className="font-medium">{issue.title}</div>
                  <div className="text-sm text-morandi-secondary">{issue.description}</div>
                  {issue.error && (
                    <div className="text-sm text-red-600 mt-1">{issue.error}</div>
                  )}
                </div>
                <div>
                  {issue.status === 'pending' && <Info className="text-gray-400" size={20} />}
                  {issue.status === 'fixing' && (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-yellow-500 border-t-transparent"></div>
                  )}
                  {issue.status === 'success' && <CheckCircle className="text-green-500" size={20} />}
                  {issue.status === 'failed' && <AlertTriangle className="text-red-500" size={20} />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-6">
          <Button 
            onClick={fixDatabase} 
            disabled={isFixing}
            className="flex-1"
          >
            {isFixing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                修復中...
              </>
            ) : (
              <>
                <Wrench className="mr-2" size={16} />
                開始修復
              </>
            )}
          </Button>
          <Button 
            variant="destructive"
            onClick={clearDatabase}
            disabled={isFixing}
          >
            完全重置資料庫
          </Button>
        </div>

        {/* Logs */}
        {logs.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-semibold mb-3">執行記錄</h3>
            <div className="font-mono text-sm space-y-1 max-h-96 overflow-auto">
              {logs.map((log, index) => (
                <div 
                  key={index}
                  className={cn(
                    "text-gray-600 dark:text-gray-400",
                    log.includes('✅') && "text-green-600 dark:text-green-400",
                    log.includes('❌') && "text-red-600 dark:text-red-400",
                    log.includes('🎉') && "text-blue-600 dark:text-blue-400 font-semibold"
                  )}
                >
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
