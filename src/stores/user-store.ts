import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from './types';

interface UserStore {
  users: User[];
  isLoading: boolean;

  // 資料載入（純本地模式）
  loadUsersFromDatabase: () => void;

  // 基本操作
  addUser: (user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  getUser: (id: string) => User | undefined;
  getUserByNumber: (employeeNumber: string) => User | undefined;

  // 員工編號生成
  generateUserNumber: (englishName: string) => string;

  // 權限管理
  updateUserPermissions: (id: string, permissions: string[]) => void;

  // 薪資管理
  updateBaseSalary: (id: string, newSalary: number, reason: string) => void;
  addAllowance: (id: string, type: string, amount: number) => void;
  removeAllowance: (id: string, type: string) => void;

  // 出勤管理
  addLeaveRecord: (id: string, leaveRecord: Omit<User['attendance']['leaveRecords'][0], 'id'>) => void;
  approveLeave: (userId: string, leaveId: string, approvedBy: string) => void;
  rejectLeave: (userId: string, leaveId: string) => void;
  addOvertimeRecord: (id: string, overtimeRecord: Omit<User['attendance']['overtimeRecords'][0], 'id'>) => void;

  // 合約管理
  addContract: (id: string, contract: Omit<User['contracts'][0], 'id'>) => void;
  updateContract: (userId: string, contractId: string, updates: Partial<User['contracts'][0]>) => void;

  // 搜尋與篩選
  searchUsers: (searchTerm: string) => User[];
  getUsersByStatus: (status: User['status']) => User[];
  getUsersByDepartment: (department: string) => User[];
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      users: [],
      isLoading: false,

      // 資料載入（純本地模式 - 從 localStorage 讀取）
      loadUsersFromDatabase: () => {
        console.log('📦 本地模式：從 localStorage 載入員工資料');
        const state = get();
        console.log('✅ 載入完成:', state.users.length, '筆員工資料');
      },

  // 基本操作
  addUser: (userData) => {
    const newUser: User = {
      ...userData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    set((state) => ({
      users: [...state.users, newUser]
    }));
  },

  updateUser: (id, updates) => {
    set((state) => ({
      users: state.users.map(user =>
        user.id === id
          ? { ...user, ...updates, updatedAt: new Date().toISOString() }
          : user
      )
    }));
    console.log('📦 本地模式：更新員工', id);
  },

  deleteUser: (id) => {
    set((state) => ({
      users: state.users.filter(user => user.id !== id)
    }));
    console.log('📦 本地模式：刪除員工', id);
  },

  getUser: (id) => {
    return get().users.find(user => user.id === id);
  },

  getUserByNumber: (employeeNumber) => {
    return get().users.find(user => user.employeeNumber === employeeNumber);
  },

  // 員工編號生成
  generateUserNumber: (englishName) => {
    const users = get().users;

    // 所有現有的員工編號
    const allEmployeeNumbers = users.map(user => user.employeeNumber);

    // 取得最大的數字編號
    const numericNumbers = allEmployeeNumbers
      .map(num => {
        const match = num.match(/\d+$/);
        return match ? parseInt(match[0], 10) : 0;
      })
      .filter(num => num > 0);

    // 找到下一個可用的編號
    const maxNumber = numericNumbers.length > 0 ? Math.max(...numericNumbers) : 0;
    const nextNumber = maxNumber + 1;

    // 格式化為兩位數 (william01, william02...)
    const formattedNumber = nextNumber.toString().padStart(2, '0');

    return `${englishName.toLowerCase()}${formattedNumber}`;
  },

  // 權限管理
  updateUserPermissions: (id, permissions) => {
    get().updateUser(id, { permissions });
    console.log('📦 本地模式：更新權限', id, permissions);
  },

  // 薪資管理
  updateBaseSalary: (id, newSalary, reason) => {
    const user = get().getUser(id);
    if (!user) return;

    const newHistory = [
      ...user.salaryInfo.salaryHistory,
      {
        effectiveDate: new Date().toISOString().split('T')[0],
        baseSalary: newSalary,
        reason
      }
    ];

    get().updateUser(id, {
      salaryInfo: {
        ...user.salaryInfo,
        baseSalary: newSalary,
        salaryHistory: newHistory
      }
    });
  },

  addAllowance: (id, type, amount) => {
    const user = get().getUser(id);
    if (!user) return;

    const newAllowances = [
      ...user.salaryInfo.allowances.filter(a => a.type !== type),
      { type, amount }
    ];

    get().updateUser(id, {
      salaryInfo: {
        ...user.salaryInfo,
        allowances: newAllowances
      }
    });
  },

  removeAllowance: (id, type) => {
    const user = get().getUser(id);
    if (!user) return;

    const newAllowances = user.salaryInfo.allowances.filter(a => a.type !== type);

    get().updateUser(id, {
      salaryInfo: {
        ...user.salaryInfo,
        allowances: newAllowances
      }
    });
  },

  // 出勤管理
  addLeaveRecord: (id, leaveRecord) => {
    const user = get().getUser(id);
    if (!user) return;

    const newRecord = {
      ...leaveRecord,
      id: Date.now().toString()
    };

    const newLeaveRecords = [...user.attendance.leaveRecords, newRecord];

    get().updateUser(id, {
      attendance: {
        ...user.attendance,
        leaveRecords: newLeaveRecords
      }
    });
  },

  approveLeave: (userId, leaveId, approvedBy) => {
    const user = get().getUser(userId);
    if (!user) return;

    const updatedRecords = user.attendance.leaveRecords.map(record =>
      record.id === leaveId
        ? { ...record, status: 'approved' as const, approvedBy }
        : record
    );

    get().updateUser(userId, {
      attendance: {
        ...user.attendance,
        leaveRecords: updatedRecords
      }
    });
  },

  rejectLeave: (userId, leaveId) => {
    const user = get().getUser(userId);
    if (!user) return;

    const updatedRecords = user.attendance.leaveRecords.map(record =>
      record.id === leaveId
        ? { ...record, status: 'rejected' as const }
        : record
    );

    get().updateUser(userId, {
      attendance: {
        ...user.attendance,
        leaveRecords: updatedRecords
      }
    });
  },

  addOvertimeRecord: (id, overtimeRecord) => {
    const user = get().getUser(id);
    if (!user) return;

    const newRecord = {
      ...overtimeRecord,
      id: Date.now().toString()
    };

    const newOvertimeRecords = [...user.attendance.overtimeRecords, newRecord];

    get().updateUser(id, {
      attendance: {
        ...user.attendance,
        overtimeRecords: newOvertimeRecords
      }
    });
  },

  // 合約管理
  addContract: (id, contract) => {
    const user = get().getUser(id);
    if (!user) return;

    const newContract = {
      ...contract,
      id: Date.now().toString()
    };

    const newContracts = [...user.contracts, newContract];

    get().updateUser(id, {
      contracts: newContracts
    });
  },

  updateContract: (userId, contractId, updates) => {
    const user = get().getUser(userId);
    if (!user) return;

    const updatedContracts = user.contracts.map(contract =>
      contract.id === contractId
        ? { ...contract, ...updates }
        : contract
    );

    get().updateUser(userId, {
      contracts: updatedContracts
    });
  },

  // 搜尋與篩選
  searchUsers: (searchTerm) => {
    const users = get().users;
    const term = searchTerm.toLowerCase();

    return users.filter(user =>
      user.employeeNumber.toLowerCase().includes(term) ||
      user.englishName.toLowerCase().includes(term) ||
      user.chineseName.includes(term) ||
      user.jobInfo.department.toLowerCase().includes(term) ||
      user.jobInfo.position.toLowerCase().includes(term)
    );
  },

  getUsersByStatus: (status) => {
    return get().users.filter(user => user.status === status);
  },

  getUsersByDepartment: (department) => {
    return get().users.filter(user => user.jobInfo.department === department);
  }
    }),
    {
      name: 'user-storage',
      version: 1
    }
  )
);
