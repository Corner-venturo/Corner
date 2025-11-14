# 供應商資料匯入分析報告

## 📊 資料概況

- **總筆數**: 240 筆供應商資料（不含表頭）
- **資料來源**: `/Users/william/Downloads/suppliers.csv`
- **目標系統**: Venturo ERP

### 供應商類型分佈

| 類型 | 數量 | 說明 |
|------|------|------|
| B2B | 67 | 旅行社（同業）|
| Traffic | 54 | 交通相關 |
| Employee | 43 | 員工？ |
| Other | 32 | 其他 |
| Activity | 21 | 活動/景點 |
| Hotel | 13 | 飯店 |
| Food | 6 | 餐飲 |
| 其他 | 4 | 日文供應商等 |

## 🔄 欄位對照表

### 舊系統 (CSV) → 新系統 (Venturo)

| 舊欄位 | 新欄位 | 轉換規則 | 說明 |
|--------|--------|----------|------|
| `supplier_code` | `code` | 直接對應 | 供應商代碼 |
| `supplier_name` | `name` | 直接對應 | 供應商名稱 |
| `supplier_type` | `type` | **需要轉換** | 類型需要映射（見下方） |
| `account_code` | `bank_account` | 直接對應 | 銀行帳號 |
| `account_name` | `contact_person` | 建議對應 | 帳戶名稱 → 聯絡人 |
| `bank_code` | `bank_name` | **需要轉換** | 銀行代碼 → 銀行名稱（需查表）|
| `is_quoted` | **捨棄** | - | 新系統無此欄位 |
| `created_at` | `created_at` | 直接對應 | 建立時間 |
| `created_by` | `created_by` | 直接對應 | 建立人 |
| `modified_at` | `updated_at` | 直接對應 | 更新時間 |
| `modified_by` | `updated_by` | 直接對應 | 更新人 |

### 新系統額外欄位（需補充預設值）

| 欄位 | 預設值 | 說明 |
|------|--------|------|
| `id` | UUID | 自動生成 |
| `name_en` | `null` | 英文名稱（暫無資料）|
| `country_id` | `null` | 國家（需手動補充）|
| `phone` | `null` | 電話（暫無資料）|
| `email` | `null` | Email（暫無資料）|
| `address` | `null` | 地址（暫無資料）|
| `website` | `null` | 網站（暫無資料）|
| `tax_id` | `null` | 統編（暫無資料）|
| `payment_terms` | `null` | 付款條件（暫無資料）|
| `currency` | `'TWD'` | 幣別（預設台幣）|
| `rating` | `null` | 評級（暫無資料）|
| `is_preferred` | `false` | 是否優先供應商 |
| `is_active` | `true` | 是否啟用 |
| `display_order` | `0` | 顯示順序 |
| `notes` | `null` | 備註（暫無資料）|
| `_deleted` | `false` | 軟刪除標記 |
| `_needs_sync` | `false` | 同步標記 |

## 🔀 類型對應規則

### supplier_type 轉換映射

| 舊類型 | 新類型 | 說明 |
|--------|--------|------|
| `B2B` | `agency` | 旅行社（同業）|
| `Traffic` | `transport` | 交通 |
| `Activity` | `attraction` | 活動/景點 |
| `Hotel` | `hotel` | 飯店 |
| `Food` | `restaurant` | 餐飲 |
| `Employee` | `other` | 員工？（不確定用途，先歸類其他）|
| `Other` | `other` | 其他 |
| *其他* | `other` | 其他（包含日文供應商）|

新系統支援的類型：
- `hotel` - 飯店
- `restaurant` - 餐廳
- `transport` - 交通
- `attraction` - 景點
- `guide` - 導遊
- `agency` - 旅行社
- `ticketing` - 票務
- `other` - 其他

## ⚠️ 潛在問題與建議

### 1. 銀行代碼需要轉換
舊系統使用銀行代碼（如 `008`、`006`），新系統使用銀行名稱。

**建議處理方式**：
- 選項 A：保留銀行代碼在 `bank_name` 欄位（簡單但不理想）
- 選項 B：建立銀行代碼對照表，轉換為銀行名稱（推薦）
- 選項 C：匯入後手動補充

常見銀行代碼：
- `006` - 合作金庫
- `007` - 第一銀行
- `008` - 華南銀行
- `011` - 上海銀行
- `012` - 台北富邦
- `013` - 國泰世華
- `050` - 台灣企銀

### 2. Employee 類型用途不明
有 43 筆標記為 `Employee`，不確定是否為：
- 導遊/領隊資料？
- 員工借支記錄？
- 內部成本中心？

**建議**：先暫時對應到 `other`，匯入後再分類。

### 3. 缺少聯絡資訊
舊資料沒有電話、Email、地址等聯絡資訊，建議匯入後：
- 優先補充常用供應商的聯絡資訊
- 或從其他系統（如 Excel、Email）補充

### 4. is_quoted 欄位
舊系統有「是否報價」欄位，新系統無對應欄位。

**建議處理方式**：
- 忽略此欄位（新系統報價由 `cost_templates` 表管理）
- 或將此資訊記錄在 `notes` 欄位中

### 5. 資料重複檢查
需確認是否有重複的供應商（相同名稱或代碼）。

## 📝 匯入步驟建議

1. ✅ 分析資料結構（已完成）
2. ⏭️ 建立銀行代碼對照表
3. ⏭️ 建立資料轉換腳本
4. ⏭️ 測試匯入 5-10 筆資料
5. ⏭️ 檢查轉換結果
6. ⏭️ 全量匯入
7. ⏭️ 驗證資料完整性
8. ⏭️ 補充缺失的聯絡資訊

## 🔧 下一步行動

需要確認：
1. 是否需要建立完整的銀行代碼對照表？
2. Employee 類型的實際用途？
3. 是否保留 `is_quoted` 資訊到 notes？
4. 是否需要補充其他欄位（如國家、幣別）？
