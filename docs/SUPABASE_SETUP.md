# Supabase 設定指南

## 🚀 快速開始

### 1. 建立 Supabase 專案

1. 前往 [Supabase](https://supabase.com)
2. 建立新專案
3. 記下以下資訊：
   - Project URL
   - Anon Key
   - Service Role Key (後端使用)

### 2. 環境變數設定

```env
# .env.local (開發環境)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx

# 模式切換
NEXT_PUBLIC_AUTH_MODE=hybrid  # local | supabase | hybrid
```

### 3. 資料庫架構

執行以下 SQL 建立必要的資料表：

```sql
-- 啟用 UUID 擴展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 員工資料表
CREATE TABLE employees (
  -- 基本資訊
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_number VARCHAR(50) UNIQUE NOT NULL,
  chinese_name VARCHAR(100) NOT NULL,
  english_name VARCHAR(100) NOT NULL,
  password_hash TEXT NOT NULL,

  -- 個人資訊 (JSONB 格式)
  personal_info JSONB DEFAULT '{}'::JSONB,
  job_info JSONB DEFAULT '{}'::JSONB,
  salary_info JSONB DEFAULT '{}'::JSONB,

  -- 權限和狀態
  permissions TEXT[] DEFAULT ARRAY[]::TEXT[],
  status VARCHAR(20) DEFAULT 'active',

  -- 出勤資訊
  attendance JSONB DEFAULT '{"leaveRecords": [], "overtimeRecords": []}'::JSONB,

  -- 合約資訊
  contracts JSONB DEFAULT '[]'::JSONB,

  -- 其他
  avatar TEXT,

  -- 時間戳記
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,

  -- 索引
  CONSTRAINT valid_status CHECK (status IN ('active', 'probation', 'leave', 'terminated'))
);

-- 建立索引
CREATE INDEX idx_employee_number ON employees(employee_number);
CREATE INDEX idx_employee_status ON employees(status);
CREATE INDEX idx_employee_deleted ON employees(deleted_at);

-- 更新時間觸發器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security)
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- 管理員可以查看所有員工
CREATE POLICY "Admins can do everything" ON employees
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE id = auth.uid()::UUID
      AND 'admin' = ANY(permissions)
    )
  );

-- 員工只能查看自己的資料
CREATE POLICY "Employees can view own data" ON employees
  FOR SELECT USING (
    auth.uid()::UUID = id
  );

-- 員工可以更新自己的部分資料
CREATE POLICY "Employees can update own profile" ON employees
  FOR UPDATE USING (
    auth.uid()::UUID = id
  )
  WITH CHECK (
    auth.uid()::UUID = id
    -- 不能修改權限和薪資
    AND permissions = OLD.permissions
    AND salary_info = OLD.salary_info
  );
```

### 4. 初始資料

```sql
-- 建立預設管理員帳號
-- 密碼: admin123 (需要使用 bcrypt 加密)
INSERT INTO employees (
  employee_number,
  chinese_name,
  english_name,
  password_hash,
  permissions,
  job_info
) VALUES (
  'admin',
  '系統管理員',
  'Administrator',
  '$2a$10$YourBcryptHashHere', -- 使用 bcrypt 加密的 'admin123'
  ARRAY['admin'],
  '{"department": "管理部", "position": "系統管理員"}'::JSONB
);
```

### 5. Supabase Client 設定

```typescript
// src/lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'x-application-name': 'venturo',
    },
  },
})
```

### 6. 認證流程整合

```typescript
// 混合模式示例
async function hybridLogin(email: string, password: string) {
  try {
    if (navigator.onLine) {
      // 線上：使用 Supabase
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('employee_number', email)
        .single()

      if (data) {
        // 驗證密碼
        const isValid = await bcrypt.compare(password, data.password_hash)

        if (isValid) {
          // 同步到本地
          await localDB.put('employees', data)
          // 建立角色卡
          createProfileCard(data)
          return { success: true }
        }
      }
    } else {
      // 離線：使用本地資料
      return await offlineLogin(email, password)
    }
  } catch (error) {
    console.error('Login error:', error)
    // 降級到離線模式
    return await offlineLogin(email, password)
  }
}
```

## 📊 資料同步策略

### 線上 → 離線

```typescript
// 背景同步
setInterval(
  async () => {
    if (navigator.onLine) {
      const { data } = await supabase
        .from('employees')
        .select('*')
        .order('updated_at', { ascending: false })

      for (const emp of data || []) {
        await localDB.put('employees', emp)
      }
    }
  },
  5 * 60 * 1000
) // 每 5 分鐘
```

### 離線 → 線上

```typescript
// 操作隊列
const syncQueue = []

// 離線時加入隊列
function queueOperation(op: Operation) {
  syncQueue.push(op)
  saveQueueToStorage(syncQueue)
}

// 恢復線上時執行
window.addEventListener('online', async () => {
  for (const op of syncQueue) {
    await executeOperation(op)
  }
  syncQueue.length = 0
})
```

## 🔒 安全注意事項

1. **永遠不要在前端暴露 Service Role Key**
2. **使用 RLS 保護資料**
3. **敏感操作使用 Server Actions**
4. **定期更新密碼**
5. **實施 2FA（可選）**

## 🧪 測試檢查清單

- [ ] 線上登入
- [ ] 離線登入
- [ ] 角色卡建立
- [ ] PIN 碼設定
- [ ] 自動同步
- [ ] 離線操作隊列
- [ ] 權限檢查
- [ ] 多裝置登入

## 📚 參考資源

- [Supabase Docs](https://supabase.com/docs)
- [Next.js + Supabase](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [RLS Best Practices](https://supabase.com/docs/guides/auth/row-level-security)
