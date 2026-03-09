# Venturo 會議室設定指南

## 系統架構

```
Tailscale 網路 (或公司內網)
├─ William 的 OpenClaw → 100.89.92.46:3067 (悠月 🌙)
├─ Carson 的 OpenClaw → 100.x.x.x:3067 (Carson AI 💼)
├─ 會計的 OpenClaw   → 100.x.x.x:3067 (會計 AI 💰)
└─ 助理的 OpenClaw   → 100.x.x.x:3067 (助理 AI 📋)

Venturo ERP 會議室 (http://localhost:3000/meeting)
    ↓ HTTP API
所有 OpenClaw (直接通訊，不需要中轉)
```

## 加入新的 AI

### Step 1: 設定 OpenClaw

每個人在自己電腦安裝 OpenClaw：

```bash
# 安裝 OpenClaw
curl -fsSL https://openclaw.sh | bash

# 設定 Telegram bot (可選)
openclaw configure

# 啟動 Gateway
openclaw gateway start
```

### Step 2: 確認 API 可用

```bash
# 測試 OpenClaw API
curl http://localhost:3067/api/sessions/send \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"sessionKey":"test","message":"Hello"}'
```

### Step 3: 加入會議室

編輯 `src/lib/meeting/ai-endpoints.ts`：

```typescript
export const AI_ENDPOINTS: AIEndpoint[] = [
  {
    id: 'yuzuki',
    name: '悠月',
    url: 'http://100.89.92.46:3067', // William 的 Tailscale IP
    emoji: '🌙',
    triggers: ['@悠月', '@yuzuki', '查詢', '幫我'],
  },
  {
    id: 'carson-ai',
    name: 'Carson AI',
    url: 'http://100.x.x.x:3067', // Carson 的 Tailscale IP
    emoji: '💼',
    triggers: ['@Carson', '業務', '客戶', '報價'],
  },
  {
    id: 'accounting-ai',
    name: '會計 AI',
    url: 'http://100.x.x.x:3067', // 會計的 Tailscale IP
    emoji: '💰',
    triggers: ['@會計', '財務', '預算', '成本', '收款'],
  },
]
```

### Step 4: 重啟 ERP

```bash
# 重啟 dev server
cd ~/Projects/venturo-erp
npm run dev
```

## 使用方式

### 呼叫單一 AI

```
@悠月 幫我查金澤團的狀態
→ 只有悠月會回應
```

### 呼叫多個 AI

```
@悠月 @會計 金澤團預算多少？
→ 悠月和會計 AI 都會回應
```

### 自動觸發

```
預算多少？
→ 會計 AI 自動回應（因為「預算」是觸發詞）

查詢客戶資料
→ 悠月自動回應（因為「查詢」是觸發詞）
```

## AI 協作範例

```
William: 金澤團報價討論

悠月🌙: 根據資料，目前有 15 人報名
會計💰: 成本 28000/人，建議報價 35000
Carson AI💼: 客戶預算 30000-40000，35000 可接受

William: 那就 35000，@悠月 幫我更新報價
悠月🌙: 已更新金澤團報價為 35000/人
```

## 網路設定

### Tailscale (推薦)

```bash
# 每台電腦安裝 Tailscale
brew install tailscale  # Mac
# 或從 https://tailscale.com 下載

# 登入並加入網路
sudo tailscale up

# 查看自己的 IP
tailscale ip -4
```

### 公司內網

如果已在同一個區域網路：

- 查看 IP：`ipconfig` (Windows) 或 `ifconfig` (Mac/Linux)
- 確認可以 ping 通其他電腦
- 確認防火牆開放 port 3067

## 測試連線

```bash
# 測試是否可以連到其他人的 OpenClaw
curl http://100.x.x.x:3067/api/sessions/send \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"sessionKey":"test","message":"Hello"}'
```

## 權限管理

每個 AI 可以有不同的權限（在各自的 OpenClaw workspace 設定）：

**悠月（老闆助理）**：

- 完整資料庫存取
- 所有功能

**Carson AI（業務助理）**：

- 訂單、客戶、行程
- 不能看財務

**會計 AI**：

- 財務、收款、成本
- 不能看客戶聯絡方式

**助理 AI**：

- 待辦事項、提醒
- 基本查詢

## 故障排除

### AI 沒有回應

1. 檢查 OpenClaw 是否運行：

   ```bash
   openclaw status
   ```

2. 檢查網路連線：

   ```bash
   ping 100.x.x.x
   ```

3. 檢查 API 端口：
   ```bash
   curl http://100.x.x.x:3067/api/health
   ```

### 回應很慢

- OpenClaw 可能在處理其他任務
- 檢查 OpenClaw log：`openclaw gateway logs`
- 考慮升級硬體或模型

### 觸發詞不準確

編輯 `src/lib/meeting/ai-endpoints.ts` 調整 `triggers` 陣列。

## 安全性

- ✅ 所有通訊在內網（Tailscale）
- ✅ 不需要公開到網際網路
- ✅ 每個 AI 有獨立的權限設定
- ⚠️ 確保 Tailscale 或內網的安全性
