/**
 * 初始化預設使用者
 * 只建立必要的真實管理員帳號
 */

import { localDB } from '@/lib/db';
import { Employee as User } from '@/stores/types';

export async function initDefaultUser(): Promise<void> {
  try {
    console.log('🔍 檢查使用者資料...');
    
    // 確保資料庫已初始化
    await localDB.init();
    
    // 檢查是否已有使用者
    const count = await localDB.count('employees');

    if (count === 0) {
      console.log('⚠️ 沒有使用者，建立預設管理員...');
      
      // 只建立 William 管理員帳號（使用固定的 UUID 以便識別）
      const adminUser: User = {
        id: '00000000-0000-0000-0000-000000000001',  // ✨ 改用 UUID 格式
        employee_number: 'william01',
        english_name: 'William',
        display_name: 'William Chien',
        chinese_name: '簡威廉',
        status: 'active',

        personal_info: {
          national_id: 'A123456789',
          birthday: '1990-01-01',
          phone: '0912-345-678',
          email: 'william@venturo.com',
          address: '台北市',
          emergency_contact: {
            name: '緊急聯絡人',
            relationship: '家人',
            phone: '0912-345-678'
          }
        },

        job_info: {
          hire_date: '2024-01-01'
        },
        
        salary_info: {
          base_salary: 0,
          allowances: [],
          salary_history: []
        },

        attendance: {
          leave_records: [],
          overtime_records: []
        },
        
        permissions: [
          'super_admin',
          'all_access'
        ],
        
        contracts: [],
        // notes: '系統管理員', // Employee 類型不包含 notes 屬性
        avatar: undefined,
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
