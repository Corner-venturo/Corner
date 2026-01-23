# Logan AI 使用指南

> **最後更新**: 2026-01-22
> **專案**: Venturo ERP 內部 AI 助理
> **模型**: Ollama (qwen2.5:7b)

---

## 簡介

羅根（Logan）是 Venturo 旅行社的內部 AI 助理，整合於 ERP 工作頻道聊天系統中。員工可以透過與羅根對話來：

- 詢問系統操作問題
- 查詢公司流程與規範
- 學習 Venturo 的業務知識
- 教導羅根新知識

---

## 系統架構

```
┌─────────────────────────────────────────────────────────────┐
│                     使用者介面層                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Channel Chat UI (工作頻道聊天室)                    │   │
│  │  → 與 VENTURO 機器人私訊即可觸發 Logan AI            │   │
│  └─────────────────────────────────────────────────────┘   │
│                            ↓                                │
├─────────────────────────────────────────────────────────────┤
│                       Hook 層                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  useBotResponse.ts                                   │   │
│  │  → 判斷是否為機器人 DM，自動呼叫 Logan API           │   │
│  └─────────────────────────────────────────────────────┘   │
│                            ↓                                │
├─────────────────────────────────────────────────────────────┤
│                       API 層                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  /api/logan/chat                                     │   │
│  │  → GET: 檢查 Logan 狀態                              │   │
│  │  → POST: 對話 (action: 'chat')                       │   │
│  │  → POST: 教學 (action: 'teach')                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                            ↓                                │
├─────────────────────────────────────────────────────────────┤
│                      服務層                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  logan-service.ts                                    │   │
│  │  → chatWithLogan(): 對話邏輯                         │   │
│  │  → teachLogan(): 教學邏輯                            │   │
│  │  → getRelevantMemories(): 記憶檢索                   │   │
│  │  → saveConversation(): 對話儲存                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                            ↓                                │
├─────────────────────────────────────────────────────────────┤
│                      連接器層                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ollama.ts                                           │   │
│  │  → chat(): 非串流對話                                │   │
│  │  → chatStream(): 串流對話                            │   │
│  │  → checkOllamaStatus(): 健康檢查                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                            ↓                                │
├─────────────────────────────────────────────────────────────┤
│                      外部服務                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Ollama (localhost:11434)                            │   │
│  │  → 模型: qwen2.5:7b                                  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 核心檔案

| 檔案 | 位置 | 說明 |
|------|------|------|
| **logan-service.ts** | `src/lib/logan/` | 核心服務邏輯 |
| **ollama.ts** | `src/lib/logan/` | Ollama 連接器 |
| **index.ts** | `src/lib/logan/` | 模組匯出入口 |
| **base.ts** | `src/lib/logan/providers/` | AI Provider 介面 |
| **useLogan.ts** | `src/hooks/` | React Hook |
| **route.ts** | `src/app/api/logan/chat/` | API 端點 |
| **useBotResponse.ts** | `src/components/workspace/channel-chat/hooks/` | 聊天室整合 |

---

## 資料表

### ai_memories（知識記憶庫）

```sql
CREATE TABLE ai_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  category TEXT NOT NULL,          -- 記憶分類
  title TEXT,                       -- 標題
  content TEXT NOT NULL,            -- 內容
  tags TEXT[] DEFAULT '{}',         -- 標籤
  importance INTEGER DEFAULT 5,     -- 重要性 (1-10)
  source TEXT,                      -- 來源 (manual/conversation/system)
  created_by UUID,                  -- 建立者
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### ai_conversations（對話歷史）

```sql
CREATE TABLE ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  employee_id UUID NOT NULL,        -- 對話的員工
  messages JSONB DEFAULT '[]',      -- 對話訊息陣列
  status TEXT DEFAULT 'active',     -- active/archived
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### employees (Logan 記錄)

```sql
-- Logan 在員工表的記錄
id: '00000000-0000-0000-0000-000000000002'
employee_number: 'LOGAN'
display_name: 'Logan AI'
chinese_name: '羅根'
english_name: 'Logan'
email: 'logan@venturo.ai'
employee_type: 'bot'
roles: ['bot']
```

---

## 記憶分類 (Memory Categories)

| 分類 | 說明 | 範例 |
|------|------|------|
| `company_culture` | 公司文化 | 「我們重視團隊合作」 |
| `philosophy` | 理念與價值觀 | 「客戶滿意是最高原則」 |
| `journey` | 心路歷程 | 「公司創立的故事」 |
| `why_we_do_this` | 為什麼這樣做 | 「為什麼選擇這個技術架構」 |
| `how_to` | 怎麼做某件事 | 「如何開一個新團」 |
| `where_is` | 東西在哪裡 | 「護照在哪裡保管」 |
| `workflow` | 流程順序 | 「訂單處理流程」 |
| `business_rule` | 業務規則 | 「取消政策」 |
| `term_definition` | 名詞解釋 | 「什麼是 PNR」 |
| `tech_decision` | 技術決策 | 「為什麼用 Supabase」 |
| `lesson_learned` | 踩過的坑 | 「之前遇過的問題」 |
| `conversation` | 重要對話 | 「客戶的重要反饋」 |
| `dont_do` | 不要做的事 | 「絕對不能做的事」 |
| `personality` | 人格特質 | 「Logan 的回答風格」 |

---

## API 使用方式

### GET /api/logan/chat - 檢查狀態

```typescript
const response = await fetch('/api/logan/chat')
const { success, available, model } = await response.json()
// { success: true, available: true, model: 'qwen2.5:7b' }
```

### POST /api/logan/chat - 對話

```typescript
const response = await fetch('/api/logan/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'chat',
    message: '請問如何開一個新團？'
  })
})
const { success, message, conversationId, error } = await response.json()
// { success: true, message: '開新團的步驟是...', conversationId: 'uuid' }
```

### POST /api/logan/chat - 教學

```typescript
const response = await fetch('/api/logan/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'teach',
    title: '取消政策',
    content: '出發前 30 天取消，收取 10% 手續費',
    category: 'business_rule',
    tags: ['取消', '退款', '政策'],
    importance: 8
  })
})
const { success, memoryId, error } = await response.json()
// { success: true, memoryId: 'uuid' }
```

---

## React Hook 使用方式

### useLogan Hook

```tsx
import { useLogan } from '@/hooks/useLogan'

function MyComponent() {
  const {
    messages,      // 對話訊息陣列
    isLoading,     // 是否載入中
    error,         // 錯誤訊息
    isAvailable,   // Logan 是否可用
    model,         // 使用的模型
    sendMessage,   // 發送訊息
    teach,         // 教導新知識
    clearMessages  // 清除對話
  } = useLogan()

  const handleSend = async () => {
    await sendMessage('如何開新團？')
  }

  const handleTeach = async () => {
    await teach('取消政策', '出發前 30 天取消...', {
      type: 'procedure',
      tags: ['取消', '退款'],
      importance: 8
    })
  }

  return (
    <div>
      {messages.map((msg, i) => (
        <div key={i} className={msg.role}>
          {msg.content}
        </div>
      ))}
      {isLoading && <div>思考中...</div>}
      {error && <div className="error">{error}</div>}
    </div>
  )
}
```

---

## 環境設定

### 環境變數

```bash
# .env.local
OLLAMA_URL=http://localhost:11434   # Ollama 服務位址（預設）
OLLAMA_MODEL=qwen2.5:7b             # 使用的模型（預設）
```

### 啟動 Ollama

```bash
# 安裝 Ollama (macOS)
brew install ollama

# 啟動服務
ollama serve

# 下載模型
ollama pull qwen2.5:7b

# 檢查狀態
curl http://localhost:11434/api/tags
```

---

## 初始化知識庫

羅根的初始知識需要透過種子腳本寫入資料庫：

```bash
# 執行種子腳本
cd /Users/williamchien/Projects/venturo-erp
npx tsx scripts/seed-logan-memories.ts
```

### 初始知識內容

種子腳本會寫入以下知識：

| 分類 | 內容 |
|------|------|
| **公司理念** | 核心願景、三大核心假設、角色模型 |
| **技術架構** | ERP 權力中心、雙平台架構 |
| **業務流程** | 團為中心架構、價值飛輪、提案到開團流程 |
| **系統操作** | 開報價、加成員、收款、簽證流程 |
| **文件位置** | THESIS、VISION、特洛伊計畫、SITEMAP、CLAUDE.md、docs/ |

### 公司核心文件

羅根知道這些重要文件的位置：

| 文件 | 位置 | 說明 |
|------|------|------|
| **VENTURO_THESIS.md** | `/Projects/` | 九章產業論文（核心理念） |
| **VENTURO_VISION.md** | `/Projects/venturo-erp/.claude/` | 雙平台架構願景 |
| **特洛伊計畫.md** | `/Projects/` | 完整版商業計劃 |
| **SITEMAP.md** | `/Projects/` | 專案網站地圖 |
| **CLAUDE.md** | `/Projects/venturo-erp/.claude/` | AI 開發規範 |
| **docs/** | `/Projects/venturo-erp/docs/` | 開發文檔目錄 |

---

## 羅根的人設

羅根的系統提示詞定義了他的性格與能力：

### 性格

- 專業、有溫度、耐心
- 說話簡潔但不冷漠
- 用繁體中文回答
- 不會為了推薦而推薦，會考慮實際需求

### 能力

1. 回答公司系統使用問題（ERP 操作流程）
2. 協助查詢團、訂單、客戶等資訊
3. 提供旅遊行程建議（根據公司經驗）
4. 記住與員工的對話，學習公司文化

### 內建知識

- 開報價單前要先開團
- 訂單要綁定團才能加成員
- 收款要先有訂單
- 簽證流程：收護照 → 送件 → 取件 → 發還

### 回答規則

- 如果不確定，說「讓我確認一下」
- 如果是系統問題，引導到正確的頁面
- 如果被問到敏感資訊，禮貌拒絕
- 保持專業但友善的語氣

---

## 權限控制

### 對話權限

所有員工都可以與 Logan 對話，詢問問題。

### 教學權限

| 帳號 | 可以對話 | 可以教學 |
|------|---------|---------|
| **威廉 (William)** | ✅ | ✅ |
| 其他員工 | ✅ | ❌ |

**為什麼限制教學權限？**

- 確保知識庫的**一致性**與**準確性**
- 避免錯誤或矛盾的知識被寫入
- 知識管理需要統一把關

**未來規劃**

可考慮開放給特定角色（如部門主管）有限度的教學權限，但需要審核機制。

---

## 擴充 AI Provider

Logan 設計了 Provider 介面，可以擴充使用其他 AI 模型：

### AIProvider 介面

```typescript
// src/lib/logan/providers/base.ts
export interface AIProvider {
  readonly name: string
  chat(messages: Message[], options?: ChatOptions): Promise<ChatResponse>
  healthCheck(): Promise<boolean>
}

export interface AIProviderConfig {
  provider: 'ollama' | 'claude' | 'openai'
  model: string
  baseUrl?: string
  apiKey?: string
  temperature?: number
}
```

### 新增 Provider 步驟

1. 在 `src/lib/logan/providers/` 建立新的 Provider 檔案
2. 實作 `AIProvider` 介面
3. 在 `logan-service.ts` 中註冊新 Provider
4. 設定環境變數

---

## 自動知識同步

### 每日同步機制

Logan 會自動學習資料庫中新增的景點和餐廳資料：

```
┌────────────────────────────────────────────────────────┐
│  Vercel Cron Job (每天 10:00 台灣時間)                  │
│  /api/cron/sync-logan-knowledge                        │
├────────────────────────────────────────────────────────┤
│  1. 查詢過去 24 小時新增的：                            │
│     - attractions（景點）                               │
│     - restaurants（餐廳）                               │
│     - michelin_restaurants（米其林餐廳）                │
│                                                        │
│  2. 格式化為知識摘要                                    │
│                                                        │
│  3. 寫入 ai_memories 表                                │
│     category: 'poi_data'                               │
│     source: 'system_sync'                              │
└────────────────────────────────────────────────────────┘
```

### 同步內容範例

```
景點：清水寺 (Kiyomizu-dera)
位於日本京都。類型：寺廟。地址：1-294 Kiyomizu, Higashiyama-ku。
門票：400 日圓。建議停留：90 分鐘。
簡介：京都最著名的寺廟之一，以懸空的木造舞台聞名。

米其林餐廳：祇園丸山
米其林 2 星。位於日本京都。料理類型：懷石料理。
價位：高級。晚餐約 30000 元。招牌菜：季節懷石。
可容納團體：8 人。
```

### 手動觸發同步

```bash
# 本地測試
curl http://localhost:3000/api/cron/sync-logan-knowledge

# 生產環境
curl https://your-domain.vercel.app/api/cron/sync-logan-knowledge
```

### Vercel Cron 設定

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/sync-logan-knowledge",
      "schedule": "0 2 * * *"  // UTC 02:00 = 台灣 10:00
    }
  ]
}
```

---

## 待開發功能

| 功能 | 優先級 | 說明 |
|------|--------|------|
| 向量搜尋 | P1 | 使用 embedding 進行記憶檢索 |
| 串流回應 | P2 | 即時顯示 AI 回應 |
| 多模型支援 | P2 | 支援 Claude、OpenAI |
| 管理介面 | P3 | 管理記憶庫的 UI |
| ~~自動學習~~ | ✅ 已完成 | 每日同步景點/餐廳資料 |

---

## 相關文檔

- [SITEMAP.md](/Users/williamchien/Projects/SITEMAP.md) - 專案網站地圖
- [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md) - 開發指南
- [SUPABASE_GUIDE.md](SUPABASE_GUIDE.md) - 資料庫操作指南

---

**建立日期**: 2026-01-22
