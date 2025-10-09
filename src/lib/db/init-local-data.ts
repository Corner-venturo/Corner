/**
 * 初始化本地資料庫
 * 建立所有必要的預設資料
 */

import bcrypt from 'bcryptjs';
import { localDB } from '@/lib/db';

/**
 * 產生 UUID
 */
function generateUUID(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 產生編號
 */
function generateCode(prefix: string, index: number): string {
  const year = new Date().getFullYear();
  const number = (index + 1).toString().padStart(4, '0');
  return `${prefix}${year}${number}`;
}

/**
 * 初始化本地資料庫
 */
export async function initLocalDatabase(): Promise<void> {
  console.log('🔧 初始化本地資料庫...');

  try {
    // 初始化 IndexedDB
    await localDB.init();
    console.log('✅ IndexedDB 已初始化');

    // 檢查是否已有資料
    const employeeCount = await localDB.count('employees');
    
    if (employeeCount === 0) {
      console.log('📝 建立預設資料...');
      
      // 1. 建立預設管理員
      await createDefaultAdmin();
      
      // 2. 建立測試員工
      await createTestEmployees();
      
      // 3. 建立測試旅遊團
      await createTestTours();
      
      // 4. 建立測試客戶
      await createTestCustomers();
      
      // 5. 建立測試訂單
      await createTestOrders();
      
      // 6. 建立測試待辦事項
      await createTestTodos();
      
      console.log('✅ 預設資料建立完成');
    } else {
      console.log('✅ 資料庫已有資料，跳過初始化');
      
      // 檢查預設管理員是否有密碼
      await checkDefaultAdminPassword();
    }
  } catch (error) {
    console.error('❌ 初始化資料庫失敗:', error);
    throw error;
  }
}

/**
 * 建立預設管理員
 */
async function createDefaultAdmin(): Promise<void> {
  const hashedPassword = await bcrypt.hash('Venturo2025!', 10);
  
  await localDB.create('employees', {
    id: generateUUID(),
    employee_number: 'william01',
    name: 'William Chien',
    email: 'william@venturo.local',
    passwordHash: hashedPassword,
    permissions: [
      'super_admin', 'admin', 
      'quotes', 'tours', 'orders', 
      'payments', 'disbursement', 
      'todos', 'hr', 'reports', 'settings'
    ],
    department: 'IT',
    position: 'System Administrator',
    salary: 0,
    is_active: true,
    loginAttempts: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
  
  console.log('✅ 預設管理員已建立 (william01 / Venturo2025!)');
}

/**
 * 檢查預設管理員密碼
 */
async function checkDefaultAdminPassword(): Promise<void> {
  const admins = await localDB.filter('employees', [
    { field: 'employeeNumber', operator: 'eq', value: 'william01' }
  ]);
  
  if (admins.length > 0 && !admins[0].passwordHash) {
    // 如果沒有密碼，設定預設密碼
    const hashedPassword = await bcrypt.hash('Venturo2025!', 10);
    await localDB.update('employees', admins[0].id, {
      passwordHash: hashedPassword,
      updated_at: new Date().toISOString()
    });
    console.log('✅ 已為預設管理員設定密碼');
  }
}

/**
 * 建立測試員工
 */
async function createTestEmployees(): Promise<void> {
  const employees = [
    {
      employee_number: 'alice02',
      name: 'Alice Chen',
      email: 'alice@venturo.local',
      password: 'Alice2025!',
      permissions: ['tours', 'orders', 'customers'],
      department: '業務部',
      position: '業務經理'
    },
    {
      employee_number: 'bob03',
      name: 'Bob Lin',
      email: 'bob@venturo.local',
      password: 'Bob2025!',
      permissions: ['payments', 'disbursement', 'reports'],
      department: '財務部',
      position: '會計'
    }
  ];
  
  for (const emp of employees) {
    const hashedPassword = await bcrypt.hash(emp.password, 10);
    
    await localDB.create('employees', {
      id: generateUUID(),
      employee_number: emp.employee_number,
      name: emp.name,
      email: emp.email,
      passwordHash: hashedPassword,
      permissions: emp.permissions,
      department: emp.department,
      position: emp.position,
      salary: 0,
      is_active: true,
      loginAttempts: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }
  
  console.log('✅ 測試員工已建立');
}

/**
 * 建立測試旅遊團
 */
async function createTestTours(): Promise<void> {
  const tours = [
    {
      code: generateCode('T', 0),
      name: '日本東京5日遊',
      destination: '日本',
      start_date: '2025-02-01',
      end_date: '2025-02-05',
      price: 45000,
      maxParticipants: 20,
      currentParticipants: 12,
      status: 'open',
      description: '東京市區觀光、迪士尼樂園、富士山一日遊'
    },
    {
      code: generateCode('T', 1),
      name: '韓國首爾4日遊',
      destination: '韓國',
      start_date: '2025-02-10',
      end_date: '2025-02-13',
      price: 32000,
      maxParticipants: 25,
      currentParticipants: 8,
      status: 'open',
      description: '首爾市區觀光、景福宮、明洞購物'
    },
    {
      code: generateCode('T', 2),
      name: '泰國曼谷5日遊',
      destination: '泰國',
      start_date: '2025-03-01',
      end_date: '2025-03-05',
      price: 28000,
      maxParticipants: 30,
      currentParticipants: 0,
      status: 'planning',
      description: '大皇宮、水上市場、芭達雅一日遊'
    }
  ];
  
  for (const tour of tours) {
    await localDB.create('tours', {
      id: generateUUID(),
      ...tour,
      created_by: 'william01',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }
  
  console.log('✅ 測試旅遊團已建立');
}

/**
 * 建立測試客戶
 */
async function createTestCustomers(): Promise<void> {
  const customers = [
    {
      code: generateCode('C', 0),
      name: '張三',
      phone: '0912345678',
      email: 'zhang@example.com',
      address: '台北市信義區信義路五段7號',
      birthday: '1985-03-15',
      passport_number: 'A123456789',
      passportExpiry: '2030-05-20',
      emergency_contact: '張太太',
      emergency_phone: '0923456789'
    },
    {
      code: generateCode('C', 1),
      name: '李四',
      phone: '0923456789',
      email: 'li@example.com',
      address: '台北市大安區忠孝東路四段100號',
      birthday: '1990-07-22',
      passport_number: 'B987654321',
      passportExpiry: '2029-12-31',
      emergency_contact: '李先生',
      emergency_phone: '0934567890'
    },
    {
      code: generateCode('C', 2),
      name: '王五',
      phone: '0934567890',
      email: 'wang@example.com',
      address: '新北市板橋區中山路一段50號',
      birthday: '1978-11-08',
      passport_number: 'C456789012',
      passportExpiry: '2028-08-15',
      emergency_contact: '王太太',
      emergency_phone: '0945678901'
    }
  ];
  
  for (const customer of customers) {
    await localDB.create('customers', {
      id: generateUUID(),
      ...customer,
      notes: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }
  
  console.log('✅ 測試客戶已建立');
}

/**
 * 建立測試訂單
 */
async function createTestOrders(): Promise<void> {
  // 取得旅遊團和客戶資料
  const tours = await localDB.getAll('tours');
  const customers = await localDB.getAll('customers');
  
  if (tours.length > 0 && customers.length > 0) {
    const orders = [
      {
        code: generateCode('O', 0),
        tour_id: tours[0].id,
        customer_id: customers[0].id,
        total_amount: 90000, // 2人
        paid_amount: 45000,
        status: 'confirmed',
        notes: '夫妻兩人參團'
      },
      {
        code: generateCode('O', 1),
        tour_id: tours[0].id,
        customer_id: customers[1].id,
        total_amount: 135000, // 3人
        paid_amount: 0,
        status: 'pending',
        notes: '家庭旅遊，含一位兒童'
      },
      {
        code: generateCode('O', 2),
        tour_id: tours[1].id,
        customer_id: customers[2].id,
        total_amount: 32000, // 1人
        paid_amount: 32000,
        status: 'paid',
        notes: '單人參團，已付清'
      }
    ];
    
    for (const order of orders) {
      await localDB.create('orders', {
        id: generateUUID(),
        ...order,
        created_by: 'alice02',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    
    console.log('✅ 測試訂單已建立');
  }
}

/**
 * 建立測試待辦事項
 */
async function createTestTodos(): Promise<void> {
  const todos = [
    {
      title: '確認東京團飯店預訂',
      description: '聯繫日本當地飯店確認2月份的預訂',
      priority: 'high',
      status: 'pending',
      dueDate: '2025-01-15',
      creator: 'william01',
      assignee: 'alice02'
    },
    {
      title: '準備韓國團簽證資料',
      description: '收集參團人員護照影本',
      priority: 'medium',
      status: 'in_progress',
      dueDate: '2025-01-20',
      creator: 'alice02',
      assignee: 'alice02'
    },
    {
      title: '更新網站行程資訊',
      description: '更新3月份泰國團的詳細行程',
      priority: 'low',
      status: 'pending',
      dueDate: '2025-01-31',
      creator: 'william01',
      assignee: 'bob03'
    }
  ];
  
  for (const todo of todos) {
    await localDB.create('todos', {
      id: generateUUID(),
      ...todo,
      completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }
  
  console.log('✅ 測試待辦事項已建立');
}

/**
 * 清空所有資料（危險操作）
 */
export async function clearAllData(): Promise<void> {
  const tables = [
    'employees', 'tours', 'orders', 'customers',
    'members', 'payments', 'todos', 'visas',
    'suppliers', 'quotes', 'quote_items',
    'payment_requests', 'disbursement_orders', 'receipt_orders'
  ];
  
  for (const table of tables) {
    try {
      await localDB.clear(table);
      console.log(`✅ 已清空 ${table} 表`);
    } catch (error) {
      console.error(`❌ 清空 ${table} 表失敗:`, error);
    }
  }
}

/**
 * 匯出所有資料
 */
export async function exportAllData(): Promise<Record<string, unknown[]>> {
  return await localDB.export();
}

/**
 * 匯入資料
 */
export async function importData(data: Record<string, unknown[]>): Promise<void> {
  await localDB.import(data);
}

// 自動初始化（在瀏覽器環境）
if (typeof window !== 'undefined') {
  // 檢查是否需要初始化
  const needsInit = localStorage.getItem('venturo-db-initialized') !== 'true';
  
  if (needsInit) {
    initLocalDatabase().then(() => {
      localStorage.setItem('venturo-db-initialized', 'true');
    }).catch(error => {
      console.error('自動初始化失敗:', error);
    });
  }
}
