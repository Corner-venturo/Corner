/**
 * 初始化預設使用者
 * 只建立必要的真實管理員帳號
 */

import { localDB } from '@/lib/db';
import { User } from '@/types';

export async function initDefaultUser(): Promise<void> {
  try {
    console.log('🔍 檢查使用者資料...');
    
    // 確保資料庫已初始化
    await localDB.init();
    
    // 檢查是否已有使用者
    const count = await localDB.count('employees');

    if (count === 0) {
      console.log('⚠️ 沒有使用者，建立預設管理員...');
      
      // 只建立 William 管理員帳號
      const adminUser: User = {
        id: 'admin-william-001',
        employee_number: 'william01',
        english_name: 'William',
        chineseName: 'William Chien',
        status: 'active',
        
        personalInfo: {
          gender: 'male',
          birthday: '1990-01-01',
          phone: '0912-345-678',
          email: 'william@venturo.com',
          address: '台北市',
          emergency_contact: '緊急聯絡人',
          emergency_phone: '0912-345-678'
        },
        
        jobInfo: {
          department: '管理部',
          position: '系統管理員',
          level: 'admin',
          manager: '無',
          hire_date: '2024-01-01',
          regularDate: '2024-01-01',
          workLocation: '總公司'
        },
        
        salaryInfo: {
          baseSalary: 0,
          allowances: [],
          salaryHistory: []
        },
        
        attendance: {
          annualLeave: 0,
          sickLeave: 0,
          personalLeave: 0,
          leaveRecords: [],
          overtimeRecords: []
        },
        
        permissions: [
          'super_admin',
          'all_access'
        ],
        
        contracts: [],
        notes: '系統管理員',
        avatar: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      await localDB.create('employees', adminUser);
      console.log('✅ 成功建立管理員帳號 william01');
    }
    
  } catch (error) {
    console.error('❌ 初始化失敗:', error);
    throw error;
  }
}
