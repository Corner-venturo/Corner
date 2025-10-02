(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/lib/auth.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
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
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jsonwebtoken$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/jsonwebtoken/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/bcryptjs/index.js [app-client] (ecmascript)");
;
;
const JWT_SECRET = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.JWT_SECRET || 'venturo_app_jwt_secret_key_change_in_production_2024';
function generateToken(payload) {
    try {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jsonwebtoken$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].sign(payload, JWT_SECRET, {
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
        const decoded = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jsonwebtoken$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].verify(token, JWT_SECRET);
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
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].hash(password, saltRounds);
}
async function verifyPassword(password, hashedPassword) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].compare(password, hashedPassword);
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
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/auth/local-auth-manager.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PasswordEncryption",
    ()=>PasswordEncryption,
    "useLocalAuthStore",
    ()=>useLocalAuthStore
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@swc/helpers/esm/_define_property.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/react.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/middleware.mjs [app-client] (ecmascript)");
;
;
;
const useLocalAuthStore = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["create"])()((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["persist"])((set, get)=>({
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
            set((state)=>{
                var _state_currentProfile;
                return {
                    profiles: state.profiles.filter((p)=>p.id !== profileId),
                    currentProfile: ((_state_currentProfile = state.currentProfile) === null || _state_currentProfile === void 0 ? void 0 : _state_currentProfile.id) === profileId ? null : state.currentProfile
                };
            });
        },
        updateProfile: (profileId, updates)=>{
            set((state)=>{
                var _state_currentProfile;
                return {
                    profiles: state.profiles.map((p)=>p.id === profileId ? {
                            ...p,
                            ...updates
                        } : p),
                    currentProfile: ((_state_currentProfile = state.currentProfile) === null || _state_currentProfile === void 0 ? void 0 : _state_currentProfile.id) === profileId ? {
                        ...state.currentProfile,
                        ...updates
                    } : state.currentProfile
                };
            });
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
                lastSelectedProfileId: (profile === null || profile === void 0 ? void 0 : profile.id) || null
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
                const bcrypt = (await __turbopack_context__.A("[project]/node_modules/bcryptjs/index.js [app-client] (ecmascript, async loader)")).default;
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
        const bcrypt = (await __turbopack_context__.A("[project]/node_modules/bcryptjs/index.js [app-client] (ecmascript, async loader)")).default;
        return bcrypt.hash(pin, 10);
    }
}
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(PasswordEncryption, "ENCRYPTION_KEY", 'venturo-offline-auth-2024');
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/offline/sync-manager.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
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
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@swc/helpers/esm/_define_property.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/react.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/middleware.mjs [app-client] (ecmascript)");
// ⚠️ 暫時註解以測試編譯問題
// import { supabase } from '@/lib/supabase/client';
// import { VenturoAPI } from '@/lib/supabase/api';
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$v4$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/v4.js [app-client] (ecmascript) <export default as v4>");
;
var _s = __turbopack_context__.k.signature();
;
;
;
const useOfflineStore = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["create"])()((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["persist"])((set)=>({
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
    async init() {
        // 檢查是否在瀏覽器環境
        if ("object" === 'undefined' || !window.indexedDB) {
            console.warn('IndexedDB not available (server-side)');
            return Promise.resolve();
        }
        return new Promise((resolve, reject)=>{
            const request = indexedDB.open(this.dbName, this.version);
            request.onerror = ()=>reject(request.error);
            request.onsuccess = ()=>{
                this.db = request.result;
                resolve();
            };
            request.onupgradeneeded = (event)=>{
                const db = event.target.result;
                // 建立各個資料表的 Object Store
                const tables = [
                    'tours',
                    'orders',
                    'customers',
                    'payments',
                    'members',
                    'users',
                    'todos',
                    'quotes',
                    'visas'
                ];
                tables.forEach((table)=>{
                    if (!db.objectStoreNames.contains(table)) {
                        const store = db.createObjectStore(table, {
                            keyPath: 'id'
                        });
                        store.createIndex('sync_status', 'sync_status', {
                            unique: false
                        });
                        store.createIndex('updated_at', 'updated_at', {
                            unique: false
                        });
                    }
                });
                // 建立同步元資料表
                if (!db.objectStoreNames.contains('sync_metadata')) {
                    db.createObjectStore('sync_metadata', {
                        keyPath: 'table'
                    });
                }
            };
        });
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
    constructor(){
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "dbName", 'venturo-local');
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "version", 2); // 升級版本以加入 visas 表格
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "db", null);
    }
}
class SyncManager {
    async init() {
        await this.localDb.init();
        // 監聽網路狀態變化
        if ("TURBOPACK compile-time truthy", 1) {
            window.addEventListener('online', ()=>this.handleOnline());
            window.addEventListener('offline', ()=>this.handleOffline());
        }
    // 不啟動定期同步，只在有變更時同步
    // this.startPeriodicSync();
    }
    startPeriodicSync() {
        this.syncInterval = setInterval(()=>{
            if (useOfflineStore.getState().isOnline && !this.isSyncing) {
                this.syncPendingChanges();
            }
        }, 5000); // 改為 5 秒，更即時的同步
    }
    // ============= 樂觀更新 =============
    async optimisticCreate(table, data) {
        const tempId = "temp_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9));
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
            id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$v4$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])(),
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
            id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$v4$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])(),
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
            id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$v4$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])(),
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
        console.log("📦 本地模式：跳過同步操作 ".concat(operation.type, " ").concat(operation.table));
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
            console.log("✅ 已同步 ".concat(table, ":"), {
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
            return "ORDER-".concat(new Date().getFullYear(), "-0001");
        }
        // 解析編號並遞增
        const match = data.orderNumber.match(/ORDER-(\d{4})-(\d{4})/);
        if (match) {
            const year = new Date().getFullYear();
            const lastNumber = parseInt(match[2]);
            const newNumber = (lastNumber + 1).toString().padStart(4, '0');
            return "ORDER-".concat(year, "-").concat(newNumber);
        }
        return "ORDER-".concat(new Date().getFullYear(), "-0001");
    }
    async getNextTourCode() {
        const { data, error } = await supabase.from('tours').select('code').order('created_at', {
            ascending: false
        }).limit(1).single();
        if (error || !data) {
            return "TOUR-".concat(new Date().getFullYear(), "-0001");
        }
        const match = data.code.match(/TOUR-(\d{4})-(\d{4})/);
        if (match) {
            const year = new Date().getFullYear();
            const lastNumber = parseInt(match[2]);
            const newNumber = (lastNumber + 1).toString().padStart(4, '0');
            return "TOUR-".concat(year, "-").concat(newNumber);
        }
        return "TOUR-".concat(new Date().getFullYear(), "-0001");
    }
    async getNextQuoteNumber() {
        const { data, error } = await supabase.from('quotes').select('quoteNumber').order('created_at', {
            ascending: false
        }).limit(1).single();
        if (error || !data) {
            return "QUOTE-".concat(new Date().getFullYear(), "-0001");
        }
        const match = data.quoteNumber.match(/QUOTE-(\d{4})-(\d{4})/);
        if (match) {
            const year = new Date().getFullYear();
            const lastNumber = parseInt(match[2]);
            const newNumber = (lastNumber + 1).toString().padStart(4, '0');
            return "QUOTE-".concat(year, "-").concat(newNumber);
        }
        return "QUOTE-".concat(new Date().getFullYear(), "-0001");
    }
    // ============= 衝突處理 =============
    async handleConflict(operation, error) {
        console.warn('偵測到同步衝突:', operation);
        const conflict = {
            id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$v4$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])(),
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
        console.log("⏳ 同步 ".concat(pendingChanges.length, " 個待處理變更..."));
        // 去除重複的操作（相同 table + id）
        const uniqueOperations = pendingChanges.reduce((acc, op)=>{
            var _op_data;
            const key = "".concat(op.table, "-").concat(((_op_data = op.data) === null || _op_data === void 0 ? void 0 : _op_data.id) || op.localId);
            if (!acc.has(key)) {
                acc.set(key, op);
            }
            return acc;
        }, new Map());
        console.log("✓ 去除重複後：".concat(uniqueOperations.size, " 個待處理變更"));
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
    constructor(){
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "localDb", void 0);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "syncQueue", []);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "isSyncing", false);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "syncInterval", null);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "handleOnline", async ()=>{
            console.log('🟢 網路已連接，開始同步...');
            useOfflineStore.getState().setOnline(true);
            await this.syncAll();
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "handleOffline", ()=>{
            console.log('🔴 網路已斷開，切換到離線模式');
            useOfflineStore.getState().setOnline(false);
        });
        this.localDb = new LocalDatabase();
        // 只在瀏覽器環境初始化
        if ("TURBOPACK compile-time truthy", 1) {
            this.init();
        }
    }
}
function useOfflineSync() {
    _s();
    const { isOnline, pendingChanges, lastSyncTime } = useOfflineStore();
    return {
        isOnline,
        hasPendingChanges: pendingChanges.length > 0,
        pendingCount: pendingChanges.length,
        lastSyncTime,
        syncStatus: !isOnline ? 'offline' : pendingChanges.length > 0 ? 'pending' : 'synced'
    };
}
_s(useOfflineSync, "o4c9C2SyRJrmSuPWWJfBQVog+bw=", false, function() {
    return [
        useOfflineStore
    ];
});
// 單例模式 - 懶加載，只在瀏覽器環境創建
let syncManagerInstance = null;
function getSyncManager() {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    if (!syncManagerInstance) {
        syncManagerInstance = new SyncManager();
    }
    return syncManagerInstance;
}
const syncManager = ("TURBOPACK compile-time truthy", 1) ? getSyncManager() : "TURBOPACK unreachable";
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/services/offline-auth.service.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "OfflineAuthService",
    ()=>OfflineAuthService
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$local$2d$auth$2d$manager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/auth/local-auth-manager.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$offline$2f$sync$2d$manager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/offline/sync-manager.ts [app-client] (ecmascript)");
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
                encryptedPassword = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$local$2d$auth$2d$manager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PasswordEncryption"].encrypt(password);
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
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$local$2d$auth$2d$manager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useLocalAuthStore"].getState().addProfile(profile);
                console.log('Profile 已加入');
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$local$2d$auth$2d$manager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useLocalAuthStore"].getState().setCurrentProfile(profile);
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
   */ static async offlineLogin(profileId, credential) {
        let usePin = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : true;
        try {
            const profile = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$local$2d$auth$2d$manager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useLocalAuthStore"].getState().getProfileById(profileId);
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
                isValid = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$local$2d$auth$2d$manager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useLocalAuthStore"].getState().verifyPin(profileId, credential);
            } else {
                // 使用密碼驗證（離線）
                if (!profile.cachedPassword) {
                    return {
                        success: false,
                        message: '此帳號無法使用離線登入'
                    };
                }
                const decryptedPassword = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$local$2d$auth$2d$manager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PasswordEncryption"].decrypt(profile.cachedPassword);
                isValid = credential === decryptedPassword;
            }
            if (!isValid) {
                return {
                    success: false,
                    message: usePin ? 'PIN 碼錯誤' : '密碼錯誤'
                };
            }
            // 設定為當前登入
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$local$2d$auth$2d$manager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useLocalAuthStore"].getState().setCurrentProfile(profile);
            console.log('✅ 離線登入成功');
            // 背景嘗試刷新 Supabase session
            if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$offline$2f$sync$2d$manager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useOfflineStore"].getState().isOnline && profile.cachedPassword) {
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
            const pinHash = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$local$2d$auth$2d$manager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PasswordEncryption"].hashPin(pin);
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$local$2d$auth$2d$manager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useLocalAuthStore"].getState().setPinForProfile(profileId, pinHash);
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
            const profile = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$local$2d$auth$2d$manager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useLocalAuthStore"].getState().getProfileById(profileId);
            if (!profile) {
                console.error('找不到 Profile:', profileId);
                return false;
            }
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$local$2d$auth$2d$manager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useLocalAuthStore"].getState().setCurrentProfile(profile);
            console.log('✅ 已切換到:', profile.chineseName);
            // 背景刷新 session
            if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$offline$2f$sync$2d$manager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useOfflineStore"].getState().isOnline && profile.cachedPassword) {
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
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$local$2d$auth$2d$manager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useLocalAuthStore"].getState().setCurrentProfile(null);
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
        if (permissions === null || permissions === void 0 ? void 0 : permissions.includes('super_admin')) return 'SUPER_ADMIN';
        if (permissions === null || permissions === void 0 ? void 0 : permissions.includes('admin')) return 'ADMIN';
        return 'EMPLOYEE';
    }
    /**
   * 同步本地 Profile 與遠端
   */ static async syncProfile(profileId) {
        try {
            const isOnline = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$offline$2f$sync$2d$manager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useOfflineStore"].getState().isOnline;
            if (!isOnline) {
                console.log('離線狀態，無法同步');
                return false;
            }
            const profile = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$local$2d$auth$2d$manager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useLocalAuthStore"].getState().getProfileById(profileId);
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
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$local$2d$auth$2d$manager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useLocalAuthStore"].getState().updateProfile(profileId, {
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
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/stores/auth-store.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useAuthStore",
    ()=>useAuthStore
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/react.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/middleware.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/auth.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$local$2d$auth$2d$manager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/auth/local-auth-manager.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$offline$2d$auth$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/offline-auth.service.ts [app-client] (ecmascript)");
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
            message: "登入失敗次數過多，請 ".concat(remainingTime, " 分鐘後再試")
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
function setSecureCookie(token) {
    let rememberMe = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : false;
    const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 8 * 60 * 60; // 30天 or 8小時
    const secure = window.location.protocol === 'https:' ? 'Secure; ' : '';
    // 在 localhost 開發環境中，不使用 Secure 和 SameSite=Strict
    if (window.location.hostname === 'localhost') {
        document.cookie = "auth-token=".concat(token, "; path=/; max-age=").concat(maxAge, "; SameSite=Lax");
    } else {
        document.cookie = "auth-token=".concat(token, "; path=/; max-age=").concat(maxAge, "; SameSite=Strict; ").concat(secure);
    }
}
const useAuthStore = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["create"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["persist"])((set, get)=>({
        user: null,
        isAuthenticated: false,
        sidebarCollapsed: true,
        loginAttempts: new Map(),
        currentProfile: null,
        isOfflineMode: false,
        login: (user)=>{
            // 同時更新 user 和 currentProfile
            const profile = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$local$2d$auth$2d$manager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useLocalAuthStore"].getState().currentProfile;
            set({
                user,
                isAuthenticated: true,
                currentProfile: profile
            });
        },
        logout: ()=>{
            // 使用離線認證服務登出
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$offline$2d$auth$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["OfflineAuthService"].logout();
            // 安全清除認證 cookie
            if ("TURBOPACK compile-time truthy", 1) {
                if (window.location.hostname === 'localhost') {
                    document.cookie = 'auth-token=; path=/; max-age=0; SameSite=Lax';
                } else {
                    document.cookie = 'auth-token=; path=/; max-age=0; SameSite=Strict; Secure';
                }
            }
            set({
                user: null,
                isAuthenticated: false,
                currentProfile: null
            });
        },
        validateLogin: async (username, password)=>{
            try {
                // 使用離線認證服務進行初次登入
                const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$offline$2d$auth$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["OfflineAuthService"].initialLogin(username, password);
                if (result.success && result.profile) {
                    var _result_profile_permissions, _result_profile_permissions1;
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
                        role: ((_result_profile_permissions = result.profile.permissions) === null || _result_profile_permissions === void 0 ? void 0 : _result_profile_permissions.includes('super_admin')) ? 'super_admin' : ((_result_profile_permissions1 = result.profile.permissions) === null || _result_profile_permissions1 === void 0 ? void 0 : _result_profile_permissions1.includes('admin')) ? 'admin' : 'employee'
                    };
                    const token = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["generateToken"])(authPayload);
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
            const success = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$offline$2d$auth$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["OfflineAuthService"].switchProfile(profileId);
            if (success) {
                const profile = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$local$2d$auth$2d$manager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useLocalAuthStore"].getState().getProfileById(profileId);
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
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/utils.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
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
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/clsx/dist/clsx.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/tailwind-merge/dist/bundle-mjs.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$format$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/date-fns/format.js [app-client] (ecmascript) <locals>");
;
;
;
function cn() {
    for(var _len = arguments.length, inputs = new Array(_len), _key = 0; _key < _len; _key++){
        inputs[_key] = arguments[_key];
    }
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["twMerge"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clsx"])(inputs));
}
function generateTourCode(location, date) {
    let isSpecial = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : false;
    if (isSpecial) {
        const dateStr = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$format$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["format"])(date, 'yyMMdd');
        return "SPC".concat(dateStr, "01");
    }
    const locationCodes = {
        'Tokyo': 'TYO',
        'Okinawa': 'OKA',
        'Osaka': 'OSA',
        'Kyoto': 'KYO',
        'Hokkaido': 'HOK'
    };
    const locationCode = locationCodes[location] || 'UNK';
    const dateStr = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$format$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["format"])(date, 'yyMMdd');
    const sequence = '01' // 實際應該從資料庫查詢當天同地點已有數量
    ;
    return "".concat(locationCode).concat(dateStr).concat(sequence);
}
function getGenderFromIdNumber(idNumber) {
    if (!idNumber) return '';
    // 檢查是否為台灣身分證字號格式
    if (!validateIdNumber(idNumber)) {
        // 非台灣身分證字號，跳出通知
        if ("object" !== 'undefined' && idNumber.length > 0) {
            alert('此身分證字號格式不符合台灣身分證系統，請手動輸入性別');
        }
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
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/layout/sidebar.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Sidebar",
    ()=>Sidebar
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$left$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronLeft$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-left.js [app-client] (ecmascript) <export default as ChevronLeft>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-right.js [app-client] (ecmascript) <export default as ChevronRight>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$house$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Home$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/house.js [app-client] (ecmascript) <export default as Home>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$map$2d$pin$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MapPin$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/map-pin.js [app-client] (ecmascript) <export default as MapPin>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shopping$2d$cart$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ShoppingCart$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/shopping-cart.js [app-client] (ecmascript) <export default as ShoppingCart>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$users$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Users$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/users.js [app-client] (ecmascript) <export default as Users>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$credit$2d$card$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CreditCard$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/credit-card.js [app-client] (ecmascript) <export default as CreditCard>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$square$2d$check$2d$big$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckSquare$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/square-check-big.js [app-client] (ecmascript) <export default as CheckSquare>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/settings.js [app-client] (ecmascript) <export default as Settings>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calculator$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Calculator$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/calculator.js [app-client] (ecmascript) <export default as Calculator>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$database$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Database$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/database.js [app-client] (ecmascript) <export default as Database>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$building$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Building2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/building-2.js [app-client] (ecmascript) <export default as Building2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$wallet$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Wallet$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/wallet.js [app-client] (ecmascript) <export default as Wallet>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/clock.js [app-client] (ecmascript) <export default as Clock>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2d$cog$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__UserCog$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/user-cog.js [app-client] (ecmascript) <export default as UserCog>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chart$2d$column$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__BarChart3$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chart-column.js [app-client] (ecmascript) <export default as BarChart3>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Calendar$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/calendar.js [app-client] (ecmascript) <export default as Calendar>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trending$2d$down$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__TrendingDown$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/trending-down.js [app-client] (ecmascript) <export default as TrendingDown>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__FileCheck$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/file-check.js [app-client] (ecmascript) <export default as FileCheck>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/utils.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$stores$2f$auth$2d$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/stores/auth-store.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$offline$2f$sync$2d$manager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/offline/sync-manager.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$wifi$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Wifi$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/wifi.js [app-client] (ecmascript) <export default as Wifi>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$wifi$2d$off$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__WifiOff$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/wifi-off.js [app-client] (ecmascript) <export default as WifiOff>");
;
var _s = __turbopack_context__.k.signature();
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
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$house$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Home$3e$__["Home"]
    },
    {
        href: '/calendar',
        label: '行事曆',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Calendar$3e$__["Calendar"],
        requiredPermission: 'calendar'
    },
    {
        href: '/workspace',
        label: '工作空間',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$building$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Building2$3e$__["Building2"],
        requiredPermission: 'workspace'
    },
    {
        href: '/accounting',
        label: '記帳管理',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$wallet$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Wallet$3e$__["Wallet"],
        requiredPermission: 'accounting'
    },
    {
        href: '/timebox',
        label: '箱型時間',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__["Clock"],
        requiredPermission: 'timebox'
    },
    {
        href: '/todos',
        label: '待辦事項',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$square$2d$check$2d$big$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckSquare$3e$__["CheckSquare"],
        requiredPermission: 'todos'
    },
    {
        href: '/tours',
        label: '旅遊團',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$map$2d$pin$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MapPin$3e$__["MapPin"],
        requiredPermission: 'tours'
    },
    {
        href: '/orders',
        label: '訂單',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shopping$2d$cart$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ShoppingCart$3e$__["ShoppingCart"],
        requiredPermission: 'orders'
    },
    {
        href: '/quotes',
        label: '報價單',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calculator$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Calculator$3e$__["Calculator"],
        requiredPermission: 'quotes'
    },
    {
        href: '/visas',
        label: '簽證管理',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__FileCheck$3e$__["FileCheck"],
        requiredPermission: 'visas'
    },
    {
        href: '/finance',
        label: '財務系統',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$credit$2d$card$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CreditCard$3e$__["CreditCard"],
        requiredPermission: 'finance',
        children: [
            {
                href: '/finance/payments',
                label: '收款管理',
                icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$credit$2d$card$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CreditCard$3e$__["CreditCard"],
                requiredPermission: 'payments'
            },
            {
                href: '/finance/requests',
                label: '請款管理',
                icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trending$2d$down$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__TrendingDown$3e$__["TrendingDown"],
                requiredPermission: 'requests'
            },
            {
                href: '/finance/treasury',
                label: '出納管理',
                icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$wallet$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Wallet$3e$__["Wallet"],
                requiredPermission: 'disbursement'
            },
            {
                href: '/finance/reports',
                label: '報表管理',
                icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chart$2d$column$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__BarChart3$3e$__["BarChart3"],
                requiredPermission: 'reports'
            }
        ]
    },
    {
        href: '/database',
        label: '資料管理',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$database$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Database$3e$__["Database"],
        requiredPermission: 'database',
        children: [
            {
                href: '/customers',
                label: '顧客管理',
                icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$users$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Users$3e$__["Users"],
                requiredPermission: 'customers'
            },
            {
                href: '/database/regions',
                label: '地區管理',
                icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$map$2d$pin$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MapPin$3e$__["MapPin"],
                requiredPermission: 'database'
            },
            {
                href: '/database/transport',
                label: '交通選項',
                icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shopping$2d$cart$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ShoppingCart$3e$__["ShoppingCart"],
                requiredPermission: 'database'
            },
            {
                href: '/database/activities',
                label: '活動門票',
                icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$square$2d$check$2d$big$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckSquare$3e$__["CheckSquare"],
                requiredPermission: 'database'
            },
            {
                href: '/database/pricing',
                label: '價格管理',
                icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calculator$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Calculator$3e$__["Calculator"],
                requiredPermission: 'database'
            },
            {
                href: '/database/suppliers',
                label: '供應商管理',
                icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$building$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Building2$3e$__["Building2"],
                requiredPermission: 'database'
            }
        ]
    },
    {
        href: '/hr',
        label: '人資管理',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2d$cog$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__UserCog$3e$__["UserCog"],
        requiredPermission: 'hr'
    },
    {
        href: '/guide',
        label: '系統說明',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__["Settings"]
    }
];
function Sidebar() {
    _s();
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"])();
    const { sidebarCollapsed, toggleSidebar, user, logout } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$stores$2f$auth$2d$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuthStore"])();
    const [hoveredItem, setHoveredItem] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [dropdownPosition, setDropdownPosition] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        top: 0,
        left: 0
    });
    const sidebarRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const timeoutRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const [showSyncTooltip, setShowSyncTooltip] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [mounted, setMounted] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const { isOnline, hasPendingChanges, pendingCount } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$offline$2f$sync$2d$manager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useOfflineSync"])();
    // 確保組件已掛載
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Sidebar.useEffect": ()=>{
            setMounted(true);
        }
    }["Sidebar.useEffect"], []);
    // 清理定時器
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Sidebar.useEffect": ()=>{
            return ({
                "Sidebar.useEffect": ()=>{
                    if (timeoutRef.current) {
                        clearTimeout(timeoutRef.current);
                    }
                }
            })["Sidebar.useEffect"];
        }
    }["Sidebar.useEffect"], []);
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
        return (item === null || item === void 0 ? void 0 : item.children) || [];
    };
    // 使用 useMemo 優化權限過濾
    const visibleMenuItems = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "Sidebar.useMemo[visibleMenuItems]": ()=>{
            const filterMenuByPermissions = {
                "Sidebar.useMemo[visibleMenuItems].filterMenuByPermissions": (items)=>{
                    if (!user) {
                        return items.filter({
                            "Sidebar.useMemo[visibleMenuItems].filterMenuByPermissions": (item)=>!item.requiredPermission
                        }["Sidebar.useMemo[visibleMenuItems].filterMenuByPermissions"]);
                    }
                    const userPermissions = user.permissions || [];
                    const isSuperAdmin = userPermissions.includes('super_admin') || userPermissions.includes('system.admin');
                    return items.filter({
                        "Sidebar.useMemo[visibleMenuItems].filterMenuByPermissions": (item)=>{
                            if (!item.requiredPermission) return true;
                            if (isSuperAdmin) return true;
                            return userPermissions.includes(item.requiredPermission);
                        }
                    }["Sidebar.useMemo[visibleMenuItems].filterMenuByPermissions"]).map({
                        "Sidebar.useMemo[visibleMenuItems].filterMenuByPermissions": (item)=>{
                            if (item.children) {
                                return {
                                    ...item,
                                    children: filterMenuByPermissions(item.children)
                                };
                            }
                            return item;
                        }
                    }["Sidebar.useMemo[visibleMenuItems].filterMenuByPermissions"]);
                }
            }["Sidebar.useMemo[visibleMenuItems].filterMenuByPermissions"];
            return filterMenuByPermissions(menuItems);
        }
    }["Sidebar.useMemo[visibleMenuItems]"], [
        user
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                ref: sidebarRef,
                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('fixed left-0 top-0 h-screen bg-morandi-container border-r border-border z-50 group', sidebarCollapsed ? 'w-16 hover:w-[180px] transition-[width] duration-300' : 'w-[180px]'),
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "h-18 flex items-center relative mx-3",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "absolute left-5 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-lg bg-gradient-to-br from-[#d4c5a9] via-[#c9b896] to-[#bfad87] flex items-center justify-center shadow-sm flex-shrink-0 opacity-90",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("ml-12 text-xl font-bold text-morandi-primary transition-opacity duration-300", sidebarCollapsed ? "opacity-0 group-hover:opacity-100" : "opacity-100"),
                                        children: "CORNER"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/layout/sidebar.tsx",
                                        lineNumber: 255,
                                        columnNumber: 13
                                    }, this),
                                    !sidebarCollapsed && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: toggleSidebar,
                                        className: "absolute right-3 p-2 hover:bg-morandi-container rounded-lg transition-colors",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$left$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronLeft$3e$__["ChevronLeft"], {
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
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                        className: "flex-1 py-4",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                            className: "space-y-1",
                            children: visibleMenuItems.map((item)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                    children: item.children ? // 有子選單的項目
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('w-full relative h-10 text-sm text-morandi-secondary hover:bg-morandi-container hover:text-morandi-primary transition-colors cursor-pointer', isActive(item.href) && 'bg-morandi-container text-morandi-primary'),
                                        onMouseEnter: (e)=>handleMouseEnter(item, e.currentTarget),
                                        onMouseLeave: handleMouseLeave,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(item.icon, {
                                                size: 20,
                                                className: "absolute left-8 top-1/2 -translate-x-1/2 -translate-y-1/2"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/layout/sidebar.tsx",
                                                lineNumber: 288,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("ml-12 block text-left leading-10 transition-opacity duration-300", sidebarCollapsed ? "opacity-0 group-hover:opacity-100" : "opacity-100"),
                                                children: item.label
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/layout/sidebar.tsx",
                                                lineNumber: 289,
                                                columnNumber: 21
                                            }, this),
                                            !sidebarCollapsed && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__["ChevronRight"], {
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
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                        href: item.href,
                                        prefetch: false,
                                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('w-full relative block h-10 text-sm text-morandi-secondary hover:bg-morandi-container hover:text-morandi-primary transition-colors', isActive(item.href) && 'bg-morandi-container text-morandi-primary border-r-2 border-morandi-gold'),
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(item.icon, {
                                                size: 20,
                                                className: "absolute left-8 top-1/2 -translate-x-1/2 -translate-y-1/2"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/layout/sidebar.tsx",
                                                lineNumber: 312,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("ml-12 block text-left leading-10 transition-opacity duration-300", sidebarCollapsed ? "opacity-0 group-hover:opacity-100" : "opacity-100"),
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
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "py-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
                            !sidebarCollapsed && user && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mb-4 mx-4 p-3 bg-morandi-container rounded-lg",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-sm font-medium text-morandi-primary",
                                        children: user.chineseName
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/layout/sidebar.tsx",
                                        lineNumber: 331,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                className: "space-y-1",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                            href: "/settings",
                                            prefetch: false,
                                            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('w-full relative block h-10 text-sm text-morandi-secondary hover:bg-morandi-container hover:text-morandi-primary transition-colors', pathname === '/settings' && 'bg-morandi-container text-morandi-primary border-r-2 border-morandi-gold'),
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__["Settings"], {
                                                    size: 20,
                                                    className: "absolute left-8 top-1/2 -translate-x-1/2 -translate-y-1/2"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/layout/sidebar.tsx",
                                                    lineNumber: 350,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("ml-12 block text-left leading-10 transition-opacity duration-300", sidebarCollapsed ? "opacity-0 group-hover:opacity-100" : "opacity-100"),
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
                                    mounted && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "w-full relative block h-10 text-sm hover:bg-morandi-container transition-colors group/sync",
                                                onMouseEnter: ()=>setShowSyncTooltip(true),
                                                onMouseLeave: ()=>setShowSyncTooltip(false),
                                                children: [
                                                    isOnline ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$wifi$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Wifi$3e$__["Wifi"], {
                                                        size: 20,
                                                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("absolute left-8 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-colors", hasPendingChanges ? "text-orange-500" : "text-green-500")
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/layout/sidebar.tsx",
                                                        lineNumber: 369,
                                                        columnNumber: 19
                                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$wifi$2d$off$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__WifiOff$3e$__["WifiOff"], {
                                                        size: 20,
                                                        className: "absolute left-8 top-1/2 -translate-x-1/2 -translate-y-1/2 text-red-500"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/layout/sidebar.tsx",
                                                        lineNumber: 374,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("ml-12 block text-left leading-10 transition-opacity duration-300", sidebarCollapsed ? "opacity-0 group-hover:opacity-100" : "opacity-100", isOnline ? hasPendingChanges ? "text-orange-500" : "text-green-500" : "text-red-500"),
                                                        children: isOnline ? hasPendingChanges ? "".concat(pendingCount, " 待同步") : '已連線' : '離線'
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
                                            showSyncTooltip && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "fixed left-[196px] bg-card border border-border rounded-lg shadow-lg p-3 min-w-48 z-[70]",
                                                style: {
                                                    top: "".concat(dropdownPosition.top, "px")
                                                },
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "flex items-center gap-2 mb-2",
                                                        children: [
                                                            isOnline ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$wifi$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Wifi$3e$__["Wifi"], {
                                                                size: 16,
                                                                className: "text-green-500"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/components/layout/sidebar.tsx",
                                                                lineNumber: 390,
                                                                columnNumber: 25
                                                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$wifi$2d$off$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__WifiOff$3e$__["WifiOff"], {
                                                                size: 16,
                                                                className: "text-red-500"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/components/layout/sidebar.tsx",
                                                                lineNumber: 392,
                                                                columnNumber: 25
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
                                                    hasPendingChanges && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
                                                    !isOnline && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
            hoveredItem && getHoveredItemChildren().length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "fixed bg-card border border-border rounded-lg shadow-lg py-2 min-w-48 z-[60]",
                style: {
                    top: dropdownPosition.top,
                    left: dropdownPosition.left + 8
                },
                onMouseEnter: handleDropdownMouseEnter,
                onMouseLeave: handleDropdownMouseLeave,
                children: getHoveredItemChildren().map((child)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                        href: child.href,
                        prefetch: false,
                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('flex items-center px-4 py-2 text-sm text-morandi-secondary hover:bg-morandi-container hover:text-morandi-primary transition-colors', isActive(child.href) && 'bg-morandi-container text-morandi-primary'),
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(child.icon, {
                                size: 16,
                                className: "mr-3"
                            }, void 0, false, {
                                fileName: "[project]/src/components/layout/sidebar.tsx",
                                lineNumber: 437,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
_s(Sidebar, "ByPtYKB4nQkcVP1bRwC9Z0Oy2YM=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$stores$2f$auth$2d$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuthStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$offline$2f$sync$2d$manager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useOfflineSync"]
    ];
});
_c = Sidebar;
var _c;
__turbopack_context__.k.register(_c, "Sidebar");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/layout/main-layout.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "MainLayout",
    ()=>MainLayout
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$stores$2f$auth$2d$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/stores/auth-store.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$local$2d$auth$2d$manager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/auth/local-auth-manager.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$layout$2f$sidebar$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/layout/sidebar.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/utils.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
;
;
function MainLayout(param) {
    let { children } = param;
    _s();
    const { sidebarCollapsed } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$stores$2f$auth$2d$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuthStore"])();
    const { currentProfile } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$local$2d$auth$2d$manager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useLocalAuthStore"])();
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"])();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const [isClient, setIsClient] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "MainLayout.useEffect": ()=>{
            setIsClient(true);
        }
    }["MainLayout.useEffect"], []);
    // 簡化的認證檢查 - 暫時停用,使用 auth-store 的 user
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "MainLayout.useEffect": ()=>{
            if (!isClient) return;
            if (pathname === '/login') return;
            // 給 Zustand persist 一點時間載入
            const checkTimeout = setTimeout({
                "MainLayout.useEffect.checkTimeout": ()=>{
                    const authUser = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$stores$2f$auth$2d$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuthStore"].getState().user;
                // 暫時停用檢查,避免無限循環
                // if (!authUser) {
                //   router.push('/login');
                // }
                }
            }["MainLayout.useEffect.checkTimeout"], 50);
            return ({
                "MainLayout.useEffect": ()=>clearTimeout(checkTimeout)
            })["MainLayout.useEffect"];
        }
    }["MainLayout.useEffect"], [
        isClient,
        pathname,
        currentProfile,
        router
    ]);
    // 初始化離線資料庫
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "MainLayout.useEffect": ()=>{
        // 離線資料庫會在 sync-manager 中自動初始化
        }
    }["MainLayout.useEffect"], [
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
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "min-h-screen bg-background",
            children: children
        }, void 0, false, {
            fileName: "[project]/src/components/layout/main-layout.tsx",
            lineNumber: 55,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "min-h-screen bg-background",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$layout$2f$sidebar$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Sidebar"], {}, void 0, false, {
                fileName: "[project]/src/components/layout/main-layout.tsx",
                lineNumber: 64,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('transition-all duration-300 pt-18', !isClient ? 'ml-16' : sidebarCollapsed ? 'ml-16' : 'ml-64'),
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
_s(MainLayout, "dbtK1ocgK3WcTMn0GHMSjzwDhnY=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$stores$2f$auth$2d$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuthStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$local$2d$auth$2d$manager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useLocalAuthStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"]
    ];
});
_c = MainLayout;
var _c;
__turbopack_context__.k.register(_c, "MainLayout");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/stores/theme-store.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useThemeStore",
    ()=>useThemeStore
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/react.mjs [app-client] (ecmascript)");
;
const useThemeStore = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["create"])((set, get)=>({
        currentTheme: 'morandi',
        initTheme: ()=>{
            // 從 localStorage 讀取主題
            if ("TURBOPACK compile-time truthy", 1) {
                const savedTheme = localStorage.getItem('venturo-theme');
                if (savedTheme && [
                    'morandi',
                    'modern-dark'
                ].includes(savedTheme)) {
                    set({
                        currentTheme: savedTheme
                    });
                    document.documentElement.setAttribute('data-theme', savedTheme);
                }
            }
        },
        setTheme: (theme)=>{
            set({
                currentTheme: theme
            });
            // 更新 HTML 元素的 data-theme 屬性
            document.documentElement.setAttribute('data-theme', theme);
            // 儲存到 localStorage
            if ("TURBOPACK compile-time truthy", 1) {
                localStorage.setItem('venturo-theme', theme);
            }
        },
        toggleTheme: ()=>{
            const newTheme = get().currentTheme === 'morandi' ? 'modern-dark' : 'morandi';
            get().setTheme(newTheme);
        }
    }));
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/layout/theme-provider.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ThemeProvider",
    ()=>ThemeProvider
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$stores$2f$theme$2d$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/stores/theme-store.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
function ThemeProvider(param) {
    let { children } = param;
    _s();
    const { currentTheme, initTheme } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$stores$2f$theme$2d$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useThemeStore"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ThemeProvider.useEffect": ()=>{
            // 初始化主題（從 localStorage 讀取）
            initTheme();
        }
    }["ThemeProvider.useEffect"], [
        initTheme
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ThemeProvider.useEffect": ()=>{
            // 當主題改變時更新 HTML 屬性
            document.documentElement.setAttribute('data-theme', currentTheme);
        }
    }["ThemeProvider.useEffect"], [
        currentTheme
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: children
    }, void 0, false);
}
_s(ThemeProvider, "WqtRFSjpkTToftv80a8oHzAbxh0=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$stores$2f$theme$2d$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useThemeStore"]
    ];
});
_c = ThemeProvider;
var _c;
__turbopack_context__.k.register(_c, "ThemeProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_dbb4667f._.js.map