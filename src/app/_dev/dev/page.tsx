'use client';

import { Button } from '@/components/ui/button';
import { initLocalDatabase, clearAllData } from '@/lib/db/init-local-data';
import { DB_NAME } from '@/lib/db/schemas';

export default function DevPage() {
  const handleInitDB = async () => {
    localStorage.removeItem(`${DB_NAME}-initialized`);
    await initLocalDatabase();
    alert('資料庫已初始化');
    location.reload();
  };

  const handleClearDB = async () => {
    if (confirm('確定要清空所有資料嗎？')) {
      await clearAllData();
      localStorage.removeItem(`${DB_NAME}-initialized`);
      alert('資料已清空');
      location.reload();
    }
  };

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">開發工具</h1>

      <div className="space-y-2">
        <Button onClick={handleInitDB} className="w-full">
          初始化資料庫（建立預設資料）
        </Button>

        <Button onClick={handleClearDB} variant="destructive" className="w-full">
          清空所有資料
        </Button>
      </div>

      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h2 className="font-bold mb-2">預設帳號：</h2>
        <ul className="space-y-1">
          <li>管理員：william01 / Venturo2025!</li>
        </ul>
        <p className="mt-2 text-sm text-gray-600">
          💡 其他帳號請從人資管理介面新增
        </p>
      </div>
    </div>
  );
}
