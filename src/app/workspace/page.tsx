'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useRouter } from 'next/navigation';

export default function WorkspacePage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-4">🏢 工作空間</h1>

          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-lg">歡迎, <strong>{user?.chineseName || '訪客'}</strong></p>
            <p className="text-sm text-gray-600 mt-2">員工編號: {user?.employeeNumber || 'N/A'}</p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">快速功能</h2>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <button
                onClick={() => router.push('/tours')}
                className="p-4 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
              >
                <div className="text-3xl mb-2">🗺️</div>
                <div className="font-semibold">團體行程</div>
              </button>

              <button
                onClick={() => router.push('/quotes')}
                className="p-4 bg-green-100 hover:bg-green-200 rounded-lg transition-colors"
              >
                <div className="text-3xl mb-2">💰</div>
                <div className="font-semibold">報價管理</div>
              </button>

              <button
                onClick={() => router.push('/orders')}
                className="p-4 bg-purple-100 hover:bg-purple-200 rounded-lg transition-colors"
              >
                <div className="text-3xl mb-2">📋</div>
                <div className="font-semibold">訂單管理</div>
              </button>

              <button
                onClick={() => router.push('/todos')}
                className="p-4 bg-yellow-100 hover:bg-yellow-200 rounded-lg transition-colors"
              >
                <div className="text-3xl mb-2">✅</div>
                <div className="font-semibold">待辦事項</div>
              </button>

              <button
                onClick={() => router.push('/calendar')}
                className="p-4 bg-pink-100 hover:bg-pink-200 rounded-lg transition-colors"
              >
                <div className="text-3xl mb-2">📅</div>
                <div className="font-semibold">行事曆</div>
              </button>

              <button
                onClick={handleLogout}
                className="p-4 bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
              >
                <div className="text-3xl mb-2">🚪</div>
                <div className="font-semibold">登出</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}