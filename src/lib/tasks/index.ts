/**
 * Background Tasks Module
 * 背景任務系統入口
 */

export {
  // 核心功能
  createTask,
  processTask,
  processQueue,
  cancelTask,
  getPendingTasks,
  getTaskStats,
  registerTaskHandler,

  // 類型
  TaskTypes,
  type Task,
  type TaskHandler,
  type TaskPayload,
  type TaskStatus,
  type TaskPriority,
  type TaskType,
} from './task-queue'

export { taskHandlers } from './handlers'
