import { create } from 'zustand';
import { persist } from 'zustand/middleware';
// ⚠️ 暫時註解以測試編譯問題
// import { supabase } from '@/lib/supabase/client';
// import { VenturoAPI } from '@/lib/supabase/api';
import { v4 as uuidv4 } from 'uuid';

// ============= 1. 離線狀態管理 =============
interface OfflineState {
  isOnline: boolean;
  isInitialSync: boolean;
  lastSyncTime: Date | null;
  pendingChanges: SyncOperation[];
  conflictResolutions: ConflictResolution[];

  setOnline: (status: boolean) => void;
  addPendingChange: (operation: SyncOperation) => void;
  removePendingChange: (id: string) => void;
  clearPendingChanges: () => void;
  setLastSyncTime: (time: Date) => void;
}

export const useOfflineStore = create<OfflineState>()(
  persist(
    (set) => ({
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      isInitialSync: false,
      lastSyncTime: null,
      pendingChanges: [],
      conflictResolutions: [],

      setOnline: (status) => set({ isOnline: status }),
      addPendingChange: (operation) => set((state) => ({
        pendingChanges: [...state.pendingChanges, operation]
      })),
      removePendingChange: (id) => set((state) => ({
        pendingChanges: state.pendingChanges.filter(op => op.id !== id)
      })),
      clearPendingChanges: () => set({ pendingChanges: [] }),
      setLastSyncTime: (time) => set({ lastSyncTime: time })
    }),
    {
      name: 'offline-storage',
      partialize: (state) => ({
        pendingChanges: state.pendingChanges,
        lastSyncTime: state.lastSyncTime
      })
    }
  )
);

// ============= 2. 同步操作定義 =============
export interface SyncOperation {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  table: string;
  data: any;
  localId?: string;
  remoteId?: string;
  timestamp: number;
  retryCount: number;
  userId: string;
}

export interface ConflictResolution {
  id: string;
  table: string;
  localData: any;
  remoteData: any;
  resolution: 'LOCAL' | 'REMOTE' | 'MERGE';
  resolvedData?: any;
  timestamp: number;
}

// ============= 3. 離線資料庫管理 =============
export class LocalDatabase {
  private dbName = 'venturo-local';
  private version = 2; // 升級版本以加入 visas 表格
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    // 檢查是否在瀏覽器環境
    if (typeof window === 'undefined' || !window.indexedDB) {
      console.warn('IndexedDB not available (server-side)');
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 建立各個資料表的 Object Store
        const tables = [
          'tours', 'orders', 'customers', 'payments',
          'members', 'users', 'todos', 'quotes', 'visas'
        ];

        tables.forEach(table => {
          if (!db.objectStoreNames.contains(table)) {
            const store = db.createObjectStore(table, { keyPath: 'id' });
            store.createIndex('sync_status', 'sync_status', { unique: false });
            store.createIndex('updated_at', 'updated_at', { unique: false });
          }
        });

        // 建立同步元資料表
        if (!db.objectStoreNames.contains('sync_metadata')) {
          db.createObjectStore('sync_metadata', { keyPath: 'table' });
        }
      };
    });
  }

  async get(table: string, id: string): Promise<any> {
    if (!this.db) await this.init();
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([table], 'readonly');
      const store = transaction.objectStore(table);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll(table: string): Promise<any[]> {
    if (!this.db) await this.init();
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([table], 'readonly');
      const store = transaction.objectStore(table);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async put(table: string, data: any): Promise<void> {
    if (!this.db) await this.init();
    if (!this.db) return;

    const record = {
      ...data,
      sync_status: 'pending',
      updated_at: new Date().toISOString(),
      local_updated: true
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([table], 'readwrite');
      const store = transaction.objectStore(table);
      const request = store.put(record);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async delete(table: string, id: string): Promise<void> {
    if (!this.db) await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([table], 'readwrite');
      const store = transaction.objectStore(table);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getUnsyncedRecords(table: string): Promise<any[]> {
    if (!this.db) await this.init();
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([table], 'readonly');
      const store = transaction.objectStore(table);
      const index = store.index('sync_status');
      const request = index.getAll('pending');

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }
}

// ============= 4. 同步管理器 =============
export class SyncManager {
  private localDb: LocalDatabase;
  private syncQueue: SyncOperation[] = [];
  private isSyncing = false;
  private syncInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.localDb = new LocalDatabase();
    // 只在瀏覽器環境初始化
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  private async init() {
    await this.localDb.init();

    // 監聽網路狀態變化
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleOnline());
      window.addEventListener('offline', () => this.handleOffline());
    }

    // 不啟動定期同步，只在有變更時同步
    // this.startPeriodicSync();
  }

  private handleOnline = async () => {
    console.log('🟢 網路已連接，開始同步...');
    useOfflineStore.getState().setOnline(true);
    await this.syncAll();
  };

  private handleOffline = () => {
    console.log('🔴 網路已斷開，切換到離線模式');
    useOfflineStore.getState().setOnline(false);
  };

  private startPeriodicSync() {
    this.syncInterval = setInterval(() => {
      if (useOfflineStore.getState().isOnline && !this.isSyncing) {
        this.syncPendingChanges();
      }
    }, 5000); // 改為 5 秒，更即時的同步
  }

  // ============= 樂觀更新 =============
  async optimisticCreate(table: string, data: any): Promise<any> {
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 處理需要伺服器編號的欄位
    const record = {
      ...data,
      id: tempId,
      // 如果是訂單，使用「待編號」
      ...(table === 'orders' && { order_number: '待編號' }),
      // 如果是旅遊團，使用「待編號」
      ...(table === 'tours' && { code: '待編號' }),
      // 如果是報價單，使用「待編號」
      ...(table === 'quotes' && { quote_number: '待編號' }),
      syncStatus: 'pending',
      isOfflineDraft: true // 標記為離線草稿
    };

    await this.localDb.put(table, record);

    const operation: SyncOperation = {
      id: uuidv4(),
      type: 'CREATE',
      table,
      data, // 保存原始資料（不含臨時欄位）
      localId: tempId,
      timestamp: Date.now(),
      retryCount: 0,
      userId: data.created_by || 'unknown'
    };

    useOfflineStore.getState().addPendingChange(operation);

    if (useOfflineStore.getState().isOnline) {
      this.syncOperation(operation);
    }

    return record;
  }

  async optimisticUpdate(table: string, id: string, updates: any): Promise<any> {
    const existing = await this.localDb.get(table, id);
    const updated = { ...existing, ...updates };

    await this.localDb.put(table, updated);

    const operation: SyncOperation = {
      id: uuidv4(),
      type: 'UPDATE',
      table,
      data: { id, ...updates },
      remoteId: id,
      timestamp: Date.now(),
      retryCount: 0,
      userId: updates.updated_by || 'unknown'
    };

    useOfflineStore.getState().addPendingChange(operation);

    if (useOfflineStore.getState().isOnline) {
      this.syncOperation(operation);
    }

    return updated;
  }

  async optimisticDelete(table: string, id: string): Promise<void> {
    await this.localDb.put(table, {
      id,
      deleted: true,
      deleted_at: new Date().toISOString()
    });

    const operation: SyncOperation = {
      id: uuidv4(),
      type: 'DELETE',
      table,
      data: { id },
      remoteId: id,
      timestamp: Date.now(),
      retryCount: 0,
      userId: 'unknown'
    };

    useOfflineStore.getState().addPendingChange(operation);

    if (useOfflineStore.getState().isOnline) {
      this.syncOperation(operation);
    }
  }

  // ============= 同步執行 =============
  private async syncOperation(operation: SyncOperation): Promise<void> {
    // 📦 純本地模式 - 停用 Supabase 同步
    console.log(`📦 本地模式：跳過同步操作 ${operation.type} ${operation.table}`);
    useOfflineStore.getState().removePendingChange(operation.id);
    return;

    /* ⚠️ Supabase 同步功能已停用
    try {
      switch (operation.type) {
        case 'CREATE':
          // 1. 如果需要伺服器編號，先取號
          let dataWithNumber = { ...operation.data };

          if (operation.table === 'orders' && !operation.data.order_number) {
            const orderNumber = await this.getNextOrderNumber();
            dataWithNumber.order_number = orderNumber;
          } else if (operation.table === 'tours' && !operation.data.code) {
            const code = await this.getNextTourCode();
            dataWithNumber.code = code;
          } else if (operation.table === 'quotes' && !operation.data.quote_number) {
            const quoteNumber = await this.getNextQuoteNumber();
            dataWithNumber.quote_number = quoteNumber;
          }

          // 2. 使用 VenturoAPI 插入（自動處理 camelCase -> snake_case）
          const created = await VenturoAPI.create(operation.table, dataWithNumber);

          // 3. 更新本地記錄：用真實 ID 和編號替換臨時的
          if (created && operation.localId) {
            await this.updateLocalId(operation.table, operation.localId, created);
          }
          break;

        case 'UPDATE':
          // 使用 VenturoAPI 更新（自動處理 camelCase -> snake_case）
          if (!operation.data.id) {
            throw new Error('Update operation missing id');
          }
          await VenturoAPI.update(operation.table, operation.data.id, operation.data);
          break;

        case 'DELETE':
          // 使用 VenturoAPI 刪除
          if (!operation.remoteId) {
            throw new Error('Delete operation missing remoteId');
          }
          await VenturoAPI.delete(operation.table, operation.remoteId);
          break;
      }

      // 同步成功，移除待同步項目
      useOfflineStore.getState().removePendingChange(operation.id);

    } catch (error) {
      // 只在開發模式顯示同步錯誤
      if (process.env.NODE_ENV === 'development') {
        console.warn(`⚠️ 同步失敗 [${operation.type}] - 將稍後重試:`, error);
      }

      operation.retryCount++;

      if (operation.retryCount > 3) {
        await this.handleConflict(operation, error);
      }
    }
    */
  }

  private async updateLocalId(table: string, localId: string, remoteData: any) {
    const localRecord = await this.localDb.get(table, localId);
    if (localRecord) {
      // 刪除臨時記錄
      await this.localDb.delete(table, localId);

      // 用伺服器的完整資料（包含真實 ID 和編號）建立新記錄
      await this.localDb.put(table, {
        ...remoteData,
        syncStatus: 'synced',
        isOfflineDraft: false
      });

      console.log(`✅ 已同步 ${table}:`, {
        from: localId,
        to: remoteData.id,
        number: remoteData.order_number || remoteData.code || remoteData.quote_number
      });
    }
  }

  // ============= 編號生成 =============
  private async getNextOrderNumber(): Promise<string> {
    // 從 Supabase 取得最新的訂單編號
    const { data, error } = await supabase
      .from('orders')
      .select('orderNumber')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      // 如果沒有資料，從 ORDER-2024-0001 開始
      return `ORDER-${new Date().getFullYear()}-0001`;
    }

    // 解析編號並遞增
    const match = data.order_number.match(/ORDER-(\d{4})-(\d{4})/);
    if (match) {
      const year = new Date().getFullYear();
      const lastNumber = parseInt(match[2]);
      const newNumber = (lastNumber + 1).toString().padStart(4, '0');
      return `ORDER-${year}-${newNumber}`;
    }

    return `ORDER-${new Date().getFullYear()}-0001`;
  }

  private async getNextTourCode(): Promise<string> {
    const { data, error } = await supabase
      .from('tours')
      .select('code')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return `TOUR-${new Date().getFullYear()}-0001`;
    }

    const match = data.code.match(/TOUR-(\d{4})-(\d{4})/);
    if (match) {
      const year = new Date().getFullYear();
      const lastNumber = parseInt(match[2]);
      const newNumber = (lastNumber + 1).toString().padStart(4, '0');
      return `TOUR-${year}-${newNumber}`;
    }

    return `TOUR-${new Date().getFullYear()}-0001`;
  }

  private async getNextQuoteNumber(): Promise<string> {
    const { data, error } = await supabase
      .from('quotes')
      .select('quoteNumber')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return `QUOTE-${new Date().getFullYear()}-0001`;
    }

    const match = data.quote_number.match(/QUOTE-(\d{4})-(\d{4})/);
    if (match) {
      const year = new Date().getFullYear();
      const lastNumber = parseInt(match[2]);
      const newNumber = (lastNumber + 1).toString().padStart(4, '0');
      return `QUOTE-${year}-${newNumber}`;
    }

    return `QUOTE-${new Date().getFullYear()}-0001`;
  }

  // ============= 衝突處理 =============
  private async handleConflict(operation: SyncOperation, error: any) {
    console.warn('偵測到同步衝突:', operation);

    const conflict: ConflictResolution = {
      id: uuidv4(),
      table: operation.table,
      localData: operation.data,
      remoteData: null,
      resolution: 'LOCAL',
      timestamp: Date.now()
    };

    useOfflineStore.setState((state) => ({
      conflictResolutions: [...state.conflictResolutions, conflict]
    }));
  }

  // ============= 批量同步 =============
  async syncAll(): Promise<void> {
    if (this.isSyncing) return;

    this.isSyncing = true;

    try {
      await this.pullRemoteChanges();
      await this.pushLocalChanges();

      useOfflineStore.getState().setLastSyncTime(new Date());

      console.log('✅ 同步完成');

    } catch (error) {
      console.error('同步失敗:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  private async pullRemoteChanges() {
    // 📦 純本地模式 - 停用 Supabase 同步
    console.log('📦 本地模式：跳過從雲端同步');
    return;

    /* ⚠️ Supabase 同步功能已停用
    const lastSync = useOfflineStore.getState().lastSyncTime;
    const tables = ['tours', 'orders', 'customers', 'payments', 'todos', 'quotes'];

    for (const table of tables) {
      try {
        let query = supabase.from(table).select('*');

        if (lastSync) {
          query = query.gt('updated_at', lastSync.toISOString());
        }

        const { data, error } = await query;

        if (error) throw error;

        for (const record of data || []) {
          await this.localDb.put(table, {
            ...record,
            sync_status: 'synced'
          });
        }

      } catch (error) {
        console.error(`同步 ${table} 失敗:`, error);
      }
    }
    */
  }

  private async pushLocalChanges() {
    const pendingChanges = useOfflineStore.getState().pendingChanges;

    for (const operation of pendingChanges) {
      await this.syncOperation(operation);
    }
  }

  private async syncPendingChanges() {
    const pendingChanges = useOfflineStore.getState().pendingChanges;

    if (pendingChanges.length === 0) return;

    console.log(`⏳ 同步 ${pendingChanges.length} 個待處理變更...`);

    // 去除重複的操作（相同 table + id）
    const uniqueOperations = pendingChanges.reduce((acc, op) => {
      const key = `${op.table}-${op.data?.id || op.localId}`;
      if (!acc.has(key)) {
        acc.set(key, op);
      }
      return acc;
    }, new Map());

    console.log(`✓ 去除重複後：${uniqueOperations.size} 個待處理變更`);

    // 並行處理所有同步操作，提升效能
    await Promise.allSettled(
      Array.from(uniqueOperations.values()).map(operation => this.syncOperation(operation))
    );
  }

  dispose() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
  }

  getLocalDb() {
    return this.localDb;
  }
}

// ============= 5. React Hooks =============
export function useOfflineSync() {
  const { isOnline, pendingChanges, lastSyncTime } = useOfflineStore();

  return {
    isOnline,
    hasPendingChanges: pendingChanges.length > 0,
    pendingCount: pendingChanges.length,
    lastSyncTime,
    syncStatus: !isOnline ? 'offline' :
                pendingChanges.length > 0 ? 'pending' :
                'synced'
  };
}

// 單例模式 - 懶加載，只在瀏覽器環境創建
let syncManagerInstance: SyncManager | null = null;

export function getSyncManager(): SyncManager {
  if (typeof window === 'undefined') {
    // Server-side: 返回 mock 對象
    return {} as SyncManager;
  }

  if (!syncManagerInstance) {
    syncManagerInstance = new SyncManager();
  }

  return syncManagerInstance;
}

// 為了向下相容，保留舊的導出方式
export const syncManager = typeof window !== 'undefined' ? getSyncManager() : {} as SyncManager;
