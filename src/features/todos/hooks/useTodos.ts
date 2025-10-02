import { useTodoStore } from '@/stores/todo-store';
import { todoService } from '../services/todo.service';
import { Todo } from '@/stores/types';

export const useTodos = () => {
  const store = useTodoStore();

  return {
    // ========== 資料 ==========
    todos: store.todos,

    // ========== CRUD 操作 ==========
    createTodo: async (data: Omit<Todo, 'id' | 'createdAt' | 'updatedAt' | 'creator' | 'visibility'>) => {
      return await store.addTodo(data);
    },

    updateTodo: async (id: string, data: Partial<Todo>) => {
      return await store.updateTodo(id, data);
    },

    deleteTodo: async (id: string) => {
      return await store.deleteTodo(id);
    },

    toggleTodo: async (id: string) => {
      return await todoService.toggleTodo(id);
    },

    loadTodos: async (userId?: string) => {
      return await store.loadTodos(userId);
    },

    clearAllTodos: () => {
      store.clearAllTodos();
    },

    // ========== 業務方法 ==========
    getTodosByUser: (userId: string) => {
      return todoService.getTodosByUser(userId);
    },

    getTodosByStatus: (completed: boolean) => {
      return todoService.getTodosByStatus(completed);
    },

    getTodosByPriority: (priority: Todo['priority']) => {
      return todoService.getTodosByPriority(priority);
    },

    getOverdueTodos: () => {
      return todoService.getOverdueTodos();
    },

    getTodayTodos: () => {
      return todoService.getTodayTodos();
    },

    getUpcomingTodos: (days?: number) => {
      return todoService.getUpcomingTodos(days);
    },
  };
};
