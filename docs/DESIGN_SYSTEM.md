# 🎨 Venturo 設計系統規範

> **設計理念**：優雅、精緻、有質感的莫蘭迪風格設計
> **參考標準**：登入頁面的視覺風格

---

## 📐 核心設計 Token

### 1. 圓角規範（Border Radius）

**以登入頁面為標準：**

| 用途 | Class | 數值 | 使用場景 |
|------|-------|------|----------|
| **大卡片** | `rounded-xl` | 12px | 主要卡片容器、對話框、模態視窗 |
| **中型元素** | `rounded-lg` | 8px | 按鈕、輸入框、次要卡片 |
| **小型元素** | `rounded-md` | 6px | 標籤、小按鈕 |
| **圓形** | `rounded-full` | 50% | 頭像、圖示背景 |

**範例**：
```tsx
// ✅ 正確：主要卡片使用 rounded-xl
<div className="rounded-xl shadow-lg border border-gray-200 p-8">
  {/* 內容 */}
</div>

// ✅ 正確：按鈕使用 rounded-lg
<button className="rounded-lg px-4 py-2">
  按鈕
</button>

// ❌ 錯誤：不要使用 rounded-sm、rounded-2xl 等其他變體
```

---

### 2. 陰影規範（Shadow）

**以登入頁面為標準：**

| 層級 | Class | 使用場景 |
|------|-------|----------|
| **強陰影** | `shadow-lg` | 主要卡片、模態視窗、重要提升元素 |
| **中等陰影** | `shadow-md` | 下拉選單、浮動面板 |
| **輕陰影** | `shadow-sm` | 表格、次要卡片 |

**範例**：
```tsx
// ✅ 正確：主要卡片使用 shadow-lg
<div className="rounded-xl shadow-lg">
  {/* 登入卡片、設定卡片等 */}
</div>

// ✅ 正確：表格使用 shadow-sm
<table className="rounded-lg shadow-sm">
  {/* 表格內容 */}
</table>
```

---

### 3. 邊框規範（Border）

**統一使用 CSS 變數：**

| Class | 顏色 | 使用場景 |
|-------|------|----------|
| `border-border` | `var(--border)` | 主要邊框 |
| `border-border/60` | 60% 透明度 | 淡化邊框 |
| `border-border/40` | 40% 透明度 | 表格分隔線 |

**❌ 不要使用**：
- `border-gray-200`、`border-gray-300` 等固定顏色
- 改用 `border-border` CSS 變數，支援深色主題切換

**範例**：
```tsx
// ✅ 正確：使用 CSS 變數
<div className="border border-border rounded-xl">
  {/* 內容 */}
</div>

// ❌ 錯誤：不要硬編碼顏色
<div className="border border-gray-200 rounded-xl">
  {/* 內容 */}
</div>
```

---

### 4. 間距規範（Spacing）

**以登入頁面為標準：**

| 用途 | Class | 數值 | 使用場景 |
|------|-------|------|----------|
| **卡片內距** | `p-8` | 2rem (32px) | 主要卡片、表單容器 |
| **元素間距** | `space-y-6` | 1.5rem (24px) | 表單欄位、卡片區塊 |
| **小間距** | `space-y-4` | 1rem (16px) | 列表項目 |
| **按鈕內距** | `px-4 py-2` | 1rem × 0.5rem | 按鈕 |

---

### 5. 莫蘭迪色系（Morandi Colors）

**主要色彩**：

| 變數 | 顏色 | 用途 |
|------|------|------|
| `--morandi-primary` | `#3A3633` | 主要文字、深色元素 |
| `--morandi-secondary` | `#8B8680` | 次要文字、圖示 |
| `--morandi-gold` | `#C4A572` | 強調色、按鈕、連結 |
| `--morandi-gold-hover` | `#A08968` | 金色懸停效果 |
| `--morandi-green` | `#9FA68F` | 成功訊息 |
| `--morandi-red` | `#C08374` | 錯誤訊息 |
| `--morandi-container` | `#E8E5E0` | 背景淡色、容器 |

**使用範例**：
```tsx
// ✅ 正確：使用 Tailwind 工具類
<div className="bg-morandi-container text-morandi-primary">
  {/* 內容 */}
</div>

// ✅ 正確：使用 CSS 變數
<div style={{ backgroundColor: 'var(--morandi-gold)' }}>
  {/* 內容 */}
</div>
```

---

## 🎯 常用設計模式

### 1. 主要卡片（Primary Card）

**登入頁面標準**：

```tsx
<div className="rounded-xl shadow-lg border border-border bg-card p-8">
  <div className="space-y-6">
    {/* 卡片內容 */}
  </div>
</div>
```

**特點**：
- 大圓角 `rounded-xl`
- 深陰影 `shadow-lg`
- 細邊框 `border border-border`
- 寬敞內距 `p-8`

---

### 2. 次要卡片（Secondary Card）

```tsx
<div className="rounded-lg shadow-sm border border-border bg-card p-6">
  {/* 卡片內容 */}
</div>
```

---

### 3. 主要按鈕（Primary Button）

**登入頁面標準**：

```tsx
<button className="w-full rounded-lg bg-morandi-gold text-white px-4 py-2.5 hover:bg-morandi-gold-hover transition-colors">
  按鈕文字
</button>
```

---

### 4. 輸入框（Input）

```tsx
<input
  type="text"
  className="w-full rounded-lg border border-border px-3 py-2 focus:ring-2 focus:ring-morandi-gold"
/>
```

---

### 5. 表格（Table）

```tsx
<div className="rounded-lg shadow-sm border border-border overflow-hidden">
  <table className="w-full">
    <thead className="bg-morandi-container/40 border-b border-border/60">
      {/* 表頭 */}
    </thead>
    <tbody>
      {/* 表格內容 */}
    </tbody>
  </table>
</div>
```

---

## 🚫 避免使用

### 不建議的圓角：
- ❌ `rounded-sm` (太小)
- ❌ `rounded-2xl` (太大)
- ❌ `rounded-3xl` (太大)

### 不建議的陰影：
- ❌ `shadow-xl` (過度)
- ❌ `shadow-2xl` (過度)
- ❌ `shadow-none` (在需要提升的地方)

### 不建議的顏色：
- ❌ `border-gray-200` (改用 `border-border`)
- ❌ `bg-gray-100` (改用 `bg-morandi-container`)
- ❌ `text-gray-600` (改用 `text-morandi-secondary`)

---

## 📱 響應式設計

### 間距調整：

```tsx
// ✅ 正確：桌面版寬敞，行動版緊湊
<div className="p-4 md:p-6 lg:p-8">
  {/* 內容 */}
</div>
```

---

## 🌓 深色主題支援

所有顏色使用 CSS 變數，自動支援深色主題：

```tsx
// ✅ 自動支援深色主題
<div className="bg-card text-foreground border-border">
  {/* 主題切換時自動變色 */}
</div>
```

---

## ✅ Code Review 檢查清單

**提交前檢查**：

- [ ] 卡片使用 `rounded-xl` + `shadow-lg`？
- [ ] 按鈕使用 `rounded-lg`？
- [ ] 邊框使用 `border-border` 而非固定顏色？
- [ ] 間距使用 `p-8` (卡片) 或 `p-6` (次要元素)？
- [ ] 顏色使用莫蘭迪 CSS 變數？
- [ ] 支援深色主題？

---

## 📚 參考範例

**最佳範例頁面**：
- ✅ `/login` - 登入頁面（設計標準）
- ✅ 主題設定卡片（設定頁面）

**需要改進的頁面**：
- 🔧 報價單管理（表格需要更柔和）
- 🔧 旅遊團管理（卡片圓角需調整）

---

**最後更新**：2025-10-29
**維護者**：William Chien
**設計參考**：登入頁面 (`/login`)
