# Supabase RLS (Row Level Security) 管理规范

> **专案类型**: 内部管理系统（Venturo）
> **最后更新**: 2025-10-29

---

## 🎯 核心原则

**Venturo 是内部管理系统，所有已认证用户都应该能访问所有数据。**

因此：
- ✅ **禁用所有表的 RLS**
- ❌ 不需要配置复杂的 RLS 策略
- ✅ 使用 Supabase 的身份验证机制控制访问

---

## 📋 当前 RLS 状态

所有表的 RLS 已禁用（见 migration: `20251029131000_disable_rls_for_internal_system.sql`）

### 已禁用 RLS 的表

```sql
-- 核心业务表
suppliers, itineraries, tours, quotes, orders, customers, employees

-- 财务表
payment_requests, disbursement_orders, receipt_orders

-- 工作流表
visas, todos, contracts, calendar_events

-- 辅助数据表
countries, regions, cities, quote_items, tour_addons, members

-- 协作功能表
workspaces, channels, channel_groups, messages, bulletins, workspace_items, templates

-- 其他
advance_lists, shared_order_lists
```

---

## 🔧 新增表格时的标准流程

### 1. 创建表格时立即禁用 RLS

```sql
-- 范例：创建新表
CREATE TABLE public.new_table (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 立即禁用 RLS
ALTER TABLE public.new_table DISABLE ROW LEVEL SECURITY;
```

### 2. Migration 模板

在 `supabase/migrations/` 目录下创建新 migration：

```sql
-- Migration: [描述]
-- Date: YYYY-MM-DD

BEGIN;

-- 1. 创建表格
CREATE TABLE public.your_table (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- 其他字段...
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. 禁用 RLS（重要！）
ALTER TABLE public.your_table DISABLE ROW LEVEL SECURITY;

-- 3. 添加注释
COMMENT ON TABLE public.your_table IS 'Your table description';

COMMIT;
```

---

## ⚠️ 常见错误与解决方案

### 错误 1: `new row violates row-level security policy`

**原因**: 表格启用了 RLS，但没有配置策略

**解决方案**:
```sql
ALTER TABLE public.table_name DISABLE ROW LEVEL SECURITY;
```

### 错误 2: `Could not find the 'column_name' column in the schema cache`

**原因**: 表格缺少字段

**解决方案**:
```sql
ALTER TABLE public.table_name
ADD COLUMN IF NOT EXISTS column_name data_type;
```

### 错误 3: 同步失败 (401 Unauthorized)

**原因**: RLS 阻止了写入操作

**解决方案**:
```sql
ALTER TABLE public.table_name DISABLE ROW LEVEL SECURITY;
```

---

## 🚀 执行 Migration 的标准流程

### 1. 创建 Migration 文件

```bash
# 文件命名格式: YYYYMMDDHHMMSS_description.sql
supabase/migrations/20251029000000_your_description.sql
```

### 2. 执行 Migration

```bash
echo "Y" | SUPABASE_ACCESS_TOKEN=sbp_xxx npx supabase db push
```

### 3. 验证结果

```bash
# 检查表格是否存在
SUPABASE_ACCESS_TOKEN=sbp_xxx \
  npx supabase gen types typescript --project-id pfqvdacxowpgfamuvnsn \
  | grep -A 5 "table_name"
```

---

## 📊 RLS 状态检查 SQL

如果需要检查哪些表启用了 RLS：

```sql
-- 查看所有启用 RLS 的表
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = true;

-- 查看特定表的 RLS 策略
SELECT * FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'your_table_name';
```

---

## 🔒 安全考量

### 为什么禁用 RLS 是安全的？

1. **内部系统**: 只有公司员工能访问
2. **身份验证**: Supabase Auth 已经控制了登入
3. **网络隔离**: 生产环境有防火墙保护
4. **审计日志**: 所有操作都有 `created_at`、`updated_at` 记录

### 如果未来需要更细粒度的权限控制

**不要使用 RLS**，而是在应用层实现：

```typescript
// ✅ 好的做法：应用层权限控制
if (user.role !== 'admin') {
  throw new Error('Unauthorized');
}

// ❌ 避免：Supabase RLS
// 原因：增加复杂度，不适合内部系统
```

---

## 📝 检查清单

每次创建新表或遇到同步问题时，检查以下项目：

- [ ] 表格是否已禁用 RLS？
- [ ] 所有必需字段是否已创建？
- [ ] Migration 是否已成功执行？
- [ ] 前端同步是否正常工作？

---

## 🛠️ 快速修复命令

如果遇到 RLS 相关错误，执行以下 SQL：

```sql
BEGIN;

-- 禁用特定表的 RLS
ALTER TABLE public.your_table DISABLE ROW LEVEL SECURITY;

-- 删除所有 RLS 策略
DROP POLICY IF EXISTS policy_name ON public.your_table;

COMMIT;
```

---

## 📚 相关文档

- Supabase 工作流程: `docs/reports/SUPABASE_WORKFLOW.md`
- 数据库 Migration 记录: `.claude/CLAUDE.md`（数据库操作规范部分）

---

**记住**:
- ❌ 不要启用 RLS
- ❌ 不要创建 RLS 策略
- ✅ 创建表格时立即禁用 RLS
- ✅ 使用应用层权限控制
