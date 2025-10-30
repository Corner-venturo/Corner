#!/usr/bin/env node

/**
 * 完整 Store 測試腳本
 * 測試所有核心 Store 的 CRUD 操作
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 載入環境變數
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少 Supabase 環境變數')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// 測試統計
const stats = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
}

function logTest(name, status, message = '') {
  stats.total++
  const icon = status === 'pass' ? '✅' : status === 'skip' ? '⏭️' : '❌'
  console.log(`  ${icon} ${name}`)
  if (message) console.log(`     ${message}`)
  if (status === 'pass') stats.passed++
  if (status === 'fail') stats.failed++
  if (status === 'skip') stats.skipped++
}

// ============================================
// Members Store 測試
// ============================================

async function testMembersStore() {
  console.log('\n🧪 Members Store 測試')

  const timestamp = Date.now()
  let memberId = null

  try {
    // 1. Create
    const memberData = {
      id: `test-member-${timestamp}`,
      name: '測試團員',
      gender: '男',
      birthday: '1990-01-01',
      phone: '0912345678',
      email: 'test@example.com',
      passport_number: 'A12345678',
      passport_expiry_date: '2030-12-31',
      id_number: 'A123456789',
      emergency_contact: '緊急聯絡人',
      emergency_phone: '0987654321',
      dietary_restrictions: '無',
      special_needs: '無',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data: member, error: createError } = await supabase
      .from('members')
      .insert([memberData])
      .select()
      .single()

    if (createError) throw createError
    memberId = member.id
    logTest('Create Member', 'pass')

    // 2. Read
    const { data: readMember, error: readError } = await supabase
      .from('members')
      .select('*')
      .eq('id', memberId)
      .single()

    if (readError) throw readError
    if (readMember.name !== '測試團員') throw new Error('資料不一致')
    logTest('Read Member', 'pass')

    // 3. Update
    const { error: updateError } = await supabase
      .from('members')
      .update({ phone: '0999999999' })
      .eq('id', memberId)

    if (updateError) throw updateError
    logTest('Update Member', 'pass')

    // 4. Delete
    const { error: deleteError } = await supabase.from('members').delete().eq('id', memberId)

    if (deleteError) throw deleteError
    logTest('Delete Member', 'pass')
  } catch (error) {
    logTest('Members Store', 'fail', error.message)
    // 清理
    if (memberId) {
      await supabase.from('members').delete().eq('id', memberId)
    }
  }
}

// ============================================
// Customers Store 測試
// ============================================

async function testCustomersStore() {
  console.log('\n🧪 Customers Store 測試')

  const timestamp = Date.now()
  let customerId = null

  try {
    // 1. Create
    const customerData = {
      id: `test-customer-${timestamp}`,
      code: `C${timestamp.toString().slice(-6)}`,
      name: '測試客戶',
      phone: '0912345678',
      email: 'customer@example.com',
      address: '測試地址',
      id_number: 'A123456789',
      birthday: '1980-01-01',
      contact_person: '聯絡人',
      contact_phone: '0987654321',
      notes: '測試備註',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data: customer, error: createError } = await supabase
      .from('customers')
      .insert([customerData])
      .select()
      .single()

    if (createError) throw createError
    customerId = customer.id
    logTest('Create Customer', 'pass')

    // 2. Read
    const { data: readCustomer, error: readError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single()

    if (readError) throw readError
    if (readCustomer.name !== '測試客戶') throw new Error('資料不一致')
    logTest('Read Customer', 'pass')

    // 3. Update
    const { error: updateError } = await supabase
      .from('customers')
      .update({ phone: '0999999999' })
      .eq('id', customerId)

    if (updateError) throw updateError
    logTest('Update Customer', 'pass')

    // 4. Delete
    const { error: deleteError } = await supabase.from('customers').delete().eq('id', customerId)

    if (deleteError) throw deleteError
    logTest('Delete Customer', 'pass')
  } catch (error) {
    logTest('Customers Store', 'fail', error.message)
    // 清理
    if (customerId) {
      await supabase.from('customers').delete().eq('id', customerId)
    }
  }
}

// ============================================
// Employees Store 測試
// ============================================

async function testEmployeesStore() {
  console.log('\n🧪 Employees Store 測試')

  const timestamp = Date.now()
  let employeeId = null

  try {
    // 1. Create
    const employeeData = {
      id: `test-employee-${timestamp}`,
      employee_number: `E${timestamp.toString().slice(-6)}`,
      name: '測試員工',
      email: 'employee@example.com',
      phone: '0912345678',
      department: '業務部',
      position: '業務專員',
      hire_date: '2024-01-01',
      status: '在職',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data: employee, error: createError } = await supabase
      .from('employees')
      .insert([employeeData])
      .select()
      .single()

    if (createError) throw createError
    employeeId = employee.id
    logTest('Create Employee', 'pass')

    // 2. Read
    const { data: readEmployee, error: readError } = await supabase
      .from('employees')
      .select('*')
      .eq('id', employeeId)
      .single()

    if (readError) throw readError
    if (readEmployee.name !== '測試員工') throw new Error('資料不一致')
    logTest('Read Employee', 'pass')

    // 3. Update
    const { error: updateError } = await supabase
      .from('employees')
      .update({ position: '資深業務專員' })
      .eq('id', employeeId)

    if (updateError) throw updateError
    logTest('Update Employee', 'pass')

    // 4. Delete
    const { error: deleteError } = await supabase.from('employees').delete().eq('id', employeeId)

    if (deleteError) throw deleteError
    logTest('Delete Employee', 'pass')
  } catch (error) {
    logTest('Employees Store', 'fail', error.message)
    // 清理
    if (employeeId) {
      await supabase.from('employees').delete().eq('id', employeeId)
    }
  }
}

// ============================================
// Suppliers Store 測試
// ============================================

async function testSuppliersStore() {
  console.log('\n🧪 Suppliers Store 測試')

  const timestamp = Date.now()
  let supplierId = null

  try {
    // 1. Create
    const supplierData = {
      id: `test-supplier-${timestamp}`,
      code: `S${timestamp.toString().slice(-6)}`,
      name: '測試供應商',
      type: 'hotel',
      contact_person: '聯絡人',
      phone: '02-12345678',
      email: 'supplier@example.com',
      address: '測試地址',
      tax_id: '12345678',
      bank_account: '1234567890',
      payment_terms: '月結30天',
      notes: '測試備註',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data: supplier, error: createError } = await supabase
      .from('suppliers')
      .insert([supplierData])
      .select()
      .single()

    if (createError) throw createError
    supplierId = supplier.id
    logTest('Create Supplier', 'pass')

    // 2. Read
    const { data: readSupplier, error: readError } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', supplierId)
      .single()

    if (readError) throw readError
    if (readSupplier.name !== '測試供應商') throw new Error('資料不一致')
    logTest('Read Supplier', 'pass')

    // 3. Update
    const { error: updateError } = await supabase
      .from('suppliers')
      .update({ phone: '02-87654321' })
      .eq('id', supplierId)

    if (updateError) throw updateError
    logTest('Update Supplier', 'pass')

    // 4. Delete
    const { error: deleteError } = await supabase.from('suppliers').delete().eq('id', supplierId)

    if (deleteError) throw deleteError
    logTest('Delete Supplier', 'pass')
  } catch (error) {
    logTest('Suppliers Store', 'fail', error.message)
    // 清理
    if (supplierId) {
      await supabase.from('suppliers').delete().eq('id', supplierId)
    }
  }
}

// ============================================
// 主程式
// ============================================

async function main() {
  console.log('='.repeat(60))
  console.log('🧪 完整 Store 測試')
  console.log('='.repeat(60))

  await testMembersStore()
  await testCustomersStore()
  await testEmployeesStore()
  await testSuppliersStore()

  console.log('\n' + '='.repeat(60))
  console.log('📊 測試統計')
  console.log('='.repeat(60))
  console.log(`總測試數: ${stats.total}`)
  console.log(`✅ 通過: ${stats.passed}`)
  console.log(`❌ 失敗: ${stats.failed}`)
  console.log(`⏭️  跳過: ${stats.skipped}`)

  const successRate = ((stats.passed / stats.total) * 100).toFixed(1)
  console.log(`成功率: ${successRate}%`)
  console.log('='.repeat(60))

  if (stats.failed > 0) {
    process.exit(1)
  }
}

main().catch(console.error)
