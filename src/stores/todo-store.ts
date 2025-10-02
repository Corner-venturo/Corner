import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Todo } from './types';
import { createPersistentCrudMethods } from '@/lib/persistent-store';
import { v4 as uuidv4 } from 'uuid';

interface TodoState {
  todos: Todo[];

  // CRUD 方法（使用統一的 helper）
  addTodo: (todo: Omit<Todo, 'id' | 'createdAt' | 'updatedAt' | 'creator' | 'visibility'>) => Promise<Todo>;
  updateTodo: (id: string, todo: Partial<Todo>) => Promise<Todo | undefined>;
  deleteTodo: (id: string) => Promise<boolean>;
  toggleTodo: (id: string) => Promise<void>;
  loadTodos: (userId?: string) => Promise<Todo[] | null>;
  clearAllTodos: () => void;
}

export const useTodoStore = create<TodoState>()(
  persist(
    (set, get) => {
      // 先生成基礎 CRUD 方法
      const baseMethods = createPersistentCrudMethods<Todo>('todos', 'todos', set, get);

      return {
        todos: [],

        // 覆寫 addTodo：自動設定 creator 和 visibility
        addTodo: async (data) => {
          try {
            // 取得當前登入用戶
            const { useAuthStore } = await import('./auth-store');
            const currentUser = useAuthStore.getState().user;

            if (!currentUser) {
              throw new Error('請先登入');
            }

            const id = uuidv4();
            const now = new Date().toISOString();

            // 計算 visibility：建立者 + 被指派人（如果有）
            const visibilityList = [currentUser.id];
            if (data.assignee && data.assignee !== currentUser.id) {
              visibilityList.push(data.assignee);
            }

            const newTodo: Todo = {
              ...data,
              id,
              creator: currentUser.id,
              visibility: visibilityList,
              createdAt: now,
              updatedAt: now
            };

            // 1. 立即更新本地 store
            set({
              todos: [...get().todos, newTodo]
            });

            // 2. 存到 IndexedDB
            const { getSyncManager } = await import('@/lib/offline/sync-manager');
            const syncManager = getSyncManager();
            const localDb = syncManager.getLocalDb();
            if (localDb) {
              await localDb.put('todos', newTodo);
            }

            // 3. 📦 純本地模式 - 停用 Supabase 同步
            console.log('📦 本地模式：待辦事項已新增', id);

            return newTodo;
          } catch (error) {
            console.error('❌ 新增待辦事項失敗:', error);
            throw error;
          }
        },

        // 覆寫 updateTodo：智能通知機制
        updateTodo: async (id, updates) => {
          try {
            const { useAuthStore } = await import('./auth-store');
            const currentUser = useAuthStore.getState().user;

            if (!currentUser) {
              throw new Error('請先登入');
            }

            const todo = get().todos.find(t => t.id === id);
            if (!todo) {
              console.warn('找不到待辦事項:', id);
              return undefined;
            }

            // 檢查是否為被指派人在更新
            const isAssigneeUpdating = todo.assignee === currentUser.id && todo.creator !== currentUser.id;

            // 如果被指派人有實質更新（非僅查看），標記需要通知建立者
            const hasSubstantiveUpdate =
              updates.status !== undefined ||
              updates.completed !== undefined ||
              updates.subTasks !== undefined ||
              updates.notes !== undefined ||
              updates.progress !== undefined;

            // 如果更改了 assignee，自動更新 visibility
            let newVisibility = todo.visibility;
            if (updates.assignee !== undefined) {
              newVisibility = [todo.creator]; // 建立者一定能看到
              if (updates.assignee && updates.assignee !== todo.creator) {
                newVisibility.push(updates.assignee); // 新的被指派人
              }
            }

            const updatedTodo = {
              ...todo,
              ...updates,
              visibility: newVisibility,
              updatedAt: new Date().toISOString(),
              // 如果被指派人有實質更新，標記需要通知
              needsCreatorNotification: isAssigneeUpdating && hasSubstantiveUpdate ? true : todo.needsCreatorNotification
            };

            // 使用原本的 update 方法
            return await baseMethods.updateTodo(id, updatedTodo);
          } catch (error) {
            console.error('❌ 更新待辦事項失敗:', error);
            throw error;
          }
        },

        deleteTodo: baseMethods.deleteTodo,

        // 覆寫 loadTodos：只載入當前用戶相關的待辦事項
        loadTodos: async (userId?: string) => {
          try {
            // 取得當前登入用戶
            const { useAuthStore } = await import('./auth-store');
            const currentUser = useAuthStore.getState().user;
            const targetUserId = userId || currentUser?.id;

            if (!targetUserId) {
              console.warn('無法載入待辦事項：未登入');
              return null;
            }

            // 1. 先從 IndexedDB 載入
            const { getSyncManager } = await import('@/lib/offline/sync-manager');
            const syncManager = getSyncManager();
            const localDb = syncManager.getLocalDb();

            if (localDb) {
              const localData = await localDb.getAll('todos');
              if (localData && localData.length > 0) {
                // 過濾：只顯示 creator 是自己，或在 visibility 列表中的待辦事項
                const userTodos = localData.filter((todo: Todo) =>
                  !todo.deleted &&
                  (todo.creator === targetUserId || todo.visibility?.includes(targetUserId))
                );
                set({ todos: userTodos });
                console.log(`📦 從本地載入待辦事項:`, userTodos.length, '筆');
              }
            }

            // 2. 📦 純本地模式 - 停用 Supabase 同步
            console.log('📦 本地模式：從 IndexedDB 載入待辦事項');

            return null;
          } catch (error) {
            console.error('⚠️ 載入待辦事項失敗:', error);
            return null;
          }
        },

        // 自定義方法：切換完成狀態
        toggleTodo: async (id) => {
          try {
            const todo = get().todos.find(t => t.id === id);
            if (!todo) return;

            const newStatus = todo.status === 'completed' ? 'pending' : 'completed';

            // 使用統一的 update 方法
            await get().updateTodo(id, {
              completed: !todo.completed,
              status: newStatus
            });
          } catch (error) {
            console.error('❌ 切換待辦狀態失敗:', error);
          }
        },

        // 清除所有待辦事項
        clearAllTodos: () => {
          set({ todos: [] });
        }
      };
    },
    {
      name: 'venturo-todo-store',
      version: 1,
    }
  )
);
