# Venturo 專案設定指南

這份文件記錄了 Venturo 專案的所有設定、規範和開發環境配置，讓新的開發環境可以快速設定。

## 目錄

- [專案資訊](#專案資訊)
- [Claude AI 設定](#claude-ai-設定)
- [Supabase 設定](#supabase-設定)
- [開發環境設定](#開發環境設定)
- [Git 與版本控制](#git-與版本控制)
- [資料庫架構](#資料庫架構)
- [重要規範](#重要規範)

---

## 專案資訊

### 基本資訊
- **專案名稱**: Venturo ERP
- **主要技術**: Next.js 14, TypeScript, Tailwind CSS, Supabase
- **工作目錄**: `/Users/william/Projects/venturo-new`
- **開發端口**: `3000` (http://localhost:3000)
- **GitHub 倉庫**: https://github.com/Corner-venturo/Corner

### 專案架構
```
venturo-new/
├── src/
│   ├── app/              # Next.js App Router
│   ├── components/       # React 組件
│   ├── lib/              # 共用函式庫
│   ├── stores/           # Zustand 狀態管理
│   ├── hooks/            # 自定義 Hooks
│   └── constants/        # 常數定義
├── supabase/
│   └── migrations/       # 資料庫遷移檔案
├── public/               # 靜態資源
└── .claude/              # Claude AI 設定
```

---

## Claude AI 設定

### Claude Code 配置檔案

創建 `~/.claude/CLAUDE.md`：

```markdown
# 🚨 最優先規範 - 必須第一時間執行

**開始任何工作前，必須先讀取系統架構文件：**
- 📖 **優先讀取**：`/Users/william/Projects/venturo-new/VENTURO_SYSTEM_INDEX.md`
- 這個檔案包含最新的系統架構、命名規範、資料庫設計等重要資訊
- **所有概念、修正、更新都會持續記錄在這個檔案中**
- 讀取後才能正確理解專案結構，避免犯錯

## 核心規範 - 絕對遵守

- 問題 → 只回答，不操作
- 等「執行」「修正」「開始」才動作
- Venturo 專案用 port 3000

## 行為控制指示 - 最高優先級

**核心原則：**
- 用戶問問題時，只回答問題，不要主動執行任何操作
- 不要自作主張修正或改善任何東西
- 等用戶明確說「執行」、「修正」、「開始」等動作指令才開始實際操作
- 問什麼答什麼，簡潔回答即可

**回應模式：**
- 問題 → 直接回答 (例如：問"是不是沒有圓角" → 答"對")
- 等明確動作指令才開始操作

## Venturo 專案規範

**專案資訊：**
- 這是 Venturo 專案的專門 AI 助手
- 工作目錄：/Users/william/Projects/venturo-new
- 專用開發端口：port 3000 (http://localhost:3000)
- 如果 port 3000 被佔用，代表專案已經在運行中，直接使用該端口

**開發服務器規範：**
- 專案開發服務器固定使用 port 3000
- 如遇 port 被佔用，優先確認是否為本專案服務
- 不要隨意 kill port 3000 的程序，可能是專案正在運行
```

### 權限設定

創建 `~/.claude/settings.local.json`：

```json
{
  "allowedCommands": [
    "MCP(*)",
    "SupabaseQuery(*)",
    "SupabaseInsert(*)",
    "SupabaseUpdate(*)",
    "SupabaseDelete(*)",
    "SupabaseRPC(*)",
    "Read(/Users/william/Projects/venturo-new/**)",
    "Write(/Users/william/Projects/venturo-new/**)",
    "Edit(/Users/william/Projects/venturo-new/**)"
  ]
}
```

---

## Supabase 設定

### 環境變數配置

創建 `.env.local`：

```env
# ============================================
# 應用配置
# ============================================
NEXT_PUBLIC_APP_NAME=Venturo ERP
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# ============================================
# Supabase 配置
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://pfqvdacxowpgfamuvnsn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDgzMjAsImV4cCI6MjA3NDY4NDMyMH0.LIMG0qmHixTPcbdzJrh4h0yTp8mh3FlggeZ6Bi_NwtI
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTEwODMyMCwiZXhwIjoyMDc0Njg0MzIwfQ.kbJbdYHtOWudBGzV3Jv5OWzWQQZT4aBFFgfUczaVdIE

# ============================================
# 功能開關
# ============================================
# 啟用 Supabase 連線
NEXT_PUBLIC_ENABLE_SUPABASE=true

# 啟用除錯模式
NEXT_PUBLIC_DEBUG_MODE=false

# ============================================
# 開發環境設定
# ============================================
# 開發伺服器 Port
PORT=3000

# 是否啟用 React DevTools
NEXT_PUBLIC_ENABLE_DEVTOOLS=true
```

### Supabase MCP 配置

創建 `~/.claude/mcp_settings.json`：

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server",
        "https://pfqvdacxowpgfamuvnsn.supabase.co",
        "sb_secret_UTM20l4Tg4ioK4RZ3vmzlw_IvWYid-O"
      ]
    }
  }
}
```

### Supabase CLI 設定

創建 `supabase/config.toml`：

```toml
project_id = "pfqvdacxowpgfamuvnsn"

[api]
enabled = true
port = 54321
schemas = ["public", "storage", "graphql_public"]
extra_search_path = ["public", "extensions"]
max_rows = 1000

[db]
port = 54322
shadow_port = 54320
major_version = 15

[db.pooler]
enabled = false
port = 54329
pool_mode = "transaction"
default_pool_size = 20
max_client_conn = 100

[realtime]
enabled = true
ip_version = "IPv4"

[studio]
enabled = true
port = 54323
api_url = "http://127.0.0.1"

[inbucket]
enabled = true
port = 54324
smtp_port = 54325
pop3_port = 54326

[storage]
enabled = true
file_size_limit = "50MiB"

[auth]
enabled = true
site_url = "http://localhost:3000"
additional_redirect_urls = ["https://localhost:3000"]
jwt_expiry = 3600
enable_signup = true

[auth.email]
enable_signup = true
double_confirm_changes = true
enable_confirmations = false
```

### 資料庫初始化

執行 Supabase migrations：

```bash
# 方法 1: 使用 Supabase CLI (推薦)
supabase db push

# 方法 2: 使用自訂腳本
bash scripts/setup-supabase.sh
```

重要的 migration 檔案：
- `20251025134200_complete_workspace_schema.sql` - 工作空間架構
- `20251026030000_create_heroic_summon_schema.sql` - 英靈招喚系統
- `20251026040000_create_user_data_tables.sql` - 用戶資料表

---

## 開發環境設定

### 必要軟體安裝

```bash
# Node.js (v18 或以上)
node -v  # 確認版本

# npm 或 pnpm
npm -v
# 或
pnpm -v

# Git
git --version

# Supabase CLI
brew install supabase/tap/supabase
# 或
npm install -g supabase
```

### 專案安裝步驟

```bash
# 1. Clone 專案
git clone https://github.com/Corner-venturo/Corner.git venturo-new
cd venturo-new

# 2. 安裝依賴
npm install
# 或
pnpm install

# 3. 複製環境變數
cp .env.example .env.local
# 然後編輯 .env.local 填入 Supabase 憑證

# 4. 啟動開發伺服器
npm run dev
# 或
pnpm dev

# 5. 開啟瀏覽器
open http://localhost:3000
```

### 常用指令

```bash
# 開發模式
npm run dev

# 建置專案
npm run build

# 啟動生產環境
npm run start

# 程式碼檢查
npm run lint

# 類型檢查
npm run type-check

# 執行測試
npm run test

# 清理快取
rm -rf .next node_modules
npm install
```

---

## Git 與版本控制

### Git 設定

```bash
# 設定用戶資訊
git config user.name "Your Name"
git config user.email "your.email@example.com"

# 設定預設分支
git config init.defaultBranch main
```

### 提交規範

Commit message 格式：

```
<type>(<scope>): <subject>

<body>

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

Type 類型：
- `feat`: 新功能
- `fix`: 修復 bug
- `refactor`: 重構
- `docs`: 文件更新
- `style`: 格式調整
- `test`: 測試相關
- `chore`: 建置、工具相關

範例：
```bash
git commit -m "feat(workspace): add channel member list functionality

- Implement MemberSidebar component
- Add UUID validation for member API calls
- Fix layout positioning issues

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### 分支管理

```bash
# 主要分支
main          # 生產環境
develop       # 開發環境

# 功能分支命名
feature/xxx   # 新功能
fix/xxx       # 修復 bug
refactor/xxx  # 重構
```

---

## 資料庫架構

### 主要資料表

#### 1. workspaces (工作空間)
```sql
CREATE TABLE workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon text DEFAULT '🏢',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### 2. channels (頻道)
```sql
CREATE TABLE channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id),
  name text NOT NULL,
  type text DEFAULT 'public',
  description text,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);
```

#### 3. employees (員工)
```sql
CREATE TABLE employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text NOT NULL,
  email text UNIQUE,
  permissions text[],
  roles text[],
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### 4. messages (訊息)
```sql
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid REFERENCES channels(id),
  author_id uuid REFERENCES employees(id),
  content text NOT NULL,
  reactions jsonb DEFAULT '{}',
  attachments jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);
```

### 初始化資料

插入初始 workspace：

```sql
INSERT INTO workspaces (name, description, icon, is_active)
VALUES ('總部辦公室', 'Venturo 總部工作空間', '🏢', true);
```

---

## 重要規範

### 1. 權限系統

所有功能權限定義在 `src/lib/permissions.ts`：

```typescript
export const FEATURE_PERMISSIONS: PermissionConfig[] = [
  {
    id: 'admin',
    label: '系統管理員',
    category: '全部',
    routes: ['*'],
    description: '擁有系統所有權限'
  },
  {
    id: 'workspace',
    label: '工作空間',
    category: '全部',
    routes: ['/workspace'],
    description: '個人工作空間'
  },
  // ... 其他權限
];
```

### 2. 狀態管理

使用 Zustand 進行狀態管理：

```typescript
// Store 定義範例
import { create } from 'zustand';

interface MyState {
  data: any[];
  loading: boolean;
  loadData: () => Promise<void>;
}

export const useMyStore = create<MyState>((set) => ({
  data: [],
  loading: false,
  loadData: async () => {
    set({ loading: true });
    // ... 載入資料
    set({ loading: false });
  }
}));
```

### 3. 離線優先策略

系統採用離線優先策略：

1. 先從 IndexedDB 載入快取資料（即時顯示）
2. 背景同步 Supabase 資料
3. 更新完成後替換快取

```typescript
// 離線優先範例
const loadData = async () => {
  // 1. 快速載入快取
  const cached = await localDB.getAll('table');
  set({ data: cached, loading: false });

  // 2. 背景同步
  if (navigator.onLine) {
    const { data } = await supabase.from('table').select('*');
    set({ data });
    // 更新快取
    await localDB.putAll('table', data);
  }
};
```

### 4. 命名規範

- **檔案命名**: `kebab-case.tsx` (小寫，破折號分隔)
- **組件命名**: `PascalCase` (大駝峰)
- **函數命名**: `camelCase` (小駝峰)
- **常數命名**: `UPPER_SNAKE_CASE` (大寫，底線分隔)
- **類型命名**: `PascalCase` (大駝峰)

範例：
```typescript
// 檔案: user-profile-card.tsx
export function UserProfileCard() { ... }  // 組件
const loadUserData = () => { ... }         // 函數
const MAX_RETRY_COUNT = 3;                 // 常數
interface UserProfile { ... }              // 類型
```

### 5. 主題與樣式

使用 Morandi 色系：

```typescript
// 主要顏色
morandi-primary    // 主要文字
morandi-secondary  // 次要文字
morandi-gold       // 強調色（金色）
morandi-container  // 容器背景

// 使用範例
<div className="text-morandi-primary bg-morandi-container">
  <button className="bg-morandi-gold hover:bg-morandi-gold-hover">
    按鈕
  </button>
</div>
```

---

## 疑難排解

### 常見問題

#### 1. Port 3000 被佔用

```bash
# 查看佔用端口的程序
lsof -ti:3000

# 終止程序
lsof -ti:3000 | xargs kill -9

# 或使用其他端口
PORT=3001 npm run dev
```

#### 2. Supabase 連線失敗

檢查：
1. `.env.local` 是否正確設定
2. `NEXT_PUBLIC_ENABLE_SUPABASE=true` 是否啟用
3. Supabase URL 和 Key 是否正確

#### 3. 資料庫 Migration 失敗

```bash
# 重置資料庫
supabase db reset

# 重新執行 migrations
supabase db push

# 或手動執行 SQL
psql postgresql://[connection-string] < migration.sql
```

#### 4. IndexedDB 快取問題

```bash
# 在瀏覽器 Console 執行
indexedDB.deleteDatabase('VenturoOfflineDB');
location.reload();
```

---

## 聯絡資訊

- **專案維護者**: William
- **GitHub**: https://github.com/Corner-venturo/Corner
- **Supabase 專案**: https://app.supabase.com/project/pfqvdacxowpgfamuvnsn

---

## 版本記錄

- **2025-10-27**: 初始版本建立
  - 工作空間佈局修正
  - 權限系統重構
  - 新增顯化魔法和英靈招喚功能

---

## 附錄

### A. 實用腳本

#### 快速重置開發環境
```bash
#!/bin/bash
# scripts/reset-dev.sh

echo "🔄 重置開發環境..."

# 清理
rm -rf .next node_modules package-lock.json

# 重新安裝
npm install

# 啟動
npm run dev
```

#### 備份資料庫
```bash
#!/bin/bash
# scripts/backup-db.sh

supabase db dump -f backup-$(date +%Y%m%d).sql
echo "✅ 資料庫已備份"
```

### B. VSCode 推薦設定

創建 `.vscode/settings.json`：

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "files.associations": {
    "*.css": "tailwindcss"
  }
}
```

### C. 推薦 VSCode 擴充功能

- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript and JavaScript Language Features
- GitLens
- Supabase

---

**最後更新**: 2025-10-27
**文件版本**: 1.0.0
