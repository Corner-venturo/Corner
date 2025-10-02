'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function EmergencyFixPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const fixWilliamPermissions = async () => {
    setLoading(true);
    setMessage('');

    try {
      // 給 William 所有權限
      const allPermissions = [
        'super_admin', 'admin', 'calendar', 'workspace', 'todos', 'timebox',
        'quotes', 'tours', 'orders', 'customers', 'accounting', 'payments',
        'requests', 'disbursement', 'finance', 'hr', 'database', 'settings', 'reports'
      ];

      const { data, error } = await supabase
        .from('users')
        .update({ permissions: allPermissions })
        .or('english_name.eq.william,chinese_name.ilike.%william%')
        .select();

      if (error) {
        setMessage(`❌ 錯誤: ${error.message}`);
        console.error(error);
      } else {
        setMessage(`✅ 成功！已更新 ${data?.length || 0} 位員工的權限。請重新登入。`);
        console.log('更新結果:', data);
      }
    } catch (error) {
      setMessage(`❌ 發生錯誤: ${error}`);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-red-600 mb-4">🚨 緊急權限修復</h1>
        <p className="text-gray-600 mb-6">
          這個頁面用於緊急修復 William 的系統權限。
        </p>

        <Button
          onClick={fixWilliamPermissions}
          disabled={loading}
          className="w-full bg-red-600 hover:bg-red-700 text-white mb-4"
        >
          {loading ? '修復中...' : '🔧 修復 William 權限'}
        </Button>

        {message && (
          <div className={`p-4 rounded-lg ${message.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {message}
          </div>
        )}

        {message.includes('✅') && (
          <Button
            onClick={() => {
              // 清除本地存儲並重新登入
              localStorage.clear();
              router.push('/login');
            }}
            className="w-full mt-4"
          >
            前往登入頁面
          </Button>
        )}
      </div>
    </div>
  );
}
