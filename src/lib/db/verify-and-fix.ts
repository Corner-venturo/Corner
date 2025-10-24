/**
 * 驗證和修復工具
 *
 * 使用方式：
 * 1. 在瀏覽器 Console 執行：
 *    const { verifyAndFix } = await import('/src/lib/db/verify-and-fix')
 *    await verifyAndFix()
 *
 * 2. 或直接在任何頁面執行（已自動掛載到 window）
 */

import { localDB } from '@/lib/db';
import { Employee as User } from '@/stores/types';

export async function verifyAndFix() {
  console.log('🔍 開始驗證系統狀態...\n');

  try {
    // 1. 檢查 IndexedDB
    console.log('📊 檢查 IndexedDB...');
    const users = await localDB.getAll<User>('employees');
    console.log(`   找到 ${users.length} 位員工`);

    if (users.length > 0) {
      console.log('   員工列表：');
      users.forEach(u => {
        console.log(`   - ${u.display_name} (${u.employee_number}) [${u.status}]`);
      });
    }

    // 2. 檢查 William
    const william = users.find(u => u.employee_number === 'william01');

    if (william) {
      console.log('\n✅ William 帳號存在');
      console.log(`   姓名: ${william.display_name}`);
      console.log(`   員工編號: ${william.employee_number}`);
      console.log(`   狀態: ${william.status}`);
      console.log(`   ID: ${william.id}`);
      console.log(`   權限: ${william.permissions.join(', ')}`);

      console.log('\n✅ 系統狀態正常，無需修復');
      return { status: 'ok', user: william };
    }

    // 3. William 不存在，需要建立
    console.log('\n⚠️ 找不到 William 帳號');
    console.log('🔧 開始建立 William 管理員帳號...\n');

    const newWilliam: User = {
      id: crypto.randomUUID(),
      employee_number: 'william01',
      display_name: 'William Chien',
      english_name: 'William Chien',
      chinese_name: '簡威廉',
      permissions: [
        'super_admin',
        'admin',
        'tours',
        'orders',
        'quotes',
        'finance',
        'hr',
        'database',
        'reports',
        'settings'
      ],
      personal_info: {
        national_id: '',
        birthday: '',
        phone: '',
        email: 'william@venturo.com',
        address: '',
        emergency_contact: { name: '', relationship: '', phone: '' }
      },
      job_info: {
        hire_date: new Date().toISOString()
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
      contracts: [],
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await localDB.create<User>('employees', newWilliam);

    console.log('✅ William 帳號建立成功！');
    console.log(`   員工編號: william01`);
    console.log(`   密碼: 83212711`);
    console.log(`   姓名: ${newWilliam.display_name}`);
    console.log(`   ID: ${newWilliam.id}`);
    console.log(`   權限: 超級管理員（所有權限）`);

    // 4. 驗證建立結果
    const verify = await localDB.getAll<User>('employees');
    console.log(`\n✅ 驗證完成，現有員工數量: ${verify.length}`);

    console.log('\n🎉 修復完成！請重新整理 HR 頁面查看');

    return { status: 'fixed', user: newWilliam };

  } catch (error) {
    console.error('\n❌ 驗證/修復失敗:', error);
    return { status: 'error', error };
  }
}

/**
 * 快速檢查（不修復）
 */
export async function quickCheck() {
  console.log('🔍 快速檢查...\n');

  try {
    const users = await localDB.getAll<User>('employees');
    const william = users.find(u => u.employee_number === 'william01');

    console.log(`📊 IndexedDB 狀態:`);
    console.log(`   總員工數: ${users.length}`);
    console.log(`   William 帳號: ${william ? '✅ 存在' : '❌ 不存在'}`);

    if (william) {
      console.log(`   狀態: ${william.status}`);
      console.log(`   權限: ${william.permissions.length} 項`);
    }

    // 檢查 LocalStorage
    const authStore = localStorage.getItem('auth-storage');
    const localAuthStore = localStorage.getItem('venturo-local-auth-store');

    console.log(`\n💾 LocalStorage 狀態:`);
    console.log(`   auth-storage: ${authStore ? '✅ 存在' : '❌ 不存在'}`);
    console.log(`   venturo-local-auth-store: ${localAuthStore ? '⚠️ 存在（v4.0 遺留）' : '無'}`);

    if (authStore) {
      const parsed = JSON.parse(authStore);
      console.log(`   已登入: ${parsed.state?.isAuthenticated || false}`);
      console.log(`   使用者: ${parsed.state?.user?.display_name || '無'}`);
    }

    return { users, william, hasAuth: !!authStore };

  } catch (error) {
    console.error('❌ 檢查失敗:', error);
    return { error };
  }
}

/**
 * 清除並重建（謹慎使用）
 */
export async function clearAndRebuild() {
  const confirm = window.confirm(
    '⚠️ 這會刪除所有員工資料並重新建立 William 帳號。\n\n確定要繼續嗎？'
  );

  if (!confirm) {
    console.log('❌ 使用者取消操作');
    return;
  }

  console.log('🔧 清除並重建中...\n');

  try {
    // 清除所有員工
    await localDB.clear('employees');
    console.log('✅ 已清除所有員工資料');

    // 重新建立 William
    const result = await verifyAndFix();
    return result;

  } catch (error) {
    console.error('❌ 清除並重建失敗:', error);
    return { status: 'error', error };
  }
}

// 自動掛載到 window（方便 Console 使用）
if (typeof window !== 'undefined') {
  (window as unknown).verifyAndFix = verifyAndFix;
  (window as unknown).quickCheck = quickCheck;
  (window as unknown).clearAndRebuild = clearAndRebuild;

  console.log('💡 驗證工具已載入');
  console.log('📝 可用指令：');
  console.log('   verifyAndFix()      - 驗證並自動修復');
  console.log('   quickCheck()        - 快速檢查（不修復）');
  console.log('   clearAndRebuild()   - 清除並重建（謹慎使用）');
}
