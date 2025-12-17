/**
 * 員工管理 Store
 * 快取優先架構：Supabase（雲端）+ IndexedDB（快取）
 */

import { User } from './types'
import { createStore } from './core/create-store'
import { TABLES } from '@/lib/db/schemas'
import { generateUUID } from '@/lib/utils/uuid'
import { useAuthStore } from './auth-store'

// 建立員工 Store
export const useUserStore = createStore<User>(
  TABLES.EMPLOYEES,
  undefined, // 員工使用 employee_number 而非 code，所以不需要 codePrefix
  true // enableSupabase
)

// 擴充自訂方法（如果需要）
export const userStoreHelpers = {
  /**
   * 根據員工編號查詢
   */
  getUserByNumber: (employee_number: string): User | undefined => {
    const state = useUserStore.getState()
    return state.items.find(user => user.employee_number === employee_number)
  },

  /**
   * 員工編號生成
   * 格式: {辦公室}-E001-E999, {辦公室}-EA01-EA99...
   * 例如: TP-E001, TC-E001, TP-EA01
   * E000 為超級管理員保留
   */
  generateUserNumber: (_english_name?: string): string => {
    const state = useUserStore.getState()
    const users = state.items

    // 取得當前 workspace code（TP 或 TC）
    const currentUser = useAuthStore.getState().user
    const workspaceCode = currentUser?.workspace_code || 'TP'

    // 所有現有的員工編號（同 workspace）
    const allEmployeeNumbers = users
      .filter(user => user.employee_number?.startsWith(`${workspaceCode}-`))
      .map(user => user.employee_number)

    /**
     * 解析員工編號為序列號
     * TP-E001-TP-E999 → 1-999
     * TP-EA01-TP-EA99 → 1000-1098
     * ...
     */
    const parseEmployeeNumber = (num: string): number => {
      // 移除前綴 "TP-" 或 "TC-"
      const withoutPrefix = num.replace(/^[A-Z]{2}-/, '')

      // E000-E999 格式
      const basicMatch = withoutPrefix.match(/^E(\d{3})$/)
      if (basicMatch) {
        return parseInt(basicMatch[1], 10)
      }

      // EA01-EZ99 格式
      const extendedMatch = withoutPrefix.match(/^E([A-Z])(\d{2})$/)
      if (extendedMatch) {
        const letterIndex = extendedMatch[1].charCodeAt(0) - 'A'.charCodeAt(0)
        const number = parseInt(extendedMatch[2], 10)
        // EA01 = 1000, EA99 = 1098, EB01 = 1099, ...
        return 1000 + letterIndex * 99 + (number - 1)
      }

      return -1 // 非有效 E 格式
    }

    /**
     * 將序列號轉換為員工編號（含前綴）
     * 1-999 → TP-E001-TP-E999
     * 1000-1098 → TP-EA01-TP-EA99
     * ...
     */
    const toEmployeeNumber = (seq: number): string => {
      let base: string
      if (seq < 1000) {
        base = `E${seq.toString().padStart(3, '0')}`
      } else {
        const extended = seq - 1000
        const letterIndex = Math.floor(extended / 99)
        const number = (extended % 99) + 1
        const letter = String.fromCharCode('A'.charCodeAt(0) + letterIndex)
        base = `E${letter}${number.toString().padStart(2, '0')}`
      }
      return `${workspaceCode}-${base}`
    }

    // 找出現有最大序號
    const existingSequences = allEmployeeNumbers
      .map(parseEmployeeNumber)
      .filter(n => n >= 0)

    const maxSequence = existingSequences.length > 0 ? Math.max(...existingSequences) : 0
    let nextSequence = maxSequence + 1

    // 跳過 E000（超級管理員保留）
    if (nextSequence === 0) {
      nextSequence = 1
    }

    // 產生編號並確保不重複
    let candidate = toEmployeeNumber(nextSequence)
    while (allEmployeeNumbers.includes(candidate)) {
      nextSequence++
      candidate = toEmployeeNumber(nextSequence)
    }

    return candidate
  },

  /**
   * 搜尋員工
   */
  searchUsers: (searchTerm: string): User[] => {
    const state = useUserStore.getState()
    const users = state.items
    const term = searchTerm.toLowerCase()

    return users.filter(
      user =>
        user.employee_number.toLowerCase().includes(term) ||
        user.english_name.toLowerCase().includes(term) ||
        user.display_name.includes(term)
    )
  },

  /**
   * 按狀態篩選
   */
  getUsersByStatus: (status: User['status']): User[] => {
    const state = useUserStore.getState()
    return state.items.filter(user => user.status === status)
  },

  /**
   * 更新權限
   */
  updateUserPermissions: async (id: string, permissions: string[]): Promise<void> => {
    await useUserStore.getState().update(id, { permissions } as Partial<User>)
  },

  /**
   * 更新基本薪資
   */
  updateBaseSalary: async (id: string, newSalary: number, reason: string): Promise<void> => {
    const user = useUserStore.getState().items.find((u: User) => u.id === id)
    if (!user) return

    const newHistory = [
      ...user.salary_info.salary_history,
      {
        effective_date: new Date().toISOString().split('T')[0],
        base_salary: newSalary,
        reason,
      },
    ]

    await useUserStore.getState().update(id, {
      salary_info: {
        ...user.salary_info,
        base_salary: newSalary,
        salary_history: newHistory,
      },
    } as Partial<User>)
  },

  /**
   * 新增津貼
   */
  addAllowance: async (id: string, type: string, amount: number): Promise<void> => {
    const user = useUserStore.getState().items.find((u: User) => u.id === id)
    if (!user) return

    const newAllowances = [
      ...user.salary_info.allowances.filter(a => a.type !== type),
      { type, amount },
    ]

    await useUserStore.getState().update(id, {
      salary_info: {
        ...user.salary_info,
        allowances: newAllowances,
      },
    } as Partial<User>)
  },

  /**
   * 移除津貼
   */
  removeAllowance: async (id: string, type: string): Promise<void> => {
    const user = useUserStore.getState().items.find((u: User) => u.id === id)
    if (!user) return

    const newAllowances = user.salary_info.allowances.filter(a => a.type !== type)

    await useUserStore.getState().update(id, {
      salary_info: {
        ...user.salary_info,
        allowances: newAllowances,
      },
    } as Partial<User>)
  },

  /**
   * 新增請假記錄
   */
  addLeaveRecord: async (
    id: string,
    leaveRecord: Omit<User['attendance']['leave_records'][0], 'id'>
  ): Promise<void> => {
    const user = useUserStore.getState().items.find((u: User) => u.id === id)
    if (!user) return

    const newRecord = {
      ...leaveRecord,
      id: generateUUID(),
    }

    const newLeaveRecords = [...user.attendance.leave_records, newRecord]

    await useUserStore.getState().update(id, {
      attendance: {
        ...user.attendance,
        leave_records: newLeaveRecords,
      },
    } as Partial<User>)
  },

  /**
   * 核准請假
   */
  approveLeave: async (user_id: string, leaveId: string, approved_by: string): Promise<void> => {
    const user = useUserStore.getState().items.find((u: User) => u.id === user_id)
    if (!user) return

    const updatedRecords = user.attendance.leave_records.map(record =>
      record.id === leaveId ? { ...record, status: 'approved' as const, approved_by } : record
    )

    await useUserStore.getState().update(user_id, {
      attendance: {
        ...user.attendance,
        leave_records: updatedRecords,
      },
    } as Partial<User>)
  },

  /**
   * 拒絕請假
   */
  rejectLeave: async (user_id: string, leaveId: string): Promise<void> => {
    const user = useUserStore.getState().items.find((u: User) => u.id === user_id)
    if (!user) return

    const updatedRecords = user.attendance.leave_records.map(record =>
      record.id === leaveId ? { ...record, status: 'rejected' as const } : record
    )

    await useUserStore.getState().update(user_id, {
      attendance: {
        ...user.attendance,
        leave_records: updatedRecords,
      },
    } as Partial<User>)
  },

  /**
   * 新增加班記錄
   */
  addOvertimeRecord: async (
    id: string,
    overtimeRecord: Omit<User['attendance']['overtime_records'][0], 'id'>
  ): Promise<void> => {
    const user = useUserStore.getState().items.find((u: User) => u.id === id)
    if (!user) return

    const newRecord = {
      ...overtimeRecord,
      id: generateUUID(),
    }

    const newOvertimeRecords = [...user.attendance.overtime_records, newRecord]

    await useUserStore.getState().update(id, {
      attendance: {
        ...user.attendance,
        overtime_records: newOvertimeRecords,
      },
    } as Partial<User>)
  },

  /**
   * 新增合約
   */
  addContract: async (id: string, contract: Omit<User['contracts'][0], 'id'>): Promise<void> => {
    const user = useUserStore.getState().items.find((u: User) => u.id === id)
    if (!user) return

    const newContract = {
      ...contract,
      id: generateUUID(),
    }

    const newContracts = [...user.contracts, newContract]

    await useUserStore.getState().update(id, {
      contracts: newContracts,
    } as Partial<User>)
  },

  /**
   * 更新合約
   */
  updateContract: async (
    user_id: string,
    contractId: string,
    updates: Partial<User['contracts'][0]>
  ): Promise<void> => {
    const user = useUserStore.getState().items.find((u: User) => u.id === user_id)
    if (!user) return

    const updatedContracts = user.contracts.map(contract =>
      contract.id === contractId ? { ...contract, ...updates } : contract
    )

    await useUserStore.getState().update(user_id, {
      contracts: updatedContracts,
    } as Partial<User>)
  },
}

// 相容性 alias（保留舊的 API）
export const useUserStoreCompat = () => {
  const store = useUserStore()

  return {
    ...store,
    users: store.items, // 相容性：items → users
    isLoading: store.loading, // 相容性：loading → isLoading
    loadUsersFromDatabase: store.fetchAll, // 相容性：fetchAll → loadUsersFromDatabase
    addUser: store.create, // 相容性：create → addUser
    updateUser: store.update, // 相容性：update → updateUser
    deleteUser: store.delete, // 相容性：delete → deleteUser
    getUser: (id: string) => store.items.find((u: User) => u.id === id), // 相容性：替代 findById
    ...userStoreHelpers, // 包含所有自訂方法
  }
}
