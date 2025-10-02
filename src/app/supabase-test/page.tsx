'use client';

import { useState, useEffect } from 'react';
import { supabase, testSupabaseConnection } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface User {
  id: string;
  employee_number: string;
  english_name: string;
  chinese_name: string;
  status: string;
  created_at: string;
}

export default function SupabaseTestPage() {
  const [connectionStatus, setConnectionStatus] = useState<'未測試' | '連接中' | '成功' | '失敗'>('未測試');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // 新增用戶表單
  const [newUser, setNewUser] = useState({
    employee_number: '',
    english_name: '',
    chinese_name: '',
  });

  // 測試連接
  const handleTestConnection = async () => {
    setConnectionStatus('連接中');
    setError('');

    const result = await testSupabaseConnection();

    if (result.success) {
      setConnectionStatus('成功');
    } else {
      setConnectionStatus('失敗');
      setError(result.error || '連接失敗');
    }
  };

  // 讀取用戶列表
  const fetchUsers = async () => {
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, employee_number, english_name, chinese_name, status, created_at')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      setUsers(data || []);
    } catch (err: any) {
      setError(err.message || '讀取失敗');
    } finally {
      setLoading(false);
    }
  };

  // 新增用戶
  const handleAddUser = async () => {
    if (!newUser.employee_number || !newUser.english_name || !newUser.chinese_name) {
      setError('請填寫所有欄位');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase
        .from('users')
        .insert({
          employee_number: newUser.employee_number,
          english_name: newUser.english_name,
          chinese_name: newUser.chinese_name,
          status: 'active',
          personal_info: {
            nationalId: '',
            birthday: '',
            gender: 'male',
            phone: '',
            email: '',
            address: '',
            emergencyContact: {
              name: '',
              relationship: '',
              phone: '',
            },
          },
          job_info: {
            department: '測試部門',
            position: '測試職位',
            hireDate: new Date().toISOString().split('T')[0],
            employmentType: 'fulltime',
          },
        })
        .select()
        .single();

      if (error) throw error;

      // 重新讀取列表
      await fetchUsers();

      // 清空表單
      setNewUser({
        employee_number: '',
        english_name: '',
        chinese_name: '',
      });

      alert('✅ 新增成功！');
    } catch (err: any) {
      setError(err.message || '新增失敗');
    } finally {
      setLoading(false);
    }
  };

  // 刪除用戶（軟刪除）
  const handleDeleteUser = async (id: string) => {
    if (!confirm('確定要刪除嗎？')) return;

    setLoading(true);
    setError('');

    try {
      const { error } = await supabase
        .from('users')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      // 重新讀取列表
      await fetchUsers();

      alert('✅ 刪除成功！');
    } catch (err: any) {
      setError(err.message || '刪除失敗');
    } finally {
      setLoading(false);
    }
  };

  // 頁面載入時測試連接
  useEffect(() => {
    handleTestConnection();
  }, []);

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Supabase 資料庫測試</h1>

      {/* 連接狀態 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>連接狀態</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div
                className={`w-4 h-4 rounded-full ${
                  connectionStatus === '成功'
                    ? 'bg-green-500'
                    : connectionStatus === '失敗'
                    ? 'bg-red-500'
                    : connectionStatus === '連接中'
                    ? 'bg-yellow-500 animate-pulse'
                    : 'bg-gray-300'
                }`}
              />
              <span className="font-medium">{connectionStatus}</span>
            </div>

            <Button onClick={handleTestConnection} variant="outline" size="sm">
              重新測試
            </Button>

            {connectionStatus === '成功' && (
              <Button onClick={fetchUsers} variant="outline" size="sm">
                讀取用戶列表
              </Button>
            )}
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
              ❌ {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 新增用戶 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>新增測試用戶</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="員工編號 (例: EMP001)"
              value={newUser.employee_number}
              onChange={(e) => setNewUser({ ...newUser, employee_number: e.target.value })}
            />
            <Input
              placeholder="英文名稱 (例: John Doe)"
              value={newUser.english_name}
              onChange={(e) => setNewUser({ ...newUser, english_name: e.target.value })}
            />
            <Input
              placeholder="中文名稱 (例: 王小明)"
              value={newUser.chinese_name}
              onChange={(e) => setNewUser({ ...newUser, chinese_name: e.target.value })}
            />
          </div>

          <Button onClick={handleAddUser} disabled={loading} className="mt-4">
            {loading ? '新增中...' : '新增用戶'}
          </Button>
        </CardContent>
      </Card>

      {/* 用戶列表 */}
      <Card>
        <CardHeader>
          <CardTitle>用戶列表（最近 10 筆）</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4 text-gray-500">讀取中...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-2">尚無用戶資料</p>
              <p className="text-sm">請先在 Supabase 執行 test-data.sql 或使用上方表單新增</p>
            </div>
          ) : (
            <div className="space-y-2">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="font-medium">{user.chinese_name}</div>
                    <div className="text-sm text-gray-500">
                      {user.english_name} • {user.employee_number} • {user.status}
                    </div>
                    <div className="text-xs text-gray-400">
                      建立時間: {new Date(user.created_at).toLocaleString('zh-TW')}
                    </div>
                  </div>

                  <Button
                    onClick={() => handleDeleteUser(user.id)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:bg-red-50"
                  >
                    刪除
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 說明 */}
      <Card className="mt-6 bg-blue-50">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-2">📝 使用說明</h3>
          <ol className="text-sm space-y-1 text-gray-700">
            <li>1. 確認連接狀態顯示「成功」（綠燈）</li>
            <li>2. 點擊「讀取用戶列表」查看 Supabase 中的資料</li>
            <li>3. 使用「新增測試用戶」表單新增資料到 Supabase</li>
            <li>4. 刪除操作是「軟刪除」（設定 deleted_at），不會真的刪除資料</li>
            <li>5. 如果沒有資料，請先在 Supabase SQL Editor 執行 test-data.sql</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
