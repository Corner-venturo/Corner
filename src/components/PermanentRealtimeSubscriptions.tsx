/**
 * 永久 Realtime 訂閱組件
 *
 * 這些表格需要在整個應用程式生命週期中保持訂閱：
 * - user_roles: 使用者權限（管理員變更權限時立即生效）
 * - workspaces: 工作空間設定
 * - employees: 員工資料（常用於下拉選單）
 *
 * ⚠️ 注意：只有在使用者已登入時才訂閱
 */

'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useEmployeeStore } from '@/stores';
import { realtimeManager } from '@/lib/realtime/realtime-manager';
import { logger } from '@/lib/utils/logger';
import { useToast } from '@/components/ui/use-toast';

// TODO: 定義 UserRole 型別
interface UserRole {
  id: string;
  user_id: string;
  role: string;
  permissions: string[];
  updated_at: string;
}

// TODO: 定義 Workspace 型別
interface Workspace {
  id: string;
  name: string;
  owner_id: string;
  updated_at: string;
}

export function PermanentRealtimeSubscriptions() {
  const user = useAuthStore((state) => state.user);
  const employeeStore = useEmployeeStore();
  const { toast } = useToast();

  useEffect(() => {
    // 只有在使用者已登入時才訂閱
    if (!user) {
      logger.log('⏭️ [PermanentRealtimeSubscriptions] 使用者未登入，跳過訂閱');
      return;
    }

    logger.log('🔔 [PermanentRealtimeSubscriptions] 開始永久訂閱...');

    // 1. 訂閱使用者權限（永久）
    const userRoleSubscriptionId = `user-role-${user.id}`;
    realtimeManager.subscribe<UserRole>({
      table: 'user_roles',
      filter: `user_id=eq.${user.id}`,
      subscriptionId: userRoleSubscriptionId,
      handlers: {
        onUpdate: (newRole) => {
          logger.log('🔔 [user_roles] 權限已更新:', newRole);

          // 通知使用者
          toast({
            title: '你的權限已更新！',
            description: '請重新整理頁面以套用新權限。',
          });

          // 2 秒後自動重新整理
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        },
        onInsert: (newRole) => {
          logger.log('🔔 [user_roles] 新增權限:', newRole);
          toast({
            title: '你已獲得新的權限！',
          });
        },
        onDelete: (oldRole) => {
          logger.log('🔔 [user_roles] 權限已移除:', oldRole);
          toast({
            title: '你的部分權限已被移除',
            variant: 'destructive',
          });
        },
      },
    });

    // 2. 訂閱工作空間（永久）
    const workspaceSubscriptionId = 'workspaces-permanent';
    realtimeManager.subscribe<Workspace>({
      table: 'workspaces',
      subscriptionId: workspaceSubscriptionId,
      handlers: {
        onUpdate: (workspace) => {
          logger.log('🔔 [workspaces] 工作空間已更新:', workspace.name);
          toast({
            title: '工作空間已更新',
            description: `工作空間「${workspace.name}」已更新`,
          });
        },
        onInsert: (workspace) => {
          logger.log('🔔 [workspaces] 新增工作空間:', workspace.name);
          toast({
            title: '新增工作空間',
            description: `工作空間「${workspace.name}」`,
          });
        },
        onDelete: (workspace) => {
          logger.log('🔔 [workspaces] 刪除工作空間:', workspace.name);
          toast({
            title: '工作空間已刪除',
            description: `工作空間「${workspace.name}」已刪除`,
            variant: 'destructive',
          });
        },
      },
    });

    // 3. 訂閱員工資料（永久）- 常用於下拉選單
    const employeeSubscriptionId = 'employees-permanent';
    realtimeManager.subscribe({
      table: 'employees',
      subscriptionId: employeeSubscriptionId,
      handlers: {
        onInsert: async (employee) => {
          logger.log('🔔 [employees] 新增員工:', employee);

          // 更新 IndexedDB
          const { IndexedDBAdapter } = await import('@/stores/adapters/indexeddb-adapter');
          const indexedDB = new IndexedDBAdapter('employees');
          await indexedDB.put(employee);

          // 更新 Zustand 狀態
          employeeStore.setState((state) => {
            const exists = state.items.some((item) => item.id === employee.id);
            if (exists) return state;
            return {
              items: [...state.items, employee],
            };
          });
        },
        onUpdate: async (employee) => {
          logger.log('🔔 [employees] 更新員工:', employee);

          const { IndexedDBAdapter } = await import('@/stores/adapters/indexeddb-adapter');
          const indexedDB = new IndexedDBAdapter('employees');
          await indexedDB.put(employee);

          employeeStore.setState((state) => ({
            items: state.items.map((item) =>
              item.id === employee.id ? employee : item
            ),
          }));
        },
        onDelete: async (employee) => {
          logger.log('🔔 [employees] 刪除員工:', employee);

          const { IndexedDBAdapter } = await import('@/stores/adapters/indexeddb-adapter');
          const indexedDB = new IndexedDBAdapter('employees');
          await indexedDB.delete(employee.id);

          employeeStore.setState((state) => ({
            items: state.items.filter((item) => item.id !== employee.id),
          }));
        },
      },
    });

    logger.log('✅ [PermanentRealtimeSubscriptions] 永久訂閱完成');

    // 清理：登出時取消訂閱
    return () => {
      logger.log('🔕 [PermanentRealtimeSubscriptions] 取消永久訂閱');
      realtimeManager.unsubscribe(userRoleSubscriptionId);
      realtimeManager.unsubscribe(workspaceSubscriptionId);
      realtimeManager.unsubscribe(employeeSubscriptionId);
    };
    // ✅ 只依賴 user，不要依賴 employeeStore（它每次都會改變）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // 這是一個純邏輯組件，不渲染任何 UI
  return null;
}
