'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

export default function ProfileManagerPage() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [authData, setAuthData] = useState<any>(null);
  const [message, setMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = () => {
    try {
      // 讀取 auth-storage
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        const data = JSON.parse(authStorage);
        setAuthData(data);

        if (data.state?.user) {
          setProfiles([{
            id: 'auth-storage',
            type: 'Auth Storage (主要角色卡)',
            user: data.state.user,
            profile: data.state.currentProfile
          }]);
        }
      }

      // 讀取 local-auth-storage
      const localAuthStorage = localStorage.getItem('local-auth-storage');
      if (localAuthStorage) {
        const localData = JSON.parse(localAuthStorage);
        if (localData.state?.profiles) {
          console.log('Local profiles:', localData.state.profiles);
        }
      }
    } catch (error) {
      console.error('讀取角色卡失敗:', error);
      setMessage('❌ 讀取角色卡失敗');
    }
  };

  const deleteProfile = async () => {
    if (!confirm('⚠️ 確定要刪除所有角色卡嗎？\n\n這將：\n- 清除所有本地登入資料\n- 登出目前使用者\n- 下次登入會從 Supabase 重新建立角色卡')) {
      return;
    }

    try {
      setMessage('正在刪除角色卡...');

      // 1. 清除所有認證相關的 localStorage
      localStorage.removeItem('auth-storage');
      localStorage.removeItem('local-auth-storage');
      localStorage.removeItem('offline-storage');

      // 清除所有包含 auth 的 key
      Object.keys(localStorage).forEach(key => {
        if (key.toLowerCase().includes('auth')) {
          localStorage.removeItem(key);
        }
      });

      // 2. 清除 IndexedDB
      try {
        await new Promise((resolve) => {
          const deleteRequest = indexedDB.deleteDatabase('venturo-local');
          deleteRequest.onsuccess = () => resolve(true);
          deleteRequest.onerror = () => resolve(false);
          deleteRequest.onblocked = () => resolve(false);
          setTimeout(() => resolve(false), 3000);
        });
      } catch (error) {
        console.warn('IndexedDB 清除失敗:', error);
      }

      // 3. 清除 cookies
      document.cookie = 'auth-token=; path=/; max-age=0; SameSite=Lax';

      setMessage('✅ 角色卡已刪除！\n\n請關閉瀏覽器後重新開啟，然後重新登入。');
      setProfiles([]);
      setAuthData(null);

      // 3 秒後跳轉到登入頁
      setTimeout(() => {
        window.location.href = '/login';
      }, 3000);

    } catch (error) {
      console.error('刪除失敗:', error);
      setMessage(`❌ 刪除失敗: ${error}`);
    }
  };

  const viewRawData = () => {
    console.log('=== 角色卡原始資料 ===');
    console.log('Auth Storage:', localStorage.getItem('auth-storage'));
    console.log('Local Auth Storage:', localStorage.getItem('local-auth-storage'));
    console.log('Offline Storage:', localStorage.getItem('offline-storage'));
    setMessage('✅ 原始資料已輸出到 Console（按 F12 查看）');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">🎭 角色卡管理</CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              查看和管理本地儲存的使用者角色卡
            </p>
          </CardHeader>
          <CardContent>
            {/* 當前角色卡資訊 */}
            {profiles.length > 0 ? (
              <div className="space-y-4">
                {profiles.map((profile, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-white">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{profile.type}</h3>
                        <p className="text-sm text-gray-500">儲存位置: {profile.id}</p>
                      </div>
                    </div>

                    {profile.user && (
                      <div className="space-y-2 bg-gray-50 p-4 rounded">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-500">員工編號</p>
                            <p className="font-medium">{profile.user.employeeNumber}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">中文名稱</p>
                            <p className="font-medium">{profile.user.chineseName}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">英文名稱</p>
                            <p className="font-medium">{profile.user.englishName}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">狀態</p>
                            <p className="font-medium">{profile.user.status}</p>
                          </div>
                        </div>

                        <div className="mt-4">
                          <p className="text-xs text-gray-500 mb-2">權限列表</p>
                          <div className="flex flex-wrap gap-2">
                            {profile.user.permissions && profile.user.permissions.length > 0 ? (
                              profile.user.permissions.map((perm: string, idx: number) => (
                                <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                  {perm}
                                </span>
                              ))
                            ) : (
                              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                                ⚠️ 沒有權限（這就是問題！）
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="mb-2">📭 沒有找到角色卡</p>
                <p className="text-sm">請先登入系統</p>
              </div>
            )}

            {/* 操作按鈕 */}
            <div className="flex gap-3 mt-6">
              <Button
                onClick={loadProfiles}
                variant="outline"
                className="flex-1"
              >
                🔄 重新載入
              </Button>
              <Button
                onClick={viewRawData}
                variant="outline"
                className="flex-1"
              >
                👁️ 查看原始資料
              </Button>
              <Button
                onClick={deleteProfile}
                variant="destructive"
                className="flex-1"
                disabled={profiles.length === 0}
              >
                🗑️ 刪除角色卡
              </Button>
            </div>

            {/* 訊息顯示 */}
            {message && (
              <div className={`mt-4 p-4 rounded-lg whitespace-pre-line ${
                message.includes('✅')
                  ? 'bg-green-50 text-green-800'
                  : message.includes('❌')
                  ? 'bg-red-50 text-red-800'
                  : 'bg-blue-50 text-blue-800'
              }`}>
                {message}
              </div>
            )}

            {/* 說明 */}
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-2">📖 使用說明</h4>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• <strong>重新載入</strong>：重新讀取本地角色卡資料</li>
                <li>• <strong>查看原始資料</strong>：在 Console 顯示完整的 JSON 資料</li>
                <li>• <strong>刪除角色卡</strong>：清除所有本地資料，下次登入會從 Supabase 重建</li>
              </ul>
            </div>

            {/* 返回按鈕 */}
            <Button
              onClick={() => router.push('/')}
              variant="outline"
              className="w-full mt-4"
            >
              返回首頁
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
