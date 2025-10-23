/**
 * 員工管理 Store
 * 離線優先架構：Supabase（雲端）+ IndexedDB（快取）
 */

import { User } from './types';
import { createStore } from './create-store';
import { TABLES } from '@/lib/db/schemas';
import { generateUUID } from '@/lib/utils/uuid';

// 建立員工 Store
export const useUserStore = createStore<User>(
  TABLES.EMPLOYEES as any,
  undefined, // 員工使用 employee_number 而非 code，所以不需要 codePrefix
  true // enableSupabase
);

// 擴充自訂方法（如果需要）
export const userStoreHelpers = {
  /**
   * 根據員工編號查詢
   */
  getUserByNumber: (employee_number: string): User | undefined => {
    const state = useUserStore.getState();
    return state.items.find(user => user.employee_number === employee_number);
  },

  /**
   * 員工編號生成
   */
  generateUserNumber: (english_name: string): string => {
    const state = useUserStore.getState();
    const users = state.items;
    const baseName = english_name.toLowerCase();

    // 所有現有的員工編號（包括同名和不同名的）
    const allEmployeeNumbers = users.map(user => user.employee_number);

    // 取得所有數字編號（不限名字）
    const allNumericNumbers = allEmployeeNumbers
      .map(num => {
        const match = num.match(/\d+$/);
        return match ? parseInt(match[0], 10) : 0;
      })
      .filter(num => num > 0);

    // 找到全局最大編號
    const maxNumber = allNumericNumbers.length > 0 ? Math.max(...allNumericNumbers) : 0;
    let nextNumber = maxNumber + 1;

    // 確保這個編號不會與現有的任何員工編號衝突
    let candidate = `${baseName}${nextNumber.toString().padStart(2, '0')}`;
    while (allEmployeeNumbers.includes(candidate)) {
      nextNumber++;
      candidate = `${baseName}${nextNumber.toString().padStart(2, '0')}`;
    }

    console.log('🔢 產生員工編號:', candidate, '(檢查了', allEmployeeNumbers.length, '個現有編號)');
    return candidate;
  },

  /**
   * 搜尋員工
   */
  searchUsers: (searchTerm: string): User[] => {
    const state = useUserStore.getState();
    const users = state.items;
    const term = searchTerm.toLowerCase();

    return users.filter(user =>
      user.employee_number.toLowerCase().includes(term) ||
      user.english_name.toLowerCase().includes(term) ||
      user.display_name.includes(term)
    );
  },

  /**
   * 按狀態篩選
   */
  getUsersByStatus: (status: User['status']): User[] => {
    const state = useUserStore.getState();
    return state.items.filter(user => user.status === status);
  },

  /**
   * 更新權限
   */
  updateUserPermissions: async (id: string, permissions: string[]): Promise<void> => {
    await useUserStore.getState().update(id, { permissions } as any);
    console.log('✅ 權限更新完成:', id, permissions);
  },

  /**
   * 更新基本薪資
   */
  updateBaseSalary: async (id: string, newSalary: number, reason: string): Promise<void> => {
    const user = useUserStore.getState().items.find((u: User) => u.id === id);
    if (!user) return;

    const newHistory = [
      ...user.salary_info.salary_history,
      {
        effective_date: new Date().toISOString().split('T')[0],
        base_salary: newSalary,
        reason
      }
    ];

    await useUserStore.getState().update(id, {
      salary_info: {
        ...user.salary_info,
        base_salary: newSalary,
        salary_history: newHistory
      }
    } as any);
  },

  /**
   * 新增津貼
   */
  addAllowance: async (id: string, type: string, amount: number): Promise<void> => {
    const user = useUserStore.getState().items.find((u: User) => u.id === id);
    if (!user) return;

    const newAllowances = [
      ...user.salary_info.allowances.filter((a: any) => a.type !== type),
      { type, amount }
    ];

    await useUserStore.getState().update(id, {
      salary_info: {
        ...user.salary_info,
        allowances: newAllowances
      }
    } as any);
  },

  /**
   * 移除津貼
   */
  removeAllowance: async (id: string, type: string): Promise<void> => {
    const user = useUserStore.getState().items.find((u: User) => u.id === id);
    if (!user) return;

    const newAllowances = user.salary_info.allowances.filter((a: any) => a.type !== type);

    await useUserStore.getState().update(id, {
      salary_info: {
        ...user.salary_info,
        allowances: newAllowances
      }
    } as any);
  },

  /**
   * 新增請假記錄
   */
  addLeaveRecord: async (id: string, leaveRecord: Omit<User['attendance']['leave_records'][0], 'id'>): Promise<void> => {
    const user = useUserStore.getState().items.find((u: User) => u.id === id);
    if (!user) return;

    const newRecord = {
      ...leaveRecord,
      id: generateUUID()
    };

    const newLeaveRecords = [...user.attendance.leave_records, newRecord];

    await useUserStore.getState().update(id, {
      attendance: {
        ...user.attendance,
        leave_records: newLeaveRecords
      }
    } as any);
  },

  /**
   * 核准請假
   */
  approveLeave: async (user_id: string, leaveId: string, approved_by: string): Promise<void> => {
    const user = useUserStore.getState().items.find((u: User) => u.id === user_id);
    if (!user) return;

    const updatedRecords = user.attendance.leave_records.map((record: any) =>
      record.id === leaveId
        ? { ...record, status: 'approved' as const, approved_by }
        : record
    );

    await useUserStore.getState().update(user_id, {
      attendance: {
        ...user.attendance,
        leave_records: updatedRecords
      }
    } as any);
  },

  /**
   * 拒絕請假
   */
  rejectLeave: async (user_id: string, leaveId: string): Promise<void> => {
    const user = useUserStore.getState().items.find((u: User) => u.id === user_id);
    if (!user) return;

    const updatedRecords = user.attendance.leave_records.map((record: any) =>
      record.id === leaveId
        ? { ...record, status: 'rejected' as const }
        : record
    );

    await useUserStore.getState().update(user_id, {
      attendance: {
        ...user.attendance,
        leave_records: updatedRecords
      }
    } as any);
  },

  /**
   * 新增加班記錄
   */
  addOvertimeRecord: async (id: string, overtimeRecord: Omit<User['attendance']['overtime_records'][0], 'id'>): Promise<void> => {
    const user = useUserStore.getState().items.find((u: User) => u.id === id);
    if (!user) return;

    const newRecord = {
      ...overtimeRecord,
      id: generateUUID()
    };

    const newOvertimeRecords = [...user.attendance.overtime_records, newRecord];

    await useUserStore.getState().update(id, {
      attendance: {
        ...user.attendance,
        overtime_records: newOvertimeRecords
      }
    } as any);
  },

  /**
   * 新增合約
   */
  addContract: async (id: string, contract: Omit<User['contracts'][0], 'id'>): Promise<void> => {
    const user = useUserStore.getState().items.find((u: User) => u.id === id);
    if (!user) return;

    const newContract = {
      ...contract,
      id: generateUUID()
    };

    const newContracts = [...user.contracts, newContract];

    await useUserStore.getState().update(id, {
      contracts: newContracts
    } as any);
  },

  /**
   * 更新合約
   */
  updateContract: async (user_id: string, contractId: string, updates: Partial<User['contracts'][0]>): Promise<void> => {
    const user = useUserStore.getState().items.find((u: User) => u.id === user_id);
    if (!user) return;

    const updatedContracts = user.contracts.map((contract: any) =>
      contract.id === contractId
        ? { ...contract, ...updates }
        : contract
    );

    await useUserStore.getState().update(user_id, {
      contracts: updatedContracts
    } as any);
  },
};

// 相容性 alias（保留舊的 API）
export const useUserStoreCompat = () => {
  const store = useUserStore();

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
  };
};
