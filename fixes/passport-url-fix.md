# Passport Upload URL Fix

## 問題
目前護照上傳後生成 **1 年有效期的 signed URL**，1 年後圖片無法顯示。

## 現況
```typescript
// src/app/(main)/customers/hooks/usePassportUpload.ts:359
const { data: urlData } = await supabase.storage
  .from('passport-images')
  .createSignedUrl(storageFileName, 3600 * 24 * 365)  // ← 1 年
```

## 解決方案

### 方案 A：延長有效期（簡單）
```typescript
// 改為 10 年（實務上足夠，等系統穩定後再優化）
createSignedUrl(storageFileName, 3600 * 24 * 365 * 10)  // 10 年
```

**優點：**
- ✅ 1 行修改
- ✅ 不破壞現有功能
- ✅ 立即生效

**缺點：**
- ❌ 10 年後還是會失效
- ❌ URL 很長（包含 token）

---

### 方案 B：動態生成 URL（正確但複雜）
```typescript
// 上傳時只存檔名
customer.passport_image_path = storageFileName  // ← 改欄位名稱

// 顯示時動態生成（在顯示組件裡）
const { data } = await supabase.storage
  .from('passport-images')
  .createSignedUrl(customer.passport_image_path, 3600)  // 1 小時
```

**優點：**
- ✅ URL 永不過期（因為每次都動態生成）
- ✅ 更安全（短期 token）

**缺點：**
- ❌ 需要改資料庫 schema（新增 passport_image_path 欄位）
- ❌ 需要改所有顯示護照的地方
- ❌ 需要遷移現有資料（287 筆客戶）
- ❌ 估計 2-3 小時

---

### 方案 C：Public Bucket（最簡單但不安全）
```typescript
// Bucket 設為 public
// 直接用 getPublicUrl() 不需要 signed URL
const { data } = supabase.storage
  .from('passport-images')
  .getPublicUrl(storageFileName)
```

**優點：**
- ✅ URL 永不過期
- ✅ URL 簡短

**缺點：**
- ❌ **安全風險**：任何人只要知道 URL 就能存取護照圖片
- ❌ 不符合個資保護要求

---

## 建議

### 立即執行（今天）：方案 A
- 延長為 10 年，解決燃眉之急
- 加入 TODO 註解，提醒未來優化

### 產品化後（1-2 個月）：方案 B
- 等系統穩定、有更多客戶資料時
- 一次性遷移到動態生成 URL
- 同時優化其他檔案上傳邏輯（合約、簽證等）

---

## 修改檔案

```typescript
// src/app/(main)/customers/hooks/usePassportUpload.ts
Line 359:

// TODO (產品化後優化): 改為存檔名 + 動態生成 URL（更安全、永不過期）
// 目前暫時延長為 10 年，實務上已足夠
const { data: urlData, error: urlError } = await supabase.storage
  .from('passport-images')
  .createSignedUrl(storageFileName, 3600 * 24 * 365 * 10)  // 10 years
```
