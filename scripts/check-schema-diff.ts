/**
 * Schema 差異檢查工具
 * 比對 IndexedDB schemas、前端 types、Supabase types
 */

import { TABLE_SCHEMAS } from '../src/lib/db/schemas'
import type { Database } from '../src/lib/supabase/types'

// 前端實際使用的型別（從 stores/types.ts）
const FRONTEND_TYPES = {
  employees: [
    'id',
    'employee_number',
    'english_name',
    'display_name',
    'chinese_name',
    'personal_info',
    'job_info',
    'salary_info',
    'permissions',
    'roles',
    'attendance',
    'contracts',
    'status',
    'avatar',
    'password_hash',
    'last_password_change',
    'must_change_password',
    'failed_login_attempts',
    'last_failed_login',
    'created_at',
    'updated_at',
  ],
  tours: [
    'id',
    'code',
    'name',
    'departure_date',
    'return_date',
    'status',
    'location',
    'price',
    'max_participants',
    'current_participants',
    'contract_status',
    'total_revenue',
    'total_cost',
    'profit',
    'quote_id',
    'quote_cost_structure',
    'archived',
    'description',
    'outboundFlight',
    'returnFlight',
    'created_at',
    'updated_at',
  ],
  orders: [
    'id',
    'order_number',
    'tour_id',
    'code',
    'tour_name',
    'customer_id',
    'contact_person',
    'sales_person',
    'assistant',
    'member_count',
    'status',
    'payment_status',
    'total_amount',
    'paid_amount',
    'remaining_amount',
    'notes',
    'created_at',
    'updated_at',
  ],
  members: [
    'id',
    'order_id',
    'tour_id',
    'name',
    'name_en',
    'birthday',
    'passport_number',
    'passport_expiry',
    'id_number',
    'gender',
    'age',
    'phone',
    'email',
    'emergency_contact',
    'emergency_phone',
    'dietary_restrictions',
    'medical_conditions',
    'room_preference',
    'assigned_room',
    'is_child_no_bed',
    'reservation_code',
    'add_ons',
    'refunds',
    'custom_fields',
    'notes',
    'created_at',
    'updated_at',
  ],
  customers: [
    'id',
    'code',
    'name',
    'phone',
    'email',
    'address',
    'notes',
    'is_vip',
    'is_active',
    'created_at',
    'updated_at',
  ],
  quotes: [
    'id',
    'quote_number',
    'name',
    'status',
    'tour_id',
    'customer_name',
    'contact_person',
    'contact_phone',
    'contact_email',
    'group_size',
    'accommodation_days',
    'requirements',
    'budget_range',
    'valid_until',
    'payment_terms',
    'categories',
    'total_cost',
    'version',
    'versions',
    'created_at',
    'updated_at',
  ],
  suppliers: [
    'id',
    'code',
    'name',
    'type',
    'contact',
    'bank_info',
    'price_list',
    'status',
    'note',
    'created_at',
    'updated_at',
  ],
  todos: [
    'id',
    'title',
    'priority',
    'deadline',
    'status',
    'completed',
    'creator',
    'assignee',
    'visibility',
    'related_items',
    'sub_tasks',
    'notes',
    'enabled_quick_actions',
    'needs_creator_notification',
    'type',
    'parent_id',
    'project_id',
    'created_at',
    'updated_at',
  ],
  tour_addons: [
    'id',
    'tour_id',
    'name',
    'price',
    'description',
    'is_active',
    'created_at',
    'updated_at',
  ],
  tour_refunds: [
    'id',
    'tour_id',
    'order_id',
    'order_number',
    'member_name',
    'reason',
    'amount',
    'status',
    'applied_date',
    'processed_date',
    'notes',
    'created_at',
    'updated_at',
  ],
}

// Supabase 型別定義（從 types.ts 提取）
type SupabaseTables = Database['public']['Tables']

function _getSupabaseFields(_tableName: keyof SupabaseTables): string[] {
  // 這裡需要手動列出（因為 TypeScript 型別在 runtime 不可用）
  // 或者從 Supabase 實際查詢 schema
  return []
}

function compareSchemas() {
  console.log('🔍 開始比對 Schema...\n')

  const results = {
    missing_in_supabase: {} as Record<string, string[]>,
    missing_in_frontend: {} as Record<string, string[]>,
    missing_tables: [] as string[],
    extra_tables: [] as string[],
  }

  // 檢查缺少的表格
  const frontendTables = Object.keys(FRONTEND_TYPES)
  const supabaseTables = TABLE_SCHEMAS.map(s => s.name)

  frontendTables.forEach(table => {
    if (!supabaseTables.includes(table)) {
      results.missing_tables.push(table)
    }
  })

  // 生成報告
  console.log('📊 檢查結果：\n')

  if (results.missing_tables.length > 0) {
    console.log('❌ Supabase 缺少的表格：')
    results.missing_tables.forEach(table => {
      console.log(`   - ${table}`)
    })
    console.log('')
  }

  Object.entries(FRONTEND_TYPES).forEach(([table, fields]) => {
    console.log(`\n📋 ${table}:`)
    console.log(`   前端欄位數: ${fields.length}`)
    fields.forEach(field => {
      console.log(`   - ${field}`)
    })
  })
}

compareSchemas()
