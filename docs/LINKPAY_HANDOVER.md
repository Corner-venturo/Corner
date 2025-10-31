# LinkPay 功能交接文件

> **交接時間**: 2025-10-31
> **目標工程師**: 原本負責 LinkPay API 整合的工程師
> **目的**: 將 LinkPay 功能從舊專案遷移到新架構

---

## 📋 完成狀態總覽

### ✅ 已完成（由 AI 助手完成）

1. **資料庫架構**
   - ✅ `receipts` 表格（擴充支援 LinkPay）
   - ✅ `linkpay_logs` 表格（記錄 LinkPay 訂單）
   - ✅ 收款單號生成器 (`R{YYMMDD}{4-digit}`)

2. **後端架構**
   - ✅ Zustand Store (`receipt-store.ts`, `linkpay-log-store.ts`)
   - ✅ Realtime 即時同步 Hook
   - ✅ API Route 框架 (`/api/linkpay/route.ts`)

3. **前端 UI**
   - ✅ 收款管理頁面（支援 5 種收款方式）
   - ✅ LinkPay 表單欄位（Email, 付款截止日, 付款名稱）
   - ✅ 自動呼叫 LinkPay API 流程

### 🔧 待您完成（需填入 API 細節）

1. **LinkPay API 整合**
   - 🔴 填入 API 認證邏輯
   - 🔴 填入 API 呼叫邏輯
   - 🔴 實作 Webhook 接收器
   - 🔴 實作付款狀態更新

---

## 🗂️ 檔案位置

### 資料庫
```
supabase/migrations/20251031120100_alter_receipts_add_linkpay_support.sql
```

### 型別定義
```
src/types/receipt.types.ts
```

### Zustand Stores
```
src/stores/receipt-store.ts
src/stores/linkpay-log-store.ts
```

### Realtime Hooks
```
src/hooks/use-realtime-hooks.ts
  - useRealtimeForReceipts()
  - useRealtimeForLinkPayLogs()
```

### API Route（您需要修改）
```
src/app/api/linkpay/route.ts  ← 主要工作在這裡
```

### 前端頁面
```
src/app/finance/payments/page.tsx
```

### 工具函式
```
src/lib/utils/receipt-number-generator.ts
```

---

## 🔧 您需要做的事

### 1. API Route 整合（最重要）

**檔案**: `src/app/api/linkpay/route.ts`

目前是測試模式，回傳假資料：

```typescript
// 🧪 目前的測試程式碼（暫時用）
const mockLinkpayOrderNumber = `LP${Date.now().toString().slice(-10)}`
const mockPaymentLink = `https://pay.cornertravel.com.tw/payment/${mockLinkpayOrderNumber}`

return NextResponse.json({
  success: true,
  message: '✅ 測試模式：付款連結生成成功（這是假資料）',
  paymentLink: mockPaymentLink,
  linkpayOrderNumber: mockLinkpayOrderNumber
})
```

**您需要**：

1. **參考舊專案的實作**
   - 舊檔案位置: `/Users/william/Projects/cornerERP-master/src/app/api/supabase/linkpay/route.ts`
   - 複製 API 呼叫邏輯
   - 複製認證機制

2. **整合到新架構**
   ```typescript
   // 🔧 您需要填入的部分（標記 TODO）
   const response = await fetch('https://api.cornertravel.com.tw/AuthBySupabase', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       // TODO: 加入您的認證 header
     },
     body: JSON.stringify({
       // TODO: 根據舊專案 API 格式填入
       userName,
       email,
       paymentName,
       amount,
       endDate,
       // ...其他必要欄位
     })
   })

   const data = await response.json()

   // TODO: 儲存到 linkpay_logs 表格
   await supabase.from('linkpay_logs').insert({
     receipt_number: receiptNumber,
     workspace_id: body.workspaceId,
     linkpay_order_number: data.orderNumber,
     price: amount,
     end_date: endDate,
     link: data.paymentLink,
     status: 0, // 待付款
     payment_name: paymentName
   })

   return NextResponse.json({
     success: true,
     message: '付款連結生成成功',
     paymentLink: data.paymentLink,
     linkpayOrderNumber: data.orderNumber
   })
   ```

3. **錯誤處理**
   - API 呼叫失敗時的處理
   - Timeout 處理
   - 重試機制（如需要）

---

### 2. Webhook 接收器

**需求**：接收 LinkPay 的付款完成通知

建議檔案: `src/app/api/linkpay/webhook/route.ts`

```typescript
// 🔧 需要您建立的檔案
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // TODO: 驗證 Webhook 簽章（如有）

    // TODO: 根據 linkpay_order_number 找到對應的 log
    const { data: log } = await supabase
      .from('linkpay_logs')
      .select('*')
      .eq('linkpay_order_number', body.orderNumber)
      .single()

    if (!log) {
      return NextResponse.json({ error: 'Log not found' }, { status: 404 })
    }

    // TODO: 更新 linkpay_logs 狀態
    await supabase
      .from('linkpay_logs')
      .update({
        status: 1, // 已付款
        updated_at: new Date().toISOString()
      })
      .eq('id', log.id)

    // TODO: 更新 receipts 的 actual_amount 和 status
    await supabase
      .from('receipts')
      .update({
        actual_amount: log.price,
        status: 1, // 已確認
        updated_at: new Date().toISOString()
      })
      .eq('receipt_number', log.receipt_number)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Webhook 錯誤:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

**Webhook URL**: `https://your-domain.com/api/linkpay/webhook`
需要到 LinkPay 後台設定此 URL。

---

### 3. 付款狀態定時檢查（可選）

如果 LinkPay 沒有 Webhook，或需要定時檢查過期訂單：

建議檔案: `src/app/api/linkpay/check-status/route.ts`

```typescript
// 🔧 定時檢查付款狀態（Cron Job）
export async function GET(req: NextRequest) {
  try {
    // 查詢所有待付款的 LinkPay 記錄
    const { data: pendingLogs } = await supabase
      .from('linkpay_logs')
      .select('*')
      .eq('status', 0) // 待付款
      .lt('end_date', new Date().toISOString()) // 已過期

    // TODO: 對每筆記錄呼叫 LinkPay 查詢 API
    for (const log of pendingLogs || []) {
      const status = await checkLinkPayStatus(log.linkpay_order_number)

      if (status === 'expired') {
        await supabase
          .from('linkpay_logs')
          .update({ status: 3 }) // 過期
          .eq('id', log.id)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Check failed' }, { status: 500 })
  }
}

async function checkLinkPayStatus(orderNumber: string) {
  // TODO: 呼叫 LinkPay 查詢 API
  return 'pending' // 或 'paid', 'expired', 'failed'
}
```

**設定 Vercel Cron Job**: `vercel.json`
```json
{
  "crons": [{
    "path": "/api/linkpay/check-status",
    "schedule": "0 */6 * * *"
  }]
}
```

---

## 📊 資料庫架構說明

### `receipts` 表格（已建立）

| 欄位 | 型別 | 說明 |
|------|------|------|
| `id` | UUID | 主鍵 |
| `receipt_number` | VARCHAR(20) | 收款單號（R2501280001） |
| `workspace_id` | UUID | 工作空間 ID |
| `order_id` | UUID | 訂單 ID |
| `order_number` | VARCHAR(50) | 訂單編號 |
| `tour_name` | VARCHAR(255) | 團名 |
| `receipt_date` | DATE | 收款日期 |
| `receipt_type` | INTEGER | 收款方式（0~4） |
| `receipt_amount` | DECIMAL | 應收金額 |
| `actual_amount` | DECIMAL | 實收金額 |
| `status` | INTEGER | 狀態（0:待確認 1:已確認） |
| **LinkPay 欄位** | | |
| `email` | VARCHAR(255) | 客戶 Email |
| `payment_name` | VARCHAR(255) | 付款名稱（客戶看到的） |
| `pay_dateline` | DATE | 付款截止日 |
| **其他方式欄位** | | |
| `receipt_account` | VARCHAR(255) | 付款人姓名 |
| `handler_name` | VARCHAR(100) | 經手人（現金） |
| `account_info` | VARCHAR(100) | 匯入帳戶（匯款） |
| `fees` | DECIMAL | 手續費（匯款/刷卡） |
| `card_last_four` | VARCHAR(4) | 卡號後四碼（刷卡） |
| `auth_code` | VARCHAR(50) | 授權碼（刷卡） |
| `check_number` | VARCHAR(50) | 支票號碼 |
| `check_bank` | VARCHAR(100) | 開票銀行 |
| `note` | TEXT | 備註 |

### `linkpay_logs` 表格（已建立）

| 欄位 | 型別 | 說明 |
|------|------|------|
| `id` | UUID | 主鍵 |
| `receipt_number` | VARCHAR(20) | 對應的收款單號 |
| `workspace_id` | UUID | 工作空間 ID |
| `linkpay_order_number` | VARCHAR(50) | LinkPay 訂單號（API 回傳） |
| `price` | DECIMAL | 金額 |
| `end_date` | DATE | 付款截止日 |
| `link` | TEXT | 付款連結 |
| `status` | INTEGER | 狀態（0:待付款 1:已付款 2:失敗 3:過期） |
| `payment_name` | VARCHAR(255) | 付款名稱 |

---

## 🔄 業務流程說明

### 收款單建立流程

```
1. 業務在「收款管理」頁面點選「新增收款」
2. 選擇訂單（order_id）
3. 新增收款項目：
   - 選擇「LinkPay」作為收款方式
   - 填入金額、Email、付款截止日、付款名稱
4. 點選「儲存收款單」
   ↓
5. 系統自動生成收款單號（R2501280001）
6. 建立 receipts 記錄（status: 0 待確認）
7. **呼叫 /api/linkpay API**
   ↓
8. 您的 API Route 呼叫外部 LinkPay API
9. 取得付款連結（paymentLink）和 LinkPay 訂單號
10. 儲存到 linkpay_logs 表格
    ↓
11. 前端顯示成功訊息
12. 業務可複製付款連結給客戶
```

### 客戶付款流程

```
1. 客戶收到付款連結
2. 點選連結進入 LinkPay 付款頁面
3. 輸入信用卡資訊完成付款
   ↓
4. LinkPay 發送 Webhook 到 /api/linkpay/webhook
   ↓
5. 您的 Webhook 處理器：
   - 更新 linkpay_logs.status = 1（已付款）
   - 更新 receipts.actual_amount = 付款金額
   - 更新 receipts.status = 1（已確認）
   ↓
6. Realtime 即時推送更新到前端
7. 會計看到收款單狀態變更為「已確認」✅
```

### 會計確認流程（非 LinkPay）

```
1. 業務建立收款單（現金/匯款/刷卡/支票）
2. receipts.status = 0（待確認）
3. receipts.actual_amount = 0
   ↓
4. 會計在「收款管理」頁面看到「待確認」的收款單
5. 點選「詳情」進入編輯頁面
6. 填入實收金額（actual_amount）
7. 確認無誤後，將 status 改為 1（已確認）
   ↓
8. Realtime 推送更新
9. 業務端看到狀態變更為「已確認」✅
```

---

## 🧪 測試建議

### 1. 單元測試
```typescript
// 測試收款單號生成
describe('generateReceiptNumber', () => {
  it('should generate correct format', () => {
    const result = generateReceiptNumber('2025-01-28', [])
    expect(result).toBe('R2501280001')
  })

  it('should increment sequence', () => {
    const existing = [{ receipt_number: 'R2501280001' }]
    const result = generateReceiptNumber('2025-01-28', existing)
    expect(result).toBe('R2501280002')
  })
})
```

### 2. API 測試
```bash
# 測試 LinkPay API（目前是測試模式）
curl -X POST http://localhost:3000/api/linkpay \
  -H "Content-Type: application/json" \
  -d '{
    "receiptNumber": "R2501280001",
    "userName": "王小明",
    "email": "test@example.com",
    "paymentName": "峇里島五日遊 - 尾款",
    "createUser": "user-123",
    "amount": 50000,
    "endDate": "2025-02-28"
  }'

# 預期回應（測試模式）
{
  "success": true,
  "message": "✅ 測試模式：付款連結生成成功（這是假資料）",
  "paymentLink": "https://pay.cornertravel.com.tw/payment/LP1738310400",
  "linkpayOrderNumber": "LP1738310400"
}
```

### 3. Webhook 測試
```bash
# 模擬 LinkPay Webhook 呼叫
curl -X POST http://localhost:3000/api/linkpay/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "orderNumber": "LP1738310400",
    "status": "paid",
    "amount": 50000,
    "paidAt": "2025-01-28T10:30:00Z"
  }'
```

---

## 🚨 注意事項

### 安全性

1. **API 認證**
   - 確保 LinkPay API 呼叫包含正確的認證資訊
   - 不要將 API Key 寫死在程式碼中
   - 使用環境變數：`process.env.LINKPAY_API_KEY`

2. **Webhook 驗證**
   - 驗證 Webhook 的簽章（如 LinkPay 有提供）
   - 防止惡意 POST 請求偽造付款完成

3. **金額驗證**
   - Webhook 收到的金額必須與 linkpay_logs.price 一致
   - 防止金額被竄改

### 錯誤處理

1. **API 呼叫失敗**
   - 回傳清楚的錯誤訊息給前端
   - 記錄完整的錯誤資訊到 Log

2. **Webhook 重複呼叫**
   - 檢查 linkpay_logs.status，避免重複處理
   - 使用資料庫的 UNIQUE 約束（linkpay_order_number）

3. **過期訂單**
   - 定時檢查過期的 LinkPay 訂單
   - 更新 status 為 3（過期）

---

## 📞 聯絡方式

如有任何問題，請聯絡：
- **AI 助手**: 透過 Claude Code 繼續對話
- **專案負責人**: William

---

## ✅ 完成檢查清單

請依序完成以下工作：

- [ ] 1. 閱讀此文件
- [ ] 2. 複製舊專案 `/Users/william/Projects/cornerERP-master/src/app/api/supabase/linkpay/route.ts` 的 API 邏輯
- [ ] 3. 填入 `src/app/api/linkpay/route.ts` 的 TODO 部分
- [ ] 4. 建立 Webhook 接收器 `src/app/api/linkpay/webhook/route.ts`
- [ ] 5. 測試 API 呼叫（使用真實 LinkPay API）
- [ ] 6. 測試 Webhook 接收（使用模擬資料）
- [ ] 7. 實作定時檢查過期訂單（可選）
- [ ] 8. 部署到 Vercel 並設定環境變數
- [ ] 9. 到 LinkPay 後台設定 Webhook URL
- [ ] 10. 在正式環境進行完整測試

完成後，LinkPay 功能就可以正式上線了！🎉
