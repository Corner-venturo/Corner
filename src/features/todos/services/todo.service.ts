import { BaseService, StoreOperations } from '@/core/services/base.service'
import { Todo } from '@/stores/types'
import { useTodoStore } from '@/stores'
import { ValidationError } from '@/core/errors/app-errors'

class TodoService extends BaseService<Todo> {
  protected resourceName = 'todos'

  protected getStore = (): StoreOperations<Todo> => {
    const store = useTodoStore.getState()
    return {
      getAll: () => store.items,
      getById: (id: string) => store.items.find(t => t.id === id),
      add: async (todo: Todo) => {
        await store.create(todo as unknown)
        return todo
      },
      update: async (id: string, data: Partial<Todo>) => {
        await store.update(id, data)
      },
      delete: async (id: string) => {
        await store.delete(id)
      },
    }
  }

  protected validate(data: Partial<Todo>): void {
    if (data.title && data.title.trim().length === 0) {
      throw new ValidationError('title', '待辦事項標題不能為空')
    }

    if (data.deadline) {
      const deadline = new Date(data.deadline)
      if (isNaN(deadline.getTime())) {
        throw new ValidationError('deadline', '截止日期格式錯誤')
      }
    }
  }

  // ========== 業務邏輯方法 ==========

  async toggleTodo(id: string): Promise<void> {
    const store = useTodoStore.getState()
    const todo = store.items.find(t => t.id === id)
    if (todo) {
      await store.update(id, {
        status: todo.status === 'completed' ? 'pending' : 'completed',
      } as unknown)
    }
  }

  getTodosByUser(user_id: string): Todo[] {
    const store = useTodoStore.getState()
    return store.items.filter(
      t => t.creator === user_id || t.assignee === user_id || t.visibility?.includes(user_id)
    )
  }

  getTodosByStatus(completed: boolean): Todo[] {
    const store = useTodoStore.getState()
    return store.items.filter(t => t.completed === completed)
  }

  getTodosByPriority(priority: Todo['priority']): Todo[] {
    const store = useTodoStore.getState()
    return store.items.filter(t => t.priority === priority)
  }

  getOverdueTodos(): Todo[] {
    const store = useTodoStore.getState()
    const now = new Date()
    return store.items.filter(t => !t.completed && t.deadline && new Date(t.deadline) < now)
  }

  getTodayTodos(): Todo[] {
    const store = useTodoStore.getState()
    const today = new Date().toISOString().split('T')[0]
    return store.items.filter(t => !t.completed && t.deadline?.startsWith(today))
  }

  getUpcomingTodos(days: number = 7): Todo[] {
    const store = useTodoStore.getState()
    const now = new Date()
    const future = new Date()
    future.setDate(future.getDate() + days)

    return store.items.filter(t => {
      if (!t.deadline || t.completed) return false
      const deadline = new Date(t.deadline)
      return deadline >= now && deadline <= future
    })
  }
}

export const todoService = new TodoService()
