'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useRouter } from 'next/navigation';
import { User } from '@/stores/types';

export default function LoginPage() {
  const { login } = useAuthStore();
  const router = useRouter();

  // 初始化時檢查登入狀態
  useEffect(() => {
    // Zustand persist 會自動 rehydrate
  }, []);

  const handleAdminLogin = () => {
    const adminUser: User = {
      id: 'admin-test-001',
      employeeNumber: 'ADMIN001',
      englishName: 'Admin',
      chineseName: '系統管理員',
      personalInfo: {
        nationalId: 'A123456789',
        birthday: '1990-01-01',
        gender: 'male',
        phone: '0912345678',
        email: 'admin@venturo.com',
        address: '台北市',
        emergencyContact: {
          name: '緊急聯絡人',
          relationship: '家人',
          phone: '0912345678'
        }
      },
      jobInfo: {
        department: '管理部',
        position: '系統管理員',
        hireDate: '2020-01-01',
        employmentType: 'fulltime'
      },
      salaryInfo: {
        baseSalary: 50000,
        allowances: [],
        salaryHistory: []
      },
      permissions: ['super_admin', 'admin', 'view_all', 'edit_all', 'delete_all'],
      attendance: {
        leaveRecords: [],
        overtimeRecords: []
      },
      contracts: [],
      status: 'active'
    };

    // 設置認證狀態
    login(adminUser);

    // 延遲跳轉,確保狀態已更新
    setTimeout(() => {
      router.push('/workspace');
    }, 100);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-morandi-sage/20 to-morandi-gold/20">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">Venturo 登入</h1>

        <div className="space-y-4">
          <button
            onClick={handleAdminLogin}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-md"
          >
            🔐 管理員測試登入
          </button>

          <p className="text-center text-sm text-gray-500 mt-4">
            點擊按鈕以管理員身份登入測試所有功能
          </p>
        </div>
      </div>
    </div>
  );
}
