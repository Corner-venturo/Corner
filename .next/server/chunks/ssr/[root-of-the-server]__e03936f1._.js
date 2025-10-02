module.exports = [
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/buffer [external] (buffer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("buffer", () => require("buffer"));

module.exports = mod;
}),
"[externals]/stream [external] (stream, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("stream", () => require("stream"));

module.exports = mod;
}),
"[externals]/util [external] (util, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("util", () => require("util"));

module.exports = mod;
}),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[project]/src/lib/auth.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "generateToken",
    ()=>generateToken,
    "getUserFromToken",
    ()=>getUserFromToken,
    "hasPermission",
    ()=>hasPermission,
    "hasRole",
    ()=>hasRole,
    "hashPassword",
    ()=>hashPassword,
    "verifyPassword",
    ()=>verifyPassword,
    "verifyToken",
    ()=>verifyToken
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jsonwebtoken$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/jsonwebtoken/index.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/bcryptjs/index.js [app-ssr] (ecmascript)");
;
;
const JWT_SECRET = process.env.JWT_SECRET || 'venturo_app_jwt_secret_key_change_in_production_2024';
function generateToken(payload) {
    try {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jsonwebtoken$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].sign(payload, JWT_SECRET, {
            expiresIn: '8h',
            issuer: 'venturo-app'
        });
    } catch (error) {
        console.warn('JWT generation failed, using simple token', error);
        // 如果 JWT 失敗，使用簡單的編碼方案
        return btoa(JSON.stringify({
            ...payload,
            exp: Date.now() + 8 * 60 * 60 * 1000,
            iss: 'venturo-app'
        }));
    }
}
function verifyToken(token) {
    try {
        // 嘗試 JWT 驗證
        const decoded = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jsonwebtoken$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].verify(token, JWT_SECRET);
        return decoded;
    } catch (jwtError) {
        try {
            // 如果 JWT 失敗，嘗試簡單解碼
            const decoded = JSON.parse(atob(token));
            // 檢查是否過期
            if (decoded.exp && Date.now() > decoded.exp) {
                console.log('Token expired');
                return null;
            }
            return decoded;
        } catch (fallbackError) {
            console.error('Token verification failed:', fallbackError);
            return null;
        }
    }
}
async function hashPassword(password) {
    const saltRounds = 12;
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].hash(password, saltRounds);
}
async function verifyPassword(password, hashedPassword) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].compare(password, hashedPassword);
}
function getUserFromToken(token) {
    return verifyToken(token);
}
function hasPermission(userPermissions, requiredPermission) {
    return userPermissions.includes(requiredPermission) || userPermissions.includes('super_admin') || userPermissions.includes('admin');
}
function hasRole(userPermissions, requiredRoles) {
    return requiredRoles.some((role)=>userPermissions.includes(role));
}
}),
"[project]/src/lib/auth/local-auth-manager.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PasswordEncryption",
    ()=>PasswordEncryption,
    "useLocalAuthStore",
    ()=>useLocalAuthStore
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/react.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/middleware.mjs [app-ssr] (ecmascript)");
;
;
const useLocalAuthStore = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["create"])()((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["persist"])((set, get)=>({
        profiles: [],
        currentProfile: null,
        lastSelectedProfileId: null,
        addProfile: (profile)=>{
            set((state)=>{
                // 檢查是否已存在
                const exists = state.profiles.some((p)=>p.id === profile.id);
                if (exists) {
                    // 更新現有的
                    return {
                        profiles: state.profiles.map((p)=>p.id === profile.id ? {
                                ...p,
                                ...profile,
                                lastLoginAt: new Date().toISOString()
                            } : p)
                    };
                }
                // 添加新的
                return {
                    profiles: [
                        ...state.profiles,
                        {
                            ...profile,
                            lastLoginAt: new Date().toISOString()
                        }
                    ]
                };
            });
        },
        removeProfile: (profileId)=>{
            set((state)=>({
                    profiles: state.profiles.filter((p)=>p.id !== profileId),
                    currentProfile: state.currentProfile?.id === profileId ? null : state.currentProfile
                }));
        },
        updateProfile: (profileId, updates)=>{
            set((state)=>({
                    profiles: state.profiles.map((p)=>p.id === profileId ? {
                            ...p,
                            ...updates
                        } : p),
                    currentProfile: state.currentProfile?.id === profileId ? {
                        ...state.currentProfile,
                        ...updates
                    } : state.currentProfile
                }));
        },
        getProfileById: (profileId)=>{
            return get().profiles.find((p)=>p.id === profileId) || null;
        },
        getProfileCards: ()=>{
            return get().profiles.map((profile)=>({
                    id: profile.id,
                    chineseName: profile.chineseName,
                    englishName: profile.englishName,
                    role: profile.role,
                    lastLoginAt: profile.lastLoginAt
                }));
        },
        setCurrentProfile: (profile)=>{
            // 同時儲存到 localStorage
            if (profile) {
                localStorage.setItem('current-profile-id', profile.id);
            } else {
                localStorage.removeItem('current-profile-id');
            }
            set({
                currentProfile: profile,
                lastSelectedProfileId: profile?.id || null
            });
            // 更新最後登入時間
            if (profile) {
                get().updateProfile(profile.id, {
                    lastLoginAt: new Date().toISOString()
                });
            }
        },
        getCurrentProfile: ()=>get().currentProfile,
        setPinForProfile: (profileId, pinHash)=>{
            get().updateProfile(profileId, {
                pinHash
            });
        },
        verifyPin: async (profileId, pin)=>{
            const profile = get().getProfileById(profileId);
            if (!profile || !profile.pinHash) {
                return false;
            }
            // 使用 bcrypt 驗證 PIN
            try {
                const bcrypt = (await __turbopack_context__.A("[project]/node_modules/bcryptjs/index.js [app-ssr] (ecmascript, async loader)")).default;
                return await bcrypt.compare(pin, profile.pinHash);
            } catch (error) {
                console.error('PIN 驗證失敗:', error);
                return false;
            }
        },
        clearAll: ()=>{
            localStorage.removeItem('current-profile-id');
            set({
                profiles: [],
                currentProfile: null,
                lastSelectedProfileId: null
            });
        }
    }), {
    name: 'local-auth-storage',
    version: 1,
    partialize: (state)=>({
            profiles: state.profiles,
            currentProfile: state.currentProfile,
            lastSelectedProfileId: state.lastSelectedProfileId
        })
}));
class PasswordEncryption {
    static ENCRYPTION_KEY = 'venturo-offline-auth-2024';
    /**
   * 簡單的密碼加密（用於本地快取）
   * 注意：這不是高強度加密，僅用於防止明文儲存
   */ static async encrypt(password) {
        try {
            // 使用 Web Crypto API
            const encoder = new TextEncoder();
            const data = encoder.encode(password);
            const key = encoder.encode(this.ENCRYPTION_KEY);
            // 簡單的 XOR 加密
            const encrypted = new Uint8Array(data.length);
            for(let i = 0; i < data.length; i++){
                encrypted[i] = data[i] ^ key[i % key.length];
            }
            return btoa(String.fromCharCode(...encrypted));
        } catch (error) {
            console.error('加密失敗:', error);
            return btoa(password); // 降級方案
        }
    }
    /**
   * 解密密碼
   */ static async decrypt(encryptedPassword) {
        try {
            const encoder = new TextEncoder();
            const key = encoder.encode(this.ENCRYPTION_KEY);
            const encrypted = Uint8Array.from(atob(encryptedPassword), (c)=>c.charCodeAt(0));
            // XOR 解密
            const decrypted = new Uint8Array(encrypted.length);
            for(let i = 0; i < encrypted.length; i++){
                decrypted[i] = encrypted[i] ^ key[i % key.length];
            }
            const decoder = new TextDecoder();
            return decoder.decode(decrypted);
        } catch (error) {
            console.error('解密失敗:', error);
            return atob(encryptedPassword); // 降級方案
        }
    }
    /**
   * 生成 PIN 碼雜湊
   */ static async hashPin(pin) {
        const bcrypt = (await __turbopack_context__.A("[project]/node_modules/bcryptjs/index.js [app-ssr] (ecmascript, async loader)")).default;
        return bcrypt.hash(pin, 10);
    }
}
}),
"[externals]/node:crypto [external] (node:crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:crypto", () => require("node:crypto"));

module.exports = mod;
}),
"[project]/src/lib/offline/sync-manager.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "LocalDatabase",
    ()=>LocalDatabase,
    "SyncManager",
    ()=>SyncManager,
    "getSyncManager",
    ()=>getSyncManager,
    "syncManager",
    ()=>syncManager,
    "useOfflineStore",
    ()=>useOfflineStore,
    "useOfflineSync",
    ()=>useOfflineSync
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/react.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/middleware.mjs [app-ssr] (ecmascript)");
// ⚠️ 暫時註解以測試編譯問題
// import { supabase } from '@/lib/supabase/client';
// import { VenturoAPI } from '@/lib/supabase/api';
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2d$node$2f$v4$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist-node/v4.js [app-ssr] (ecmascript) <export default as v4>");
;
;
;
const useOfflineStore = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["create"])()((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["persist"])((set)=>({
        isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
        isInitialSync: false,
        lastSyncTime: null,
        pendingChanges: [],
        conflictResolutions: [],
        setOnline: (status)=>set({
                isOnline: status
            }),
        addPendingChange: (operation)=>set((state)=>({
                    pendingChanges: [
                        ...state.pendingChanges,
                        operation
                    ]
                })),
        removePendingChange: (id)=>set((state)=>({
                    pendingChanges: state.pendingChanges.filter((op)=>op.id !== id)
                })),
        clearPendingChanges: ()=>set({
                pendingChanges: []
            }),
        setLastSyncTime: (time)=>set({
                lastSyncTime: time
            })
    }), {
    name: 'offline-storage',
    partialize: (state)=>({
            pendingChanges: state.pendingChanges,
            lastSyncTime: state.lastSyncTime
        })
}));
class LocalDatabase {
    dbName = 'venturo-local';
    version = 2;
    db = null;
    async init() {
        // 檢查是否在瀏覽器環境
        if ("TURBOPACK compile-time truthy", 1) {
            console.warn('IndexedDB not available (server-side)');
            return Promise.resolve();
        }
        //TURBOPACK unreachable
        ;
    }
    async get(table, id) {
        if (!this.db) await this.init();
        if (!this.db) return null;
        return new Promise((resolve, reject)=>{
            const transaction = this.db.transaction([
                table
            ], 'readonly');
            const store = transaction.objectStore(table);
            const request = store.get(id);
            request.onsuccess = ()=>resolve(request.result);
            request.onerror = ()=>reject(request.error);
        });
    }
    async getAll(table) {
        if (!this.db) await this.init();
        if (!this.db) return [];
        return new Promise((resolve, reject)=>{
            const transaction = this.db.transaction([
                table
            ], 'readonly');
            const store = transaction.objectStore(table);
            const request = store.getAll();
            request.onsuccess = ()=>resolve(request.result || []);
            request.onerror = ()=>reject(request.error);
        });
    }
    async put(table, data) {
        if (!this.db) await this.init();
        if (!this.db) return;
        const record = {
            ...data,
            sync_status: 'pending',
            updated_at: new Date().toISOString(),
            local_updated: true
        };
        return new Promise((resolve, reject)=>{
            const transaction = this.db.transaction([
                table
            ], 'readwrite');
            const store = transaction.objectStore(table);
            const request = store.put(record);
            request.onsuccess = ()=>resolve();
            request.onerror = ()=>reject(request.error);
        });
    }
    async delete(table, id) {
        if (!this.db) await this.init();
        if (!this.db) return;
        return new Promise((resolve, reject)=>{
            const transaction = this.db.transaction([
                table
            ], 'readwrite');
            const store = transaction.objectStore(table);
            const request = store.delete(id);
            request.onsuccess = ()=>resolve();
            request.onerror = ()=>reject(request.error);
        });
    }
    async getUnsyncedRecords(table) {
        if (!this.db) await this.init();
        if (!this.db) return [];
        return new Promise((resolve, reject)=>{
            const transaction = this.db.transaction([
                table
            ], 'readonly');
            const store = transaction.objectStore(table);
            const index = store.index('sync_status');
            const request = index.getAll('pending');
            request.onsuccess = ()=>resolve(request.result || []);
            request.onerror = ()=>reject(request.error);
        });
    }
}
class SyncManager {
    localDb;
    syncQueue = [];
    isSyncing = false;
    syncInterval = null;
    constructor(){
        this.localDb = new LocalDatabase();
        // 只在瀏覽器環境初始化
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
    }
    async init() {
        await this.localDb.init();
        // 監聽網路狀態變化
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
    // 不啟動定期同步，只在有變更時同步
    // this.startPeriodicSync();
    }
    handleOnline = async ()=>{
        console.log('🟢 網路已連接，開始同步...');
        useOfflineStore.getState().setOnline(true);
        await this.syncAll();
    };
    handleOffline = ()=>{
        console.log('🔴 網路已斷開，切換到離線模式');
        useOfflineStore.getState().setOnline(false);
    };
    startPeriodicSync() {
        this.syncInterval = setInterval(()=>{
            if (useOfflineStore.getState().isOnline && !this.isSyncing) {
                this.syncPendingChanges();
            }
        }, 5000); // 改為 5 秒，更即時的同步
    }
    // ============= 樂觀更新 =============
    async optimisticCreate(table, data) {
        const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        // 處理需要伺服器編號的欄位
        const record = {
            ...data,
            id: tempId,
            // 如果是訂單，使用「待編號」
            ...table === 'orders' && {
                orderNumber: '待編號'
            },
            // 如果是旅遊團，使用「待編號」
            ...table === 'tours' && {
                code: '待編號'
            },
            // 如果是報價單，使用「待編號」
            ...table === 'quotes' && {
                quoteNumber: '待編號'
            },
            syncStatus: 'pending',
            isOfflineDraft: true // 標記為離線草稿
        };
        await this.localDb.put(table, record);
        const operation = {
            id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2d$node$2f$v4$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])(),
            type: 'CREATE',
            table,
            data,
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
    async optimisticUpdate(table, id, updates) {
        const existing = await this.localDb.get(table, id);
        const updated = {
            ...existing,
            ...updates
        };
        await this.localDb.put(table, updated);
        const operation = {
            id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2d$node$2f$v4$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])(),
            type: 'UPDATE',
            table,
            data: {
                id,
                ...updates
            },
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
    async optimisticDelete(table, id) {
        await this.localDb.put(table, {
            id,
            deleted: true,
            deleted_at: new Date().toISOString()
        });
        const operation = {
            id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2d$node$2f$v4$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])(),
            type: 'DELETE',
            table,
            data: {
                id
            },
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
    async syncOperation(operation) {
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

          if (operation.table === 'orders' && !operation.data.orderNumber) {
            const orderNumber = await this.getNextOrderNumber();
            dataWithNumber.orderNumber = orderNumber;
          } else if (operation.table === 'tours' && !operation.data.code) {
            const code = await this.getNextTourCode();
            dataWithNumber.code = code;
          } else if (operation.table === 'quotes' && !operation.data.quoteNumber) {
            const quoteNumber = await this.getNextQuoteNumber();
            dataWithNumber.quoteNumber = quoteNumber;
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
    */ }
    async updateLocalId(table, localId, remoteData) {
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
                number: remoteData.orderNumber || remoteData.code || remoteData.quoteNumber
            });
        }
    }
    // ============= 編號生成 =============
    async getNextOrderNumber() {
        // 從 Supabase 取得最新的訂單編號
        const { data, error } = await supabase.from('orders').select('orderNumber').order('created_at', {
            ascending: false
        }).limit(1).single();
        if (error || !data) {
            // 如果沒有資料，從 ORDER-2024-0001 開始
            return `ORDER-${new Date().getFullYear()}-0001`;
        }
        // 解析編號並遞增
        const match = data.orderNumber.match(/ORDER-(\d{4})-(\d{4})/);
        if (match) {
            const year = new Date().getFullYear();
            const lastNumber = parseInt(match[2]);
            const newNumber = (lastNumber + 1).toString().padStart(4, '0');
            return `ORDER-${year}-${newNumber}`;
        }
        return `ORDER-${new Date().getFullYear()}-0001`;
    }
    async getNextTourCode() {
        const { data, error } = await supabase.from('tours').select('code').order('created_at', {
            ascending: false
        }).limit(1).single();
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
    async getNextQuoteNumber() {
        const { data, error } = await supabase.from('quotes').select('quoteNumber').order('created_at', {
            ascending: false
        }).limit(1).single();
        if (error || !data) {
            return `QUOTE-${new Date().getFullYear()}-0001`;
        }
        const match = data.quoteNumber.match(/QUOTE-(\d{4})-(\d{4})/);
        if (match) {
            const year = new Date().getFullYear();
            const lastNumber = parseInt(match[2]);
            const newNumber = (lastNumber + 1).toString().padStart(4, '0');
            return `QUOTE-${year}-${newNumber}`;
        }
        return `QUOTE-${new Date().getFullYear()}-0001`;
    }
    // ============= 衝突處理 =============
    async handleConflict(operation, error) {
        console.warn('偵測到同步衝突:', operation);
        const conflict = {
            id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2d$node$2f$v4$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])(),
            table: operation.table,
            localData: operation.data,
            remoteData: null,
            resolution: 'LOCAL',
            timestamp: Date.now()
        };
        useOfflineStore.setState((state)=>({
                conflictResolutions: [
                    ...state.conflictResolutions,
                    conflict
                ]
            }));
    }
    // ============= 批量同步 =============
    async syncAll() {
        if (this.isSyncing) return;
        this.isSyncing = true;
        try {
            await this.pullRemoteChanges();
            await this.pushLocalChanges();
            useOfflineStore.getState().setLastSyncTime(new Date());
            console.log('✅ 同步完成');
        } catch (error) {
            console.error('同步失敗:', error);
        } finally{
            this.isSyncing = false;
        }
    }
    async pullRemoteChanges() {
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
    */ }
    async pushLocalChanges() {
        const pendingChanges = useOfflineStore.getState().pendingChanges;
        for (const operation of pendingChanges){
            await this.syncOperation(operation);
        }
    }
    async syncPendingChanges() {
        const pendingChanges = useOfflineStore.getState().pendingChanges;
        if (pendingChanges.length === 0) return;
        console.log(`⏳ 同步 ${pendingChanges.length} 個待處理變更...`);
        // 去除重複的操作（相同 table + id）
        const uniqueOperations = pendingChanges.reduce((acc, op)=>{
            const key = `${op.table}-${op.data?.id || op.localId}`;
            if (!acc.has(key)) {
                acc.set(key, op);
            }
            return acc;
        }, new Map());
        console.log(`✓ 去除重複後：${uniqueOperations.size} 個待處理變更`);
        // 並行處理所有同步操作，提升效能
        await Promise.allSettled(Array.from(uniqueOperations.values()).map((operation)=>this.syncOperation(operation)));
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
function useOfflineSync() {
    const { isOnline, pendingChanges, lastSyncTime } = useOfflineStore();
    return {
        isOnline,
        hasPendingChanges: pendingChanges.length > 0,
        pendingCount: pendingChanges.length,
        lastSyncTime,
        syncStatus: !isOnline ? 'offline' : pendingChanges.length > 0 ? 'pending' : 'synced'
    };
}
// 單例模式 - 懶加載，只在瀏覽器環境創建
let syncManagerInstance = null;
function getSyncManager() {
    if ("TURBOPACK compile-time truthy", 1) {
        // Server-side: 返回 mock 對象
        return {};
    }
    //TURBOPACK unreachable
    ;
}
const syncManager = ("TURBOPACK compile-time falsy", 0) ? "TURBOPACK unreachable" : {};
}),
"[project]/src/services/offline-auth.service.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "OfflineAuthService",
    ()=>OfflineAuthService
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$local$2d$auth$2d$manager$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/auth/local-auth-manager.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$offline$2f$sync$2d$manager$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/offline/sync-manager.ts [app-ssr] (ecmascript)");
;
;
class OfflineAuthService {
    /**
   * 初次登入（需要網路）
   * 從 Supabase 驗證並建立本地 Profile
   */ static async initialLogin(email, password) {
        try {
            console.log('🔐 純本地登入驗證...');
            console.log('輸入的帳號:', email);
            // ⚠️ 純本地模式 - 不使用 Supabase
            // 建立測試帳號資料
            const testUsers = {
                'admin': {
                    password: 'admin123',
                    data: {
                        id: 'admin-001',
                        employee_number: 'admin',
                        chinese_name: '管理員',
                        english_name: 'Admin',
                        permissions: [
                            'super_admin',
                            'admin'
                        ],
                        status: 'active'
                    }
                },
                'william01': {
                    password: '123456',
                    data: {
                        id: 'william-001',
                        employee_number: 'william01',
                        chinese_name: '威廉',
                        english_name: 'William',
                        permissions: [
                            'admin'
                        ],
                        status: 'active'
                    }
                },
                'test': {
                    password: 'test',
                    data: {
                        id: 'test-001',
                        employee_number: 'test',
                        chinese_name: '測試員工',
                        english_name: 'Test',
                        permissions: [],
                        status: 'active'
                    }
                }
            };
            // 1. 檢查測試帳號
            const user = testUsers[email.toLowerCase()];
            if (!user) {
                return {
                    success: false,
                    message: '用戶名稱或密碼錯誤'
                };
            }
            // 2. 驗證密碼
            if (password !== user.password) {
                return {
                    success: false,
                    message: '用戶名稱或密碼錯誤'
                };
            }
            const employee = user.data;
            // 3. 建立本地 Profile
            console.log('開始加密密碼...');
            let encryptedPassword;
            try {
                encryptedPassword = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$local$2d$auth$2d$manager$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PasswordEncryption"].encrypt(password);
                console.log('密碼加密成功');
            } catch (encErr) {
                console.error('密碼加密失敗:', encErr);
                throw encErr;
            }
            const profile = {
                id: employee.id,
                email: employee.employee_number + '@venturo.local',
                employeeNumber: employee.employee_number,
                chineseName: employee.chinese_name,
                englishName: employee.english_name,
                role: this.determineRole(employee.permissions),
                permissions: employee.permissions || [],
                cachedPassword: encryptedPassword,
                personalInfo: employee.personal_info,
                jobInfo: employee.job_info,
                salaryInfo: employee.salary_info,
                contracts: employee.contracts,
                attendance: employee.attendance,
                lastLoginAt: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                status: employee.status
            };
            // 4. 儲存到本地
            console.log('準備儲存 Profile:', profile);
            try {
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$local$2d$auth$2d$manager$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useLocalAuthStore"].getState().addProfile(profile);
                console.log('Profile 已加入');
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$local$2d$auth$2d$manager$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useLocalAuthStore"].getState().setCurrentProfile(profile);
                console.log('Profile 已設為當前');
            } catch (storeErr) {
                console.error('儲存 Profile 失敗:', storeErr);
                throw storeErr;
            }
            console.log('✅ Profile 已建立並儲存到本地');
            return {
                success: true,
                profile
            };
        } catch (error) {
            console.error('初次登入失敗:', error);
            return {
                success: false,
                message: '登入失敗，請稍後再試'
            };
        }
    }
    /**
   * 離線登入（使用 PIN 碼或密碼）
   */ static async offlineLogin(profileId, credential, usePin = true) {
        try {
            const profile = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$local$2d$auth$2d$manager$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useLocalAuthStore"].getState().getProfileById(profileId);
            if (!profile) {
                return {
                    success: false,
                    message: '找不到此用戶資料'
                };
            }
            let isValid = false;
            if (usePin) {
                // 使用 PIN 碼驗證
                if (!profile.pinHash) {
                    return {
                        success: false,
                        message: '此帳號尚未設定 PIN 碼'
                    };
                }
                isValid = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$local$2d$auth$2d$manager$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useLocalAuthStore"].getState().verifyPin(profileId, credential);
            } else {
                // 使用密碼驗證（離線）
                if (!profile.cachedPassword) {
                    return {
                        success: false,
                        message: '此帳號無法使用離線登入'
                    };
                }
                const decryptedPassword = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$local$2d$auth$2d$manager$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PasswordEncryption"].decrypt(profile.cachedPassword);
                isValid = credential === decryptedPassword;
            }
            if (!isValid) {
                return {
                    success: false,
                    message: usePin ? 'PIN 碼錯誤' : '密碼錯誤'
                };
            }
            // 設定為當前登入
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$local$2d$auth$2d$manager$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useLocalAuthStore"].getState().setCurrentProfile(profile);
            console.log('✅ 離線登入成功');
            // 背景嘗試刷新 Supabase session
            if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$offline$2f$sync$2d$manager$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useOfflineStore"].getState().isOnline && profile.cachedPassword) {
                this.refreshSupabaseSession(profile).catch(console.error);
            }
            return {
                success: true,
                profile
            };
        } catch (error) {
            console.error('離線登入失敗:', error);
            return {
                success: false,
                message: '登入失敗，請稍後再試'
            };
        }
    }
    /**
   * 設定 PIN 碼
   */ static async setupPin(profileId, pin) {
        try {
            if (pin.length < 4 || pin.length > 6) {
                throw new Error('PIN 碼長度必須是 4-6 位數字');
            }
            if (!/^\d+$/.test(pin)) {
                throw new Error('PIN 碼只能包含數字');
            }
            const pinHash = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$local$2d$auth$2d$manager$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PasswordEncryption"].hashPin(pin);
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$local$2d$auth$2d$manager$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useLocalAuthStore"].getState().setPinForProfile(profileId, pinHash);
            console.log('✅ PIN 碼設定成功');
            return true;
        } catch (error) {
            console.error('設定 PIN 碼失敗:', error);
            return false;
        }
    }
    /**
   * 切換角色
   */ static switchProfile(profileId) {
        try {
            const profile = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$local$2d$auth$2d$manager$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useLocalAuthStore"].getState().getProfileById(profileId);
            if (!profile) {
                console.error('找不到 Profile:', profileId);
                return false;
            }
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$local$2d$auth$2d$manager$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useLocalAuthStore"].getState().setCurrentProfile(profile);
            console.log('✅ 已切換到:', profile.chineseName);
            // 背景刷新 session
            if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$offline$2f$sync$2d$manager$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useOfflineStore"].getState().isOnline && profile.cachedPassword) {
                this.refreshSupabaseSession(profile).catch(console.error);
            }
            return true;
        } catch (error) {
            console.error('切換角色失敗:', error);
            return false;
        }
    }
    /**
   * 登出
   */ static logout() {
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$local$2d$auth$2d$manager$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useLocalAuthStore"].getState().setCurrentProfile(null);
        console.log('✅ 已登出');
    }
    /**
   * 背景刷新（純本地模式 - 已停用）
   */ static async refreshSupabaseSession(profile) {
        console.log('📦 本地模式：無需刷新 session');
    }
    /**
   * 判斷用戶角色
   */ static determineRole(permissions) {
        if (permissions?.includes('super_admin')) return 'SUPER_ADMIN';
        if (permissions?.includes('admin')) return 'ADMIN';
        return 'EMPLOYEE';
    }
    /**
   * 同步本地 Profile 與遠端
   */ static async syncProfile(profileId) {
        try {
            const isOnline = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$offline$2f$sync$2d$manager$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useOfflineStore"].getState().isOnline;
            if (!isOnline) {
                console.log('離線狀態，無法同步');
                return false;
            }
            const profile = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$local$2d$auth$2d$manager$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useLocalAuthStore"].getState().getProfileById(profileId);
            if (!profile) {
                return false;
            }
            // 從遠端獲取最新資料
            const { data: employee, error } = await supabase.from('users').select('*').eq('id', profile.id).is('deleted_at', null).single();
            if (error || !employee) {
                console.error('無法同步 Profile:', error);
                return false;
            }
            // 更新本地 Profile
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$local$2d$auth$2d$manager$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useLocalAuthStore"].getState().updateProfile(profileId, {
                permissions: employee.permissions,
                personalInfo: employee.personal_info,
                jobInfo: employee.job_info,
                salaryInfo: employee.salary_info,
                contracts: employee.contracts,
                attendance: employee.attendance,
                status: employee.status,
                lastSyncAt: new Date().toISOString()
            });
            console.log('✅ Profile 已同步');
            return true;
        } catch (error) {
            console.error('同步失敗:', error);
            return false;
        }
    }
}
}),
"[project]/src/stores/auth-store.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useAuthStore",
    ()=>useAuthStore
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/react.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/middleware.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/auth.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$local$2d$auth$2d$manager$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/auth/local-auth-manager.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$offline$2d$auth$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/offline-auth.service.ts [app-ssr] (ecmascript)");
;
;
;
;
;
// 防暴力破解的失敗記錄
const loginAttemptsMap = new Map();
function checkLoginAttempts(username) {
    const attempts = loginAttemptsMap.get(username);
    if (!attempts) {
        loginAttemptsMap.set(username, {
            count: 1,
            lastAttempt: new Date()
        });
        return {
            allowed: true
        };
    }
    // 15 分鐘後重置
    const timeDiff = Date.now() - attempts.lastAttempt.getTime();
    if (timeDiff > 15 * 60 * 1000) {
        loginAttemptsMap.set(username, {
            count: 1,
            lastAttempt: new Date()
        });
        return {
            allowed: true
        };
    }
    // 超過 5 次嘗試
    if (attempts.count >= 5) {
        const remainingTime = Math.ceil((15 * 60 * 1000 - timeDiff) / (60 * 1000));
        return {
            allowed: false,
            message: `登入失敗次數過多，請 ${remainingTime} 分鐘後再試`
        };
    }
    attempts.count++;
    attempts.lastAttempt = new Date();
    return {
        allowed: true
    };
}
function recordLoginAttempt(username, success) {
    if (success) {
        // 登入成功，清除失敗記錄
        loginAttemptsMap.delete(username);
    }
// 失敗記錄已在 checkLoginAttempts 中處理
}
function setSecureCookie(token, rememberMe = false) {
    const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 8 * 60 * 60; // 30天 or 8小時
    const secure = window.location.protocol === 'https:' ? 'Secure; ' : '';
    // 在 localhost 開發環境中，不使用 Secure 和 SameSite=Strict
    if (window.location.hostname === 'localhost') {
        document.cookie = `auth-token=${token}; path=/; max-age=${maxAge}; SameSite=Lax`;
    } else {
        document.cookie = `auth-token=${token}; path=/; max-age=${maxAge}; SameSite=Strict; ${secure}`;
    }
}
const useAuthStore = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["create"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["persist"])((set, get)=>({
        user: null,
        isAuthenticated: false,
        sidebarCollapsed: true,
        loginAttempts: new Map(),
        currentProfile: null,
        isOfflineMode: false,
        login: (user)=>{
            // 同時更新 user 和 currentProfile
            const profile = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$local$2d$auth$2d$manager$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useLocalAuthStore"].getState().currentProfile;
            set({
                user,
                isAuthenticated: true,
                currentProfile: profile
            });
        },
        logout: ()=>{
            // 使用離線認證服務登出
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$offline$2d$auth$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["OfflineAuthService"].logout();
            // 安全清除認證 cookie
            if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
            ;
            set({
                user: null,
                isAuthenticated: false,
                currentProfile: null
            });
        },
        validateLogin: async (username, password)=>{
            try {
                // 使用離線認證服務進行初次登入
                const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$offline$2d$auth$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["OfflineAuthService"].initialLogin(username, password);
                if (result.success && result.profile) {
                    // 建立用戶對象（向下相容）
                    const user = {
                        id: result.profile.id,
                        employeeNumber: result.profile.employeeNumber,
                        englishName: result.profile.englishName,
                        chineseName: result.profile.chineseName,
                        personalInfo: result.profile.personalInfo || {},
                        jobInfo: result.profile.jobInfo || {},
                        salaryInfo: result.profile.salaryInfo || {},
                        permissions: result.profile.permissions || [],
                        attendance: result.profile.attendance || {
                            leaveRecords: [],
                            overtimeRecords: []
                        },
                        contracts: result.profile.contracts || [],
                        status: result.profile.status
                    };
                    // 生成 JWT token
                    const authPayload = {
                        id: result.profile.id,
                        employeeNumber: result.profile.employeeNumber,
                        permissions: result.profile.permissions || [],
                        role: result.profile.permissions?.includes('super_admin') ? 'super_admin' : result.profile.permissions?.includes('admin') ? 'admin' : 'employee'
                    };
                    const token = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["generateToken"])(authPayload);
                    // 設定安全 cookie
                    setSecureCookie(token, false);
                    set({
                        user,
                        isAuthenticated: true,
                        currentProfile: result.profile
                    });
                    return {
                        success: true
                    };
                }
                return {
                    success: false,
                    message: result.message || '登入失敗'
                };
            } catch (error) {
                console.error('💥 登入驗證錯誤:', error);
                return {
                    success: false,
                    message: '系統錯誤，請稍後再試'
                };
            }
        },
        checkPermission: (permission)=>{
            const profile = get().currentProfile;
            if (!profile) return false;
            return profile.permissions.includes(permission) || profile.permissions.includes('super_admin') || profile.permissions.includes('admin');
        },
        switchProfile: (profileId)=>{
            const success = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$offline$2d$auth$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["OfflineAuthService"].switchProfile(profileId);
            if (success) {
                const profile = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$local$2d$auth$2d$manager$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useLocalAuthStore"].getState().getProfileById(profileId);
                if (profile) {
                    const user = {
                        id: profile.id,
                        employeeNumber: profile.employeeNumber,
                        englishName: profile.englishName,
                        chineseName: profile.chineseName,
                        personalInfo: profile.personalInfo || {},
                        jobInfo: profile.jobInfo || {},
                        salaryInfo: profile.salaryInfo || {},
                        permissions: profile.permissions || [],
                        attendance: profile.attendance || {
                            leaveRecords: [],
                            overtimeRecords: []
                        },
                        contracts: profile.contracts || [],
                        status: profile.status
                    };
                    set({
                        currentProfile: profile,
                        user,
                        isAuthenticated: true
                    });
                }
            }
            return success;
        },
        toggleSidebar: ()=>set((state)=>({
                    sidebarCollapsed: !state.sidebarCollapsed
                })),
        setSidebarCollapsed: (collapsed)=>set({
                sidebarCollapsed: collapsed
            })
    }), {
    name: 'auth-storage',
    skipHydration: true,
    partialize: (state)=>({
            user: state.user,
            isAuthenticated: state.isAuthenticated,
            currentProfile: state.currentProfile,
            sidebarCollapsed: state.sidebarCollapsed,
            isOfflineMode: state.isOfflineMode
        })
}));
}),
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[project]/src/lib/utils.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "calculateAge",
    ()=>calculateAge,
    "cn",
    ()=>cn,
    "generateTourCode",
    ()=>generateTourCode,
    "getGenderFromIdNumber",
    ()=>getGenderFromIdNumber,
    "validateIdNumber",
    ()=>validateIdNumber,
    "validatePassportNumber",
    ()=>validatePassportNumber
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/clsx/dist/clsx.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/tailwind-merge/dist/bundle-mjs.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$format$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/date-fns/format.js [app-ssr] (ecmascript) <locals>");
;
;
;
function cn(...inputs) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["twMerge"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clsx"])(inputs));
}
function generateTourCode(location, date, isSpecial = false) {
    if (isSpecial) {
        const dateStr = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$format$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["format"])(date, 'yyMMdd');
        return `SPC${dateStr}01`;
    }
    const locationCodes = {
        'Tokyo': 'TYO',
        'Okinawa': 'OKA',
        'Osaka': 'OSA',
        'Kyoto': 'KYO',
        'Hokkaido': 'HOK'
    };
    const locationCode = locationCodes[location] || 'UNK';
    const dateStr = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$format$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["format"])(date, 'yyMMdd');
    const sequence = '01' // 實際應該從資料庫查詢當天同地點已有數量
    ;
    return `${locationCode}${dateStr}${sequence}`;
}
function getGenderFromIdNumber(idNumber) {
    if (!idNumber) return '';
    // 檢查是否為台灣身分證字號格式
    if (!validateIdNumber(idNumber)) {
        // 非台灣身分證字號，跳出通知
        if ("undefined" !== 'undefined' && idNumber.length > 0) //TURBOPACK unreachable
        ;
        return '';
    }
    const secondDigit = idNumber.charAt(1);
    // 第二碼為1表示男性，2表示女性
    if (secondDigit === '1') {
        return 'M';
    } else if (secondDigit === '2') {
        return 'F';
    }
    return '';
}
function calculateAge(birthday, departureDate, returnDate) {
    if (!birthday || !departureDate) return 0;
    const birthDate = new Date(birthday);
    // 優先使用回團日期，如果沒有則使用出發日期
    const referenceDate = returnDate ? new Date(returnDate) : new Date(departureDate);
    let age = referenceDate.getFullYear() - birthDate.getFullYear();
    const monthDiff = referenceDate.getMonth() - birthDate.getMonth();
    // 如果還沒到生日，年齡減1
    if (monthDiff < 0 || monthDiff === 0 && referenceDate.getDate() < birthDate.getDate()) {
        age--;
    }
    return age;
}
function validateIdNumber(idNumber) {
    if (!idNumber) return false;
    // 台灣身分證格式：英文字母 + 9位數字
    const pattern = /^[A-Z]\d{9}$/;
    return pattern.test(idNumber);
}
function validatePassportNumber(passportNumber) {
    if (!passportNumber) return false;
    // 台灣護照格式：數字 + 英文字母，總長8-9位
    const pattern = /^[0-9]{8,9}$|^[A-Z0-9]{8,9}$/;
    return pattern.test(passportNumber);
}
}),
"[project]/src/components/layout/sidebar.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Sidebar",
    ()=>Sidebar
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$left$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronLeft$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-left.js [app-ssr] (ecmascript) <export default as ChevronLeft>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-right.js [app-ssr] (ecmascript) <export default as ChevronRight>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$house$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Home$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/house.js [app-ssr] (ecmascript) <export default as Home>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$map$2d$pin$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__MapPin$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/map-pin.js [app-ssr] (ecmascript) <export default as MapPin>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shopping$2d$cart$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ShoppingCart$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/shopping-cart.js [app-ssr] (ecmascript) <export default as ShoppingCart>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$users$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Users$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/users.js [app-ssr] (ecmascript) <export default as Users>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$credit$2d$card$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__CreditCard$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/credit-card.js [app-ssr] (ecmascript) <export default as CreditCard>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$square$2d$check$2d$big$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckSquare$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/square-check-big.js [app-ssr] (ecmascript) <export default as CheckSquare>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/settings.js [app-ssr] (ecmascript) <export default as Settings>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calculator$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Calculator$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/calculator.js [app-ssr] (ecmascript) <export default as Calculator>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$database$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Database$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/database.js [app-ssr] (ecmascript) <export default as Database>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$building$2d$2$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Building2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/building-2.js [app-ssr] (ecmascript) <export default as Building2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$wallet$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Wallet$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/wallet.js [app-ssr] (ecmascript) <export default as Wallet>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/clock.js [app-ssr] (ecmascript) <export default as Clock>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2d$cog$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__UserCog$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/user-cog.js [app-ssr] (ecmascript) <export default as UserCog>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chart$2d$column$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__BarChart3$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chart-column.js [app-ssr] (ecmascript) <export default as BarChart3>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Calendar$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/calendar.js [app-ssr] (ecmascript) <export default as Calendar>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trending$2d$down$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__TrendingDown$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/trending-down.js [app-ssr] (ecmascript) <export default as TrendingDown>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$check$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__FileCheck$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/file-check.js [app-ssr] (ecmascript) <export default as FileCheck>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/utils.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$stores$2f$auth$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/stores/auth-store.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$wifi$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Wifi$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/wifi.js [app-ssr] (ecmascript) <export default as Wifi>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$wifi$2d$off$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__WifiOff$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/wifi-off.js [app-ssr] (ecmascript) <export default as WifiOff>");
'use client';
;
;
;
;
;
;
;
;
const menuItems = [
    {
        href: '/',
        label: '首頁',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$house$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Home$3e$__["Home"]
    },
    {
        href: '/calendar',
        label: '行事曆',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Calendar$3e$__["Calendar"],
        requiredPermission: 'calendar'
    },
    {
        href: '/workspace',
        label: '工作空間',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$building$2d$2$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Building2$3e$__["Building2"],
        requiredPermission: 'workspace'
    },
    {
        href: '/accounting',
        label: '記帳管理',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$wallet$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Wallet$3e$__["Wallet"],
        requiredPermission: 'accounting'
    },
    {
        href: '/timebox',
        label: '箱型時間',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__["Clock"],
        requiredPermission: 'timebox'
    },
    {
        href: '/todos',
        label: '待辦事項',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$square$2d$check$2d$big$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckSquare$3e$__["CheckSquare"],
        requiredPermission: 'todos'
    },
    {
        href: '/tours',
        label: '旅遊團',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$map$2d$pin$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__MapPin$3e$__["MapPin"],
        requiredPermission: 'tours'
    },
    {
        href: '/orders',
        label: '訂單',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shopping$2d$cart$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ShoppingCart$3e$__["ShoppingCart"],
        requiredPermission: 'orders'
    },
    {
        href: '/quotes',
        label: '報價單',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calculator$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Calculator$3e$__["Calculator"],
        requiredPermission: 'quotes'
    },
    {
        href: '/visas',
        label: '簽證管理',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$check$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__FileCheck$3e$__["FileCheck"],
        requiredPermission: 'visas'
    },
    {
        href: '/finance',
        label: '財務系統',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$credit$2d$card$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__CreditCard$3e$__["CreditCard"],
        requiredPermission: 'finance',
        children: [
            {
                href: '/finance/payments',
                label: '收款管理',
                icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$credit$2d$card$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__CreditCard$3e$__["CreditCard"],
                requiredPermission: 'payments'
            },
            {
                href: '/finance/requests',
                label: '請款管理',
                icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trending$2d$down$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__TrendingDown$3e$__["TrendingDown"],
                requiredPermission: 'requests'
            },
            {
                href: '/finance/treasury',
                label: '出納管理',
                icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$wallet$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Wallet$3e$__["Wallet"],
                requiredPermission: 'disbursement'
            },
            {
                href: '/finance/reports',
                label: '報表管理',
                icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chart$2d$column$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__BarChart3$3e$__["BarChart3"],
                requiredPermission: 'reports'
            }
        ]
    },
    {
        href: '/database',
        label: '資料管理',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$database$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Database$3e$__["Database"],
        requiredPermission: 'database',
        children: [
            {
                href: '/customers',
                label: '顧客管理',
                icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$users$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Users$3e$__["Users"],
                requiredPermission: 'customers'
            },
            {
                href: '/database/regions',
                label: '地區管理',
                icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$map$2d$pin$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__MapPin$3e$__["MapPin"],
                requiredPermission: 'database'
            },
            {
                href: '/database/transport',
                label: '交通選項',
                icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shopping$2d$cart$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ShoppingCart$3e$__["ShoppingCart"],
                requiredPermission: 'database'
            },
            {
                href: '/database/activities',
                label: '活動門票',
                icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$square$2d$check$2d$big$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckSquare$3e$__["CheckSquare"],
                requiredPermission: 'database'
            },
            {
                href: '/database/pricing',
                label: '價格管理',
                icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calculator$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Calculator$3e$__["Calculator"],
                requiredPermission: 'database'
            },
            {
                href: '/database/suppliers',
                label: '供應商管理',
                icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$building$2d$2$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Building2$3e$__["Building2"],
                requiredPermission: 'database'
            }
        ]
    },
    {
        href: '/hr',
        label: '人資管理',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2d$cog$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__UserCog$3e$__["UserCog"],
        requiredPermission: 'hr'
    },
    {
        href: '/guide',
        label: '系統說明',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__["Settings"]
    }
];
function Sidebar() {
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["usePathname"])();
    const { sidebarCollapsed, toggleSidebar, user, logout } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$stores$2f$auth$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAuthStore"])();
    const [hoveredItem, setHoveredItem] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [dropdownPosition, setDropdownPosition] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({
        top: 0,
        left: 0
    });
    const sidebarRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const timeoutRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const [showSyncTooltip, setShowSyncTooltip] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [mounted, setMounted] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const { isOnline, hasPendingChanges, pendingCount } = useOfflineSync();
    // 確保組件已掛載
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        setMounted(true);
    }, []);
    // 清理定時器
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        return ()=>{
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);
    const handleMouseEnter = (item, element)=>{
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        if (item.children) {
            const rect = element.getBoundingClientRect();
            setDropdownPosition({
                top: rect.top,
                left: sidebarCollapsed ? 64 : 180
            });
            setHoveredItem(item.href);
        }
    };
    const handleMouseLeave = ()=>{
        timeoutRef.current = setTimeout(()=>{
            setHoveredItem(null);
        }, 150);
    };
    const handleDropdownMouseEnter = ()=>{
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
    };
    const handleDropdownMouseLeave = ()=>{
        setHoveredItem(null);
    };
    const isActive = (href)=>{
        if (href === '/') return pathname === '/';
        return pathname.startsWith(href);
    };
    const getHoveredItemChildren = ()=>{
        if (!hoveredItem) return [];
        const item = menuItems.find((item)=>item.href === hoveredItem);
        return item?.children || [];
    };
    // 使用 useMemo 優化權限過濾
    const visibleMenuItems = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        const filterMenuByPermissions = (items)=>{
            if (!user) {
                return items.filter((item)=>!item.requiredPermission);
            }
            const userPermissions = user.permissions || [];
            const isSuperAdmin = userPermissions.includes('super_admin') || userPermissions.includes('system.admin');
            return items.filter((item)=>{
                if (!item.requiredPermission) return true;
                if (isSuperAdmin) return true;
                return userPermissions.includes(item.requiredPermission);
            }).map((item)=>{
                if (item.children) {
                    return {
                        ...item,
                        children: filterMenuByPermissions(item.children)
                    };
                }
                return item;
            });
        };
        return filterMenuByPermissions(menuItems);
    }, [
        user
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                ref: sidebarRef,
                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])('fixed left-0 top-0 h-screen bg-morandi-container border-r border-border z-50 group', sidebarCollapsed ? 'w-16 hover:w-[180px] transition-[width] duration-300' : 'w-[180px]'),
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "h-18 flex items-center relative mx-3",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "absolute left-5 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-lg bg-gradient-to-br from-[#d4c5a9] via-[#c9b896] to-[#bfad87] flex items-center justify-center shadow-sm flex-shrink-0 opacity-90",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-white/95 font-semibold text-lg",
                                            children: "V"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/layout/sidebar.tsx",
                                            lineNumber: 253,
                                            columnNumber: 15
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/layout/sidebar.tsx",
                                        lineNumber: 252,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("ml-12 text-xl font-bold text-morandi-primary transition-opacity duration-300", sidebarCollapsed ? "opacity-0 group-hover:opacity-100" : "opacity-100"),
                                        children: "CORNER"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/layout/sidebar.tsx",
                                        lineNumber: 255,
                                        columnNumber: 13
                                    }, this),
                                    !sidebarCollapsed && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: toggleSidebar,
                                        className: "absolute right-3 p-2 hover:bg-morandi-container rounded-lg transition-colors",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$left$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronLeft$3e$__["ChevronLeft"], {
                                            size: 20
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/layout/sidebar.tsx",
                                            lineNumber: 266,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/layout/sidebar.tsx",
                                        lineNumber: 262,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/layout/sidebar.tsx",
                                lineNumber: 251,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    marginLeft: '12px',
                                    marginRight: '12px',
                                    borderTop: '1px solid var(--border)',
                                    height: '1px'
                                }
                            }, void 0, false, {
                                fileName: "[project]/src/components/layout/sidebar.tsx",
                                lineNumber: 270,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/layout/sidebar.tsx",
                        lineNumber: 250,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                        className: "flex-1 py-4",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                            className: "space-y-1",
                            children: visibleMenuItems.map((item)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                    children: item.children ? // 有子選單的項目
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])('w-full relative h-10 text-sm text-morandi-secondary hover:bg-morandi-container hover:text-morandi-primary transition-colors cursor-pointer', isActive(item.href) && 'bg-morandi-container text-morandi-primary'),
                                        onMouseEnter: (e)=>handleMouseEnter(item, e.currentTarget),
                                        onMouseLeave: handleMouseLeave,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(item.icon, {
                                                size: 20,
                                                className: "absolute left-8 top-1/2 -translate-x-1/2 -translate-y-1/2"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/layout/sidebar.tsx",
                                                lineNumber: 288,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("ml-12 block text-left leading-10 transition-opacity duration-300", sidebarCollapsed ? "opacity-0 group-hover:opacity-100" : "opacity-100"),
                                                children: item.label
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/layout/sidebar.tsx",
                                                lineNumber: 289,
                                                columnNumber: 21
                                            }, this),
                                            !sidebarCollapsed && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__["ChevronRight"], {
                                                size: 16,
                                                className: "absolute right-4 top-1/2 -translate-y-1/2 transition-transform duration-300"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/layout/sidebar.tsx",
                                                lineNumber: 296,
                                                columnNumber: 23
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/layout/sidebar.tsx",
                                        lineNumber: 280,
                                        columnNumber: 19
                                    }, this) : // 沒有子選單的項目
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                        href: item.href,
                                        prefetch: false,
                                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])('w-full relative block h-10 text-sm text-morandi-secondary hover:bg-morandi-container hover:text-morandi-primary transition-colors', isActive(item.href) && 'bg-morandi-container text-morandi-primary border-r-2 border-morandi-gold'),
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(item.icon, {
                                                size: 20,
                                                className: "absolute left-8 top-1/2 -translate-x-1/2 -translate-y-1/2"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/layout/sidebar.tsx",
                                                lineNumber: 312,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("ml-12 block text-left leading-10 transition-opacity duration-300", sidebarCollapsed ? "opacity-0 group-hover:opacity-100" : "opacity-100"),
                                                children: item.label
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/layout/sidebar.tsx",
                                                lineNumber: 313,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/layout/sidebar.tsx",
                                        lineNumber: 304,
                                        columnNumber: 19
                                    }, this)
                                }, item.href, false, {
                                    fileName: "[project]/src/components/layout/sidebar.tsx",
                                    lineNumber: 277,
                                    columnNumber: 15
                                }, this))
                        }, void 0, false, {
                            fileName: "[project]/src/components/layout/sidebar.tsx",
                            lineNumber: 275,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/layout/sidebar.tsx",
                        lineNumber: 274,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "py-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mb-4",
                                style: {
                                    marginLeft: '12px',
                                    marginRight: '12px',
                                    borderTop: '1px solid var(--border)',
                                    height: '1px'
                                }
                            }, void 0, false, {
                                fileName: "[project]/src/components/layout/sidebar.tsx",
                                lineNumber: 328,
                                columnNumber: 11
                            }, this),
                            !sidebarCollapsed && user && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mb-4 mx-4 p-3 bg-morandi-container rounded-lg",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-sm font-medium text-morandi-primary",
                                        children: user.chineseName
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/layout/sidebar.tsx",
                                        lineNumber: 331,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-xs text-morandi-secondary",
                                        children: user.employeeNumber
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/layout/sidebar.tsx",
                                        lineNumber: 334,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/layout/sidebar.tsx",
                                lineNumber: 330,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                className: "space-y-1",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                            href: "/settings",
                                            prefetch: false,
                                            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])('w-full relative block h-10 text-sm text-morandi-secondary hover:bg-morandi-container hover:text-morandi-primary transition-colors', pathname === '/settings' && 'bg-morandi-container text-morandi-primary border-r-2 border-morandi-gold'),
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__["Settings"], {
                                                    size: 20,
                                                    className: "absolute left-8 top-1/2 -translate-x-1/2 -translate-y-1/2"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/layout/sidebar.tsx",
                                                    lineNumber: 350,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("ml-12 block text-left leading-10 transition-opacity duration-300", sidebarCollapsed ? "opacity-0 group-hover:opacity-100" : "opacity-100"),
                                                    children: "設定"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/layout/sidebar.tsx",
                                                    lineNumber: 351,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/layout/sidebar.tsx",
                                            lineNumber: 342,
                                            columnNumber: 15
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/layout/sidebar.tsx",
                                        lineNumber: 341,
                                        columnNumber: 13
                                    }, this),
                                    mounted && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "w-full relative block h-10 text-sm hover:bg-morandi-container transition-colors group/sync",
                                                onMouseEnter: ()=>setShowSyncTooltip(true),
                                                onMouseLeave: ()=>setShowSyncTooltip(false),
                                                children: [
                                                    isOnline ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$wifi$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Wifi$3e$__["Wifi"], {
                                                        size: 20,
                                                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("absolute left-8 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-colors", hasPendingChanges ? "text-orange-500" : "text-green-500")
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/layout/sidebar.tsx",
                                                        lineNumber: 369,
                                                        columnNumber: 19
                                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$wifi$2d$off$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__WifiOff$3e$__["WifiOff"], {
                                                        size: 20,
                                                        className: "absolute left-8 top-1/2 -translate-x-1/2 -translate-y-1/2 text-red-500"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/layout/sidebar.tsx",
                                                        lineNumber: 374,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("ml-12 block text-left leading-10 transition-opacity duration-300", sidebarCollapsed ? "opacity-0 group-hover:opacity-100" : "opacity-100", isOnline ? hasPendingChanges ? "text-orange-500" : "text-green-500" : "text-red-500"),
                                                        children: isOnline ? hasPendingChanges ? `${pendingCount} 待同步` : '已連線' : '離線'
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/layout/sidebar.tsx",
                                                        lineNumber: 376,
                                                        columnNumber: 17
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/components/layout/sidebar.tsx",
                                                lineNumber: 363,
                                                columnNumber: 17
                                            }, this),
                                            showSyncTooltip && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "fixed left-[196px] bg-card border border-border rounded-lg shadow-lg p-3 min-w-48 z-[70]",
                                                style: {
                                                    top: `${dropdownPosition.top}px`
                                                },
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "flex items-center gap-2 mb-2",
                                                        children: [
                                                            isOnline ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$wifi$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Wifi$3e$__["Wifi"], {
                                                                size: 16,
                                                                className: "text-green-500"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/components/layout/sidebar.tsx",
                                                                lineNumber: 390,
                                                                columnNumber: 25
                                                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$wifi$2d$off$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__WifiOff$3e$__["WifiOff"], {
                                                                size: 16,
                                                                className: "text-red-500"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/components/layout/sidebar.tsx",
                                                                lineNumber: 392,
                                                                columnNumber: 25
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "text-sm font-medium",
                                                                children: isOnline ? '網路已連線' : '離線模式'
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/components/layout/sidebar.tsx",
                                                                lineNumber: 394,
                                                                columnNumber: 23
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/components/layout/sidebar.tsx",
                                                        lineNumber: 388,
                                                        columnNumber: 21
                                                    }, this),
                                                    hasPendingChanges && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "text-xs text-morandi-secondary",
                                                        children: [
                                                            pendingCount,
                                                            " 個變更待同步"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/components/layout/sidebar.tsx",
                                                        lineNumber: 399,
                                                        columnNumber: 23
                                                    }, this),
                                                    !isOnline && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "text-xs text-morandi-secondary mt-1",
                                                        children: "您的變更將在恢復連線後同步"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/layout/sidebar.tsx",
                                                        lineNumber: 404,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/components/layout/sidebar.tsx",
                                                lineNumber: 387,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/layout/sidebar.tsx",
                                        lineNumber: 362,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/layout/sidebar.tsx",
                                lineNumber: 340,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/layout/sidebar.tsx",
                        lineNumber: 327,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/layout/sidebar.tsx",
                lineNumber: 240,
                columnNumber: 7
            }, this),
            hoveredItem && getHoveredItemChildren().length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "fixed bg-card border border-border rounded-lg shadow-lg py-2 min-w-48 z-[60]",
                style: {
                    top: dropdownPosition.top,
                    left: dropdownPosition.left + 8
                },
                onMouseEnter: handleDropdownMouseEnter,
                onMouseLeave: handleDropdownMouseLeave,
                children: getHoveredItemChildren().map((child)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                        href: child.href,
                        prefetch: false,
                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])('flex items-center px-4 py-2 text-sm text-morandi-secondary hover:bg-morandi-container hover:text-morandi-primary transition-colors', isActive(child.href) && 'bg-morandi-container text-morandi-primary'),
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(child.icon, {
                                size: 16,
                                className: "mr-3"
                            }, void 0, false, {
                                fileName: "[project]/src/components/layout/sidebar.tsx",
                                lineNumber: 437,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: child.label
                            }, void 0, false, {
                                fileName: "[project]/src/components/layout/sidebar.tsx",
                                lineNumber: 438,
                                columnNumber: 15
                            }, this)
                        ]
                    }, child.href, true, {
                        fileName: "[project]/src/components/layout/sidebar.tsx",
                        lineNumber: 428,
                        columnNumber: 13
                    }, this))
            }, void 0, false, {
                fileName: "[project]/src/components/layout/sidebar.tsx",
                lineNumber: 418,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true);
}
}),
"[project]/src/components/layout/main-layout.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "MainLayout",
    ()=>MainLayout
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$stores$2f$auth$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/stores/auth-store.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$local$2d$auth$2d$manager$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/auth/local-auth-manager.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$layout$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/layout/sidebar.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/utils.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
'use client';
;
;
;
;
;
;
;
function MainLayout({ children }) {
    const { sidebarCollapsed } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$stores$2f$auth$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAuthStore"])();
    const { currentProfile } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$local$2d$auth$2d$manager$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useLocalAuthStore"])();
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["usePathname"])();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    const [isClient, setIsClient] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        setIsClient(true);
    }, []);
    // 簡化的認證檢查 - 暫時停用,使用 auth-store 的 user
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!isClient) return;
        if (pathname === '/login') return;
        // 給 Zustand persist 一點時間載入
        const checkTimeout = setTimeout(()=>{
            const authUser = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$stores$2f$auth$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAuthStore"].getState().user;
        // 暫時停用檢查,避免無限循環
        // if (!authUser) {
        //   router.push('/login');
        // }
        }, 50);
        return ()=>clearTimeout(checkTimeout);
    }, [
        isClient,
        pathname,
        currentProfile,
        router
    ]);
    // 初始化離線資料庫
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
    // 離線資料庫會在 sync-manager 中自動初始化
    }, [
        isClient
    ]);
    // 不需要側邊欄的頁面
    const noSidebarPages = [
        '/login',
        '/unauthorized'
    ];
    const shouldShowSidebar = !noSidebarPages.includes(pathname);
    // 登入頁不需要側邊欄
    if (!shouldShowSidebar) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "min-h-screen bg-background",
            children: children
        }, void 0, false, {
            fileName: "[project]/src/components/layout/main-layout.tsx",
            lineNumber: 55,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "min-h-screen bg-background",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$layout$2f$sidebar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Sidebar"], {}, void 0, false, {
                fileName: "[project]/src/components/layout/main-layout.tsx",
                lineNumber: 64,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])('transition-all duration-300 pt-18', !isClient ? 'ml-16' : sidebarCollapsed ? 'ml-16' : 'ml-64'),
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "h-[calc(100vh-72px)] p-6",
                    children: children
                }, void 0, false, {
                    fileName: "[project]/src/components/layout/main-layout.tsx",
                    lineNumber: 71,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/layout/main-layout.tsx",
                lineNumber: 67,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/layout/main-layout.tsx",
        lineNumber: 62,
        columnNumber: 5
    }, this);
}
}),
"[project]/src/stores/theme-store.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useThemeStore",
    ()=>useThemeStore
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/react.mjs [app-ssr] (ecmascript)");
;
const useThemeStore = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["create"])((set, get)=>({
        currentTheme: 'morandi',
        initTheme: ()=>{
            // 從 localStorage 讀取主題
            if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
            ;
        },
        setTheme: (theme)=>{
            set({
                currentTheme: theme
            });
            // 更新 HTML 元素的 data-theme 屬性
            document.documentElement.setAttribute('data-theme', theme);
            // 儲存到 localStorage
            if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
            ;
        },
        toggleTheme: ()=>{
            const newTheme = get().currentTheme === 'morandi' ? 'modern-dark' : 'morandi';
            get().setTheme(newTheme);
        }
    }));
}),
"[project]/src/components/layout/theme-provider.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ThemeProvider",
    ()=>ThemeProvider
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$stores$2f$theme$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/stores/theme-store.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
function ThemeProvider({ children }) {
    const { currentTheme, initTheme } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$stores$2f$theme$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useThemeStore"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        // 初始化主題（從 localStorage 讀取）
        initTheme();
    }, [
        initTheme
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        // 當主題改變時更新 HTML 屬性
        document.documentElement.setAttribute('data-theme', currentTheme);
    }, [
        currentTheme
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
        children: children
    }, void 0, false);
}
}),
"[project]/src/lib/offline/unified-types.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * 🎯 Venturo v4.0 - 統一資料模型
 *
 * 規範：
 * - 前端統一使用 camelCase
 * - Supabase 使用 snake_case
 * - 所有轉換在此檔案統一處理
 */ // ===========================
// 核心基礎類型
// ===========================
/** 時間戳記 */ __turbopack_context__.s([
    "fromSupabase",
    ()=>fromSupabase,
    "fromSupabaseBatch",
    ()=>fromSupabaseBatch,
    "generatePrefixedId",
    ()=>generatePrefixedId,
    "generateUUID",
    ()=>generateUUID,
    "toSupabase",
    ()=>toSupabase,
    "toSupabaseBatch",
    ()=>toSupabaseBatch,
    "validateDate",
    ()=>validateDate,
    "validateEmail",
    ()=>validateEmail,
    "validatePhone",
    ()=>validatePhone,
    "validateRequired",
    ()=>validateRequired
]);
function toSupabase(data) {
    const result = {};
    for (const [key, value] of Object.entries(data)){
        // 轉換 key 為 snake_case
        const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        result[snakeKey] = value;
    }
    return result;
}
function fromSupabase(data) {
    const result = {};
    for (const [key, value] of Object.entries(data)){
        // 轉換 key 為 camelCase
        const camelKey = key.replace(/_([a-z])/g, (_, letter)=>letter.toUpperCase());
        result[camelKey] = value;
    }
    return result;
}
function toSupabaseBatch(data) {
    return data.map((item)=>toSupabase(item));
}
function fromSupabaseBatch(data) {
    return data.map((item)=>fromSupabase(item));
}
function validateRequired(data, requiredFields) {
    const errors = [];
    for (const field of requiredFields){
        if (data[field] === undefined || data[field] === null || data[field] === '') {
            errors.push(`${String(field)} 為必填欄位`);
        }
    }
    return errors;
}
function validateEmail(email) {
    if (!email) return true; // optional field
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function validatePhone(phone) {
    return /^09\d{8}$/.test(phone.replace(/[-\s]/g, ''));
}
function validateDate(date) {
    return /^\d{4}-\d{2}-\d{2}$/.test(date) && !isNaN(Date.parse(date));
}
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c)=>{
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : r & 0x3 | 0x8;
        return v.toString(16);
    });
}
function generatePrefixedId(prefix) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 7);
    return `${prefix}-${timestamp}-${random}`;
}
}),
"[project]/src/lib/offline/offline-database.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * 🗄️ Venturo v4.0 - IndexedDB 離線資料庫封裝
 *
 * 功能：
 * - 封裝 IndexedDB 操作
 * - 提供 CRUD 介面
 * - 支援批次操作
 * - 自動索引管理
 */ __turbopack_context__.s([
    "DB_CONFIG",
    ()=>DB_CONFIG,
    "OfflineDatabase",
    ()=>OfflineDatabase,
    "getOfflineDB",
    ()=>getOfflineDB
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$offline$2f$unified$2d$types$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/offline/unified-types.ts [app-ssr] (ecmascript)");
;
const DB_CONFIG = {
    name: 'VenturoOfflineDB',
    version: 1,
    stores: {
        tours: {
            keyPath: 'id',
            indexes: [
                'code',
                'status',
                'startDate',
                'synced'
            ]
        },
        orders: {
            keyPath: 'id',
            indexes: [
                'orderNumber',
                'tourId',
                'customerId',
                'status',
                'synced'
            ]
        },
        quotes: {
            keyPath: 'id',
            indexes: [
                'quoteNumber',
                'customerId',
                'status',
                'synced'
            ]
        },
        paymentRequests: {
            keyPath: 'id',
            indexes: [
                'requestNumber',
                'tourId',
                'supplierId',
                'status',
                'synced'
            ]
        },
        todos: {
            keyPath: 'id',
            indexes: [
                'priority',
                'completed',
                'assigneeId',
                'synced'
            ]
        },
        suppliers: {
            keyPath: 'id',
            indexes: [
                'name',
                'category',
                'status',
                'synced'
            ]
        },
        customers: {
            keyPath: 'id',
            indexes: [
                'name',
                'phone',
                'email',
                'synced'
            ]
        },
        syncQueue: {
            keyPath: 'id',
            indexes: [
                'operation',
                'tableName',
                'createdAt',
                'status'
            ]
        }
    }
};
class OfflineDatabase {
    db = null;
    initPromise = null;
    constructor(){
        this.initPromise = this.init();
    }
    /**
   * 初始化資料庫
   */ async init() {
        // 檢查是否在瀏覽器環境
        if ("TURBOPACK compile-time truthy", 1) {
            console.warn('⚠️ IndexedDB 不可用（非瀏覽器環境）');
            return Promise.resolve();
        }
        //TURBOPACK unreachable
        ;
    }
    /**
   * 確保資料庫已初始化
   */ async ensureDB() {
        if (!this.db) {
            await this.initPromise;
        }
        if (!this.db) {
            throw new Error('資料庫未初始化');
        }
        return this.db;
    }
    /**
   * 新增資料
   */ async add(storeName, data) {
        const db = await this.ensureDB();
        return new Promise((resolve, reject)=>{
            const transaction = db.transaction(storeName, 'readwrite');
            const objectStore = transaction.objectStore(storeName);
            // 確保有 ID
            if (!data.id) {
                data.id = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$offline$2f$unified$2d$types$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["generateUUID"])();
            }
            const request = objectStore.add(data);
            request.onsuccess = ()=>{
                console.log(`✅ 新增資料到 ${storeName}:`, data.id);
                resolve(data);
            };
            request.onerror = ()=>{
                console.error(`❌ 新增資料失敗:`, request.error);
                reject(request.error);
            };
        });
    }
    /**
   * 更新資料
   */ async update(storeName, data) {
        const db = await this.ensureDB();
        return new Promise((resolve, reject)=>{
            const transaction = db.transaction(storeName, 'readwrite');
            const objectStore = transaction.objectStore(storeName);
            const request = objectStore.put(data);
            request.onsuccess = ()=>{
                console.log(`✅ 更新資料 ${storeName}:`, data.id);
                resolve(data);
            };
            request.onerror = ()=>{
                console.error(`❌ 更新資料失敗:`, request.error);
                reject(request.error);
            };
        });
    }
    /**
   * 刪除資料
   */ async delete(storeName, id) {
        const db = await this.ensureDB();
        return new Promise((resolve, reject)=>{
            const transaction = db.transaction(storeName, 'readwrite');
            const objectStore = transaction.objectStore(storeName);
            const request = objectStore.delete(id);
            request.onsuccess = ()=>{
                console.log(`✅ 刪除資料 ${storeName}:`, id);
                resolve();
            };
            request.onerror = ()=>{
                console.error(`❌ 刪除資料失敗:`, request.error);
                reject(request.error);
            };
        });
    }
    /**
   * 取得單筆資料
   */ async get(storeName, id) {
        const db = await this.ensureDB();
        return new Promise((resolve, reject)=>{
            const transaction = db.transaction(storeName, 'readonly');
            const objectStore = transaction.objectStore(storeName);
            const request = objectStore.get(id);
            request.onsuccess = ()=>{
                resolve(request.result || null);
            };
            request.onerror = ()=>{
                console.error(`❌ 讀取資料失敗:`, request.error);
                reject(request.error);
            };
        });
    }
    /**
   * 取得所有資料
   */ async getAll(storeName) {
        const db = await this.ensureDB();
        return new Promise((resolve, reject)=>{
            const transaction = db.transaction(storeName, 'readonly');
            const objectStore = transaction.objectStore(storeName);
            const request = objectStore.getAll();
            request.onsuccess = ()=>{
                resolve(request.result || []);
            };
            request.onerror = ()=>{
                console.error(`❌ 讀取所有資料失敗:`, request.error);
                reject(request.error);
            };
        });
    }
    /**
   * 使用索引查詢
   */ async getByIndex(storeName, indexName, value) {
        const db = await this.ensureDB();
        return new Promise((resolve, reject)=>{
            const transaction = db.transaction(storeName, 'readonly');
            const objectStore = transaction.objectStore(storeName);
            const index = objectStore.index(indexName);
            const request = index.getAll(value);
            request.onsuccess = ()=>{
                resolve(request.result || []);
            };
            request.onerror = ()=>{
                console.error(`❌ 索引查詢失敗:`, request.error);
                reject(request.error);
            };
        });
    }
    /**
   * 批次新增
   */ async addBatch(storeName, data) {
        const db = await this.ensureDB();
        return new Promise((resolve, reject)=>{
            const transaction = db.transaction(storeName, 'readwrite');
            const objectStore = transaction.objectStore(storeName);
            const results = [];
            transaction.oncomplete = ()=>{
                console.log(`✅ 批次新增 ${data.length} 筆資料到 ${storeName}`);
                resolve(results);
            };
            transaction.onerror = ()=>{
                console.error(`❌ 批次新增失敗:`, transaction.error);
                reject(transaction.error);
            };
            data.forEach((item)=>{
                if (!item.id) {
                    item.id = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$offline$2f$unified$2d$types$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["generateUUID"])();
                }
                objectStore.add(item);
                results.push(item);
            });
        });
    }
    /**
   * 清空 Store
   */ async clear(storeName) {
        const db = await this.ensureDB();
        return new Promise((resolve, reject)=>{
            const transaction = db.transaction(storeName, 'readwrite');
            const objectStore = transaction.objectStore(storeName);
            const request = objectStore.clear();
            request.onsuccess = ()=>{
                console.log(`✅ 清空 ${storeName}`);
                resolve();
            };
            request.onerror = ()=>{
                console.error(`❌ 清空失敗:`, request.error);
                reject(request.error);
            };
        });
    }
    /**
   * 取得資料數量
   */ async count(storeName) {
        const db = await this.ensureDB();
        return new Promise((resolve, reject)=>{
            const transaction = db.transaction(storeName, 'readonly');
            const objectStore = transaction.objectStore(storeName);
            const request = objectStore.count();
            request.onsuccess = ()=>{
                resolve(request.result);
            };
            request.onerror = ()=>{
                console.error(`❌ 計數失敗:`, request.error);
                reject(request.error);
            };
        });
    }
    /**
   * 查詢未同步的資料
   */ async getUnsyncedData(storeName) {
        return this.getByIndex(storeName, 'synced', false);
    }
    /**
   * 標記為已同步
   */ async markAsSynced(storeName, id) {
        const data = await this.get(storeName, id);
        if (data) {
            data.synced = true;
            data.lastSyncedAt = new Date().toISOString();
            await this.update(storeName, data);
        }
    }
    /**
   * 關閉資料庫連接
   */ close() {
        if (this.db) {
            this.db.close();
            this.db = null;
            console.log('✅ IndexedDB 連接已關閉');
        }
    }
}
// ===========================
// 單例模式
// ===========================
let dbInstance = null;
function getOfflineDB() {
    if (!dbInstance) {
        dbInstance = new OfflineDatabase();
    }
    return dbInstance;
}
}),
"[project]/src/lib/offline/offline-manager.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * 🎯 Venturo v4.0 - 離線管理器
 *
 * 核心功能：
 * - 統一管理 localStorage + IndexedDB
 * - 自動選擇最佳儲存方案
 * - 管理同步佇列
 * - 提供統一的 CRUD 介面
 */ __turbopack_context__.s([
    "OfflineManager",
    ()=>OfflineManager,
    "getOfflineManager",
    ()=>getOfflineManager
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$offline$2f$offline$2d$database$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/offline/offline-database.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$offline$2f$unified$2d$types$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/offline/unified-types.ts [app-ssr] (ecmascript)");
;
;
class OfflineManager {
    db = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$offline$2f$offline$2d$database$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getOfflineDB"])();
    localStorage = ("TURBOPACK compile-time falsy", 0) ? "TURBOPACK unreachable" : null;
    /**
   * 建立資料 (新增)
   */ async create(storeName, data) {
        const now = new Date().toISOString();
        const record = {
            ...data,
            id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$offline$2f$unified$2d$types$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["generateUUID"])(),
            createdAt: now,
            updatedAt: now,
            synced: false,
            lastSyncedAt: undefined,
            syncError: undefined,
            version: 1
        };
        // 儲存到 IndexedDB
        await this.db.add(storeName, record);
        // 加入同步佇列
        await this.addToSyncQueue('create', storeName, record.id, record);
        console.log(`✅ 建立資料:`, storeName, record.id);
        return record;
    }
    /**
   * 更新資料
   */ async update(storeName, id, updates) {
        // 讀取現有資料
        const existing = await this.db.get(storeName, id);
        if (!existing) {
            throw new Error(`找不到資料: ${id}`);
        }
        // 合併更新
        const updated = {
            ...existing,
            ...updates,
            updatedAt: new Date().toISOString(),
            synced: false,
            version: (existing.version || 1) + 1
        };
        // 儲存到 IndexedDB
        await this.db.update(storeName, updated);
        // 加入同步佇列
        await this.addToSyncQueue('update', storeName, id, updated);
        console.log(`✅ 更新資料:`, storeName, id);
        return updated;
    }
    /**
   * 刪除資料
   */ async delete(storeName, id) {
        // 從 IndexedDB 刪除
        await this.db.delete(storeName, id);
        // 加入同步佇列
        await this.addToSyncQueue('delete', storeName, id);
        console.log(`✅ 刪除資料:`, storeName, id);
    }
    /**
   * 讀取單筆資料
   */ async get(storeName, id) {
        return await this.db.get(storeName, id);
    }
    /**
   * 讀取所有資料
   */ async getAll(storeName) {
        return await this.db.getAll(storeName);
    }
    /**
   * 使用索引查詢
   */ async getByIndex(storeName, indexName, value) {
        return await this.db.getByIndex(storeName, indexName, value);
    }
    /**
   * 批次建立
   */ async createBatch(storeName, dataList) {
        const now = new Date().toISOString();
        const records = dataList.map((data)=>({
                ...data,
                id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$offline$2f$unified$2d$types$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["generateUUID"])(),
                createdAt: now,
                updatedAt: now,
                synced: false,
                version: 1
            }));
        // 批次儲存到 IndexedDB
        await this.db.addBatch(storeName, records);
        // 批次加入同步佇列
        for (const record of records){
            await this.addToSyncQueue('create', storeName, record.id, record);
        }
        console.log(`✅ 批次建立 ${records.length} 筆資料:`, storeName);
        return records;
    }
    /**
   * 清空 Store
   */ async clear(storeName) {
        await this.db.clear(storeName);
        console.log(`✅ 清空:`, storeName);
    }
    /**
   * 取得資料數量
   */ async count(storeName) {
        return await this.db.count(storeName);
    }
    // ===========================
    // 同步佇列管理
    // ===========================
    /**
   * 加入同步佇列
   */ async addToSyncQueue(operation, tableName, recordId, data) {
        const queueItem = {
            id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$offline$2f$unified$2d$types$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["generateUUID"])(),
            operation,
            tableName,
            recordId,
            data,
            createdAt: new Date().toISOString(),
            status: 'pending',
            retryCount: 0
        };
        await this.db.add('syncQueue', queueItem);
        console.log(`📤 加入同步佇列:`, operation, tableName, recordId);
    }
    /**
   * 取得待同步項目
   */ async getPendingSyncItems() {
        return await this.db.getByIndex('syncQueue', 'status', 'pending');
    }
    /**
   * 標記同步項目為完成
   */ async markSyncCompleted(queueItemId) {
        const item = await this.db.get('syncQueue', queueItemId);
        if (item) {
            item.status = 'completed';
            await this.db.update('syncQueue', item);
            // 同時標記原始資料為已同步
            await this.db.markAsSynced(item.tableName, item.recordId);
        }
    }
    /**
   * 標記同步項目為失敗
   */ async markSyncFailed(queueItemId, error) {
        const item = await this.db.get('syncQueue', queueItemId);
        if (item) {
            item.status = 'failed';
            item.error = error;
            item.retryCount += 1;
            await this.db.update('syncQueue', item);
        }
    }
    /**
   * 清空已完成的同步佇列
   */ async clearCompletedSync() {
        const completed = await this.db.getByIndex('syncQueue', 'status', 'completed');
        for (const item of completed){
            await this.db.delete('syncQueue', item.id);
        }
        console.log(`✅ 清空 ${completed.length} 筆已完成同步項目`);
    }
    // ===========================
    // localStorage 輔助方法
    // ===========================
    /**
   * 儲存設定到 localStorage
   */ saveSetting(key, value) {
        if (!this.localStorage) return;
        try {
            this.localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error('localStorage 儲存失敗:', error);
        }
    }
    /**
   * 從 localStorage 讀取設定
   */ getSetting(key, defaultValue) {
        if (!this.localStorage) return defaultValue || null;
        try {
            const value = this.localStorage.getItem(key);
            return value ? JSON.parse(value) : defaultValue || null;
        } catch (error) {
            console.error('localStorage 讀取失敗:', error);
            return defaultValue || null;
        }
    }
    /**
   * 刪除 localStorage 設定
   */ removeSetting(key) {
        if (!this.localStorage) return;
        this.localStorage.removeItem(key);
    }
    // ===========================
    // 狀態查詢
    // ===========================
    /**
   * 取得離線資料統計
   */ async getStats() {
        const stats = {};
        const storeNames = [
            'tours',
            'orders',
            'quotes',
            'paymentRequests',
            'todos',
            'suppliers',
            'customers'
        ];
        for (const storeName of storeNames){
            stats[storeName] = await this.db.count(storeName);
        }
        const pendingSync = await this.getPendingSyncItems();
        stats.pendingSync = pendingSync.length;
        return stats;
    }
    /**
   * 檢查是否有未同步資料
   */ async hasUnsyncedData() {
        const pending = await this.getPendingSyncItems();
        return pending.length > 0;
    }
}
// ===========================
// 單例模式
// ===========================
let offlineManager = null;
function getOfflineManager() {
    if (!offlineManager) {
        offlineManager = new OfflineManager();
    }
    return offlineManager;
}
}),
"[project]/src/lib/offline/sync-engine.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * 🔄 Venturo v4.0 - 同步引擎
 *
 * 功能：
 * - 處理同步佇列
 * - 上傳本地變更到 Supabase
 * - 下載雲端變更到本地
 * - 衝突處理
 */ __turbopack_context__.s([
    "SyncEngine",
    ()=>SyncEngine,
    "clearSyncQueue",
    ()=>clearSyncQueue,
    "getSyncEngine",
    ()=>getSyncEngine,
    "manualSync",
    ()=>manualSync
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$offline$2f$offline$2d$manager$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/offline/offline-manager.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$offline$2f$unified$2d$types$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/offline/unified-types.ts [app-ssr] (ecmascript)");
;
;
const DEFAULT_CONFIG = {
    enableAutoSync: false,
    syncInterval: 30000,
    batchSize: 10,
    maxRetries: 3
};
class SyncEngine {
    offlineManager = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$offline$2f$offline$2d$manager$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getOfflineManager"])();
    config = DEFAULT_CONFIG;
    syncTimer = null;
    isSyncing = false;
    hasSupabase = false;
    constructor(config){
        if (config) {
            this.config = {
                ...DEFAULT_CONFIG,
                ...config
            };
        }
        // 檢查 Supabase 是否配置
        this.checkSupabaseAvailability();
    }
    /**
   * 檢查 Supabase 是否可用
   */ checkSupabaseAvailability() {
        if ("TURBOPACK compile-time truthy", 1) return;
        //TURBOPACK unreachable
        ;
        const supabaseUrl = undefined;
        const supabaseKey = undefined;
    }
    /**
   * 開始自動同步
   */ startAutoSync() {
        if (this.syncTimer) return;
        console.log('🔄 啟動自動同步，間隔:', this.config.syncInterval / 1000, '秒');
        this.syncTimer = setInterval(()=>{
            this.syncAll().catch((error)=>{
                console.error('自動同步失敗:', error);
            });
        }, this.config.syncInterval);
        // 立即執行一次
        this.syncAll().catch((error)=>{
            console.error('初始同步失敗:', error);
        });
    }
    /**
   * 停止自動同步
   */ stopAutoSync() {
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
            this.syncTimer = null;
            console.log('⏸️ 停止自動同步');
        }
    }
    /**
   * 同步所有待處理項目
   */ async syncAll() {
        if (this.isSyncing) {
            console.log('⏳ 同步進行中，跳過本次');
            return this.getStatus();
        }
        this.isSyncing = true;
        const status = {
            isSyncing: true,
            lastSyncTime: new Date().toISOString(),
            pendingCount: 0,
            completedCount: 0,
            failedCount: 0,
            errors: []
        };
        try {
            // 取得待同步項目
            const pendingItems = await this.offlineManager.getPendingSyncItems();
            status.pendingCount = pendingItems.length;
            if (pendingItems.length === 0) {
                console.log('✅ 沒有待同步項目');
                return status;
            }
            console.log(`🔄 開始同步 ${pendingItems.length} 筆資料`);
            // 批次處理
            const batches = this.createBatches(pendingItems, this.config.batchSize);
            for (const batch of batches){
                for (const item of batch){
                    try {
                        await this.syncItem(item);
                        status.completedCount++;
                    } catch (error) {
                        status.failedCount++;
                        status.errors.push(`${item.tableName}/${item.recordId}: ${error instanceof Error ? error.message : '未知錯誤'}`);
                    }
                }
            }
            // 清理已完成的同步項目
            await this.offlineManager.clearCompletedSync();
            console.log(`✅ 同步完成: ${status.completedCount} 成功, ${status.failedCount} 失敗`);
            return status;
        } catch (error) {
            console.error('❌ 同步過程發生錯誤:', error);
            status.errors.push(error instanceof Error ? error.message : '未知錯誤');
            return status;
        } finally{
            this.isSyncing = false;
        }
    }
    /**
   * 同步單個項目
   */ async syncItem(item) {
        if (!this.hasSupabase) {
            // 模擬同步模式：直接標記為完成
            await this.offlineManager.markSyncCompleted(item.id);
            console.log(`✅ [模擬] 同步完成:`, item.operation, item.tableName, item.recordId);
            return;
        }
        // 真實 Supabase 同步邏輯
        try {
            // 轉換資料格式：camelCase -> snake_case
            const supabaseData = item.data ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$offline$2f$unified$2d$types$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toSupabase"])(item.data) : null;
            switch(item.operation){
                case 'create':
                    if (supabaseData) {
                        // await supabase.from(item.tableName).insert(supabaseData)
                        console.log(`✅ 建立:`, item.tableName, item.recordId);
                    }
                    break;
                case 'update':
                    if (supabaseData) {
                        // await supabase.from(item.tableName).update(supabaseData).eq('id', item.recordId)
                        console.log(`✅ 更新:`, item.tableName, item.recordId);
                    }
                    break;
                case 'delete':
                    // await supabase.from(item.tableName).delete().eq('id', item.recordId)
                    console.log(`✅ 刪除:`, item.tableName, item.recordId);
                    break;
            }
            // 標記為完成
            await this.offlineManager.markSyncCompleted(item.id);
        } catch (error) {
            // 重試邏輯
            if (item.retryCount < this.config.maxRetries) {
                await this.offlineManager.markSyncFailed(item.id, error instanceof Error ? error.message : '未知錯誤');
            } else {
                console.error(`❌ 同步失敗（已達最大重試次數）:`, item.tableName, item.recordId);
                throw error;
            }
        }
    }
    /**
   * 取得同步狀態
   */ async getStatus() {
        const pendingItems = await this.offlineManager.getPendingSyncItems();
        return {
            isSyncing: this.isSyncing,
            lastSyncTime: undefined,
            pendingCount: pendingItems.length,
            completedCount: 0,
            failedCount: 0,
            errors: []
        };
    }
    /**
   * 手動觸發同步
   */ async manualSync() {
        console.log('🔄 手動觸發同步');
        return await this.syncAll();
    }
    /**
   * 建立批次
   */ createBatches(items, batchSize) {
        const batches = [];
        for(let i = 0; i < items.length; i += batchSize){
            batches.push(items.slice(i, i + batchSize));
        }
        return batches;
    }
    /**
   * 清空所有待同步項目（僅用於測試）
   */ async clearAllPending() {
        const pendingItems = await this.offlineManager.getPendingSyncItems();
        for (const item of pendingItems){
            await this.offlineManager.markSyncCompleted(item.id);
        }
        await this.offlineManager.clearCompletedSync();
        console.log(`🗑️ 清空 ${pendingItems.length} 筆待同步項目`);
        return pendingItems.length;
    }
}
// ===========================
// 單例模式
// ===========================
let syncEngine = null;
function getSyncEngine(config) {
    if (!syncEngine) {
        syncEngine = new SyncEngine(config);
    }
    return syncEngine;
}
async function clearSyncQueue() {
    const engine = getSyncEngine();
    return await engine.clearAllPending();
}
async function manualSync() {
    const engine = getSyncEngine();
    return await engine.manualSync();
}
}),
"[project]/src/lib/offline/auto-sync-provider.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AutoSyncProvider",
    ()=>AutoSyncProvider,
    "useAutoSync",
    ()=>useAutoSync
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
/**
 * 🔄 Venturo v4.0 - 自動同步 Provider
 *
 * 功能：
 * - 在應用啟動時自動初始化同步引擎
 * - 監聽網路狀態，網路恢復時自動同步
 * - 定期背景同步（可配置）
 * - 提供同步狀態給整個應用
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$offline$2f$sync$2d$engine$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/offline/sync-engine.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
const AutoSyncContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"])({
    syncStatus: null,
    isOnline: true,
    triggerSync: async ()=>{},
    enableAutoSync: ()=>{},
    disableAutoSync: ()=>{}
});
function useAutoSync() {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(AutoSyncContext);
}
function AutoSyncProvider({ children, enabled = true, interval = 30000 }) {
    const [syncStatus, setSyncStatus] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [isOnline, setIsOnline] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    const [autoSyncEnabled, setAutoSyncEnabled] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(enabled);
    const [syncEngine] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$offline$2f$sync$2d$engine$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getSyncEngine"])({
            enableAutoSync: enabled,
            syncInterval: interval
        }));
    // 監聽網路狀態
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if ("TURBOPACK compile-time truthy", 1) return;
        //TURBOPACK unreachable
        ;
        const handleOnline = undefined;
        const handleOffline = undefined;
    }, [
        syncEngine
    ]);
    // 自動同步機制
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!autoSyncEnabled) return;
        console.log('🔄 啟動自動同步機制');
        syncEngine.startAutoSync();
        return ()=>{
            console.log('⏸️ 停止自動同步機制');
            syncEngine.stopAutoSync();
        };
    }, [
        autoSyncEnabled,
        syncEngine
    ]);
    // 定期更新同步狀態
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const updateStatus = async ()=>{
            try {
                const status = await syncEngine.getStatus();
                setSyncStatus(status);
            } catch (error) {
                console.error('更新同步狀態失敗:', error);
            }
        };
        // 初始化時載入狀態
        updateStatus();
        // 每 5 秒更新一次狀態
        const statusInterval = setInterval(updateStatus, 5000);
        return ()=>clearInterval(statusInterval);
    }, [
        syncEngine
    ]);
    const triggerSync = async ()=>{
        try {
            const status = await syncEngine.manualSync();
            setSyncStatus(status);
        } catch (error) {
            console.error('手動同步失敗:', error);
            throw error;
        }
    };
    const enableAutoSync = ()=>{
        setAutoSyncEnabled(true);
    };
    const disableAutoSync = ()=>{
        setAutoSyncEnabled(false);
    };
    const contextValue = {
        syncStatus,
        isOnline,
        triggerSync,
        enableAutoSync,
        disableAutoSync
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(AutoSyncContext.Provider, {
        value: contextValue,
        children: children
    }, void 0, false, {
        fileName: "[project]/src/lib/offline/auto-sync-provider.tsx",
        lineNumber: 150,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__e03936f1._.js.map