import { useTodoStore } from '@/stores'
import { todoService } from '../services/todo.service'
import { Todo } from '@/stores/types'

export const useTodos = () => {
  const store = useTodoStore()

  return {
    // ========== 資料 ==========
    todos: store.items,

    // ========== CRUD 操作 ==========
    createTodo: async (
      data: Omit<Todo, 'id' | 'created_at' | 'updated_at' | 'creator' | 'visibility'>
    ) => {
      return await store.create(data as Omit<Todo, 'id' | 'created_at' | 'updated_at'>)
    },

    updateTodo: async (id: string, data: Partial<Todo>) => {
      return await store.update(id, data)
    },

    deleteTodo: async (id: string) => {
      return await store.delete(id)
    },

    toggleTodo: async (id: string) => {
      return await todoService.toggleTodo(id)
    },

    loadTodos: async (_user_id?: string) => {
      return await store.fetchAll()
    },

    clearAllTodos: () => {
      store.clear()
    },

    // ========== 業務方法 ==========
    getTodosByUser: (_user_id: string) => {
      return todoService.getTodosByUser(_user_id)
    },

    getTodosByStatus: (completed: boolean) => {
      return todoService.getTodosByStatus(completed)
    },

    getTodosByPriority: (priority: Todo['priority']) => {
      return todoService.getTodosByPriority(priority)
    },

    getOverdueTodos: () => {
      return todoService.getOverdueTodos()
    },

    getTodayTodos: () => {
      return todoService.getTodayTodos()
    },

    getUpcomingTodos: (days?: number) => {
      return todoService.getUpcomingTodos(days)
    },
  }
}
