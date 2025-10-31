'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth-store';
import { useTodoStore } from '@/stores';
import { localDB } from '@/lib/db';

export default function DebugTodosPage() {
  const { user } = useAuthStore();
  const todoStore = useTodoStore();
  const [supabaseTodos, setSupabaseTodos] = useState<any[]>([]);
  const [indexedDBTodos, setIndexedDBTodos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      // 1. 從 Supabase 直接查詢
      try {
        const { data, error } = await supabase
          .from('todos')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setSupabaseTodos(data || []);
      } catch (err) {
        console.error('Supabase 查詢失敗:', err);
      }

      // 2. 從 IndexedDB 查詢
      try {
        const cached = await localDB.getAll('todos');
        setIndexedDBTodos(cached || []);
      } catch (err) {
        console.error('IndexedDB 查詢失敗:', err);
      }

      setLoading(false);
    };

    loadData();
  }, []);

  if (loading) {
    return <div className="p-8">載入中...</div>;
  }

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold">Todos 診斷頁面</h1>

      {/* 當前用戶資訊 */}
      <section className="border rounded-lg p-4">
        <h2 className="text-xl font-semibold mb-2">當前登入用戶</h2>
        <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
          {JSON.stringify(user, null, 2)}
        </pre>
        <p className="mt-2 text-sm">
          <strong>User ID:</strong> {user?.id || '未登入'}
        </p>
      </section>

      {/* Zustand Store */}
      <section className="border rounded-lg p-4">
        <h2 className="text-xl font-semibold mb-2">
          Zustand Store Todos ({todoStore.items.length} 筆)
        </h2>
        <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-64">
          {JSON.stringify(todoStore.items, null, 2)}
        </pre>
      </section>

      {/* Supabase 資料 */}
      <section className="border rounded-lg p-4">
        <h2 className="text-xl font-semibold mb-2">
          Supabase Todos ({supabaseTodos.length} 筆)
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-2 py-1 text-left">Title</th>
                <th className="px-2 py-1 text-left">Creator</th>
                <th className="px-2 py-1 text-left">Assignee</th>
                <th className="px-2 py-1 text-left">Visibility</th>
                <th className="px-2 py-1 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {supabaseTodos.map((todo) => (
                <tr key={todo.id} className="border-b">
                  <td className="px-2 py-1">{todo.title}</td>
                  <td className="px-2 py-1">{todo.creator}</td>
                  <td className="px-2 py-1">{todo.assignee || '-'}</td>
                  <td className="px-2 py-1">
                    {JSON.stringify(todo.visibility)}
                  </td>
                  <td className="px-2 py-1">{todo.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* IndexedDB 資料 */}
      <section className="border rounded-lg p-4">
        <h2 className="text-xl font-semibold mb-2">
          IndexedDB Todos ({indexedDBTodos.length} 筆)
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-2 py-1 text-left">Title</th>
                <th className="px-2 py-1 text-left">Creator</th>
                <th className="px-2 py-1 text-left">Assignee</th>
                <th className="px-2 py-1 text-left">Visibility</th>
                <th className="px-2 py-1 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {indexedDBTodos.map((todo) => (
                <tr key={todo.id} className="border-b">
                  <td className="px-2 py-1">{todo.title}</td>
                  <td className="px-2 py-1">{todo.creator}</td>
                  <td className="px-2 py-1">{todo.assignee || '-'}</td>
                  <td className="px-2 py-1">
                    {JSON.stringify(todo.visibility)}
                  </td>
                  <td className="px-2 py-1">{todo.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 過濾邏輯測試 */}
      <section className="border rounded-lg p-4 bg-yellow-50">
        <h2 className="text-xl font-semibold mb-2">過濾邏輯測試</h2>
        <p className="text-sm mb-2">
          當前用戶 ID: <code>{user?.id}</code>
        </p>
        <div className="space-y-2">
          {supabaseTodos.map((todo) => {
            const isCreator = todo.creator === user?.id;
            const isAssignee = todo.assignee === user?.id;
            const inVisibility = todo.visibility?.includes(user?.id);
            const shouldShow = isCreator || isAssignee || inVisibility;

            return (
              <div
                key={todo.id}
                className={`p-2 rounded ${shouldShow ? 'bg-green-100' : 'bg-red-100'}`}
              >
                <p className="font-medium">{todo.title}</p>
                <p className="text-xs">
                  Creator: {isCreator ? '✅' : '❌'} |
                  Assignee: {isAssignee ? '✅' : '❌'} |
                  Visibility: {inVisibility ? '✅' : '❌'} →
                  <strong>{shouldShow ? '顯示' : '隱藏'}</strong>
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
