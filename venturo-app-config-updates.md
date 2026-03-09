# Venturo C-Side App - Configuration Updates

Please update the following files in your `/Users/williamchien/Projects/venturo-app` directory with the content provided.

---

## `tailwind.config.ts`

請將您的 `tailwind.config.ts` 檔案內容更新為以下內容：

```tsx
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // 從 ERP 提取的 Morandi 色系 (default theme)
        'morandi-primary': 'var(--morandi-primary)',
        'morandi-secondary': 'var(--morandi-secondary)',
        'morandi-gold': 'var(--morandi-gold)',
        'morandi-gold-rgb': 'var(--morandi-gold-rgb)', // RGB value for dynamic use
        'morandi-gold-hover': 'var(--morandi-gold-hover)',
        'morandi-green': 'var(--morandi-green)',
        'morandi-green-rgb': 'var(--morandi-green-rgb)', // RGB value
        'morandi-red': 'var(--morandi-red)',
        'morandi-container': 'var(--morandi-container)',
        'morandi-muted': 'var(--morandi-muted)',

        // C 端增加的暖色調
        'warm-accent': 'var(--warm-accent)', // #F59E0B
        'nature-green': 'var(--nature-green)', // #10B981
        'ocean-blue': 'var(--ocean-blue)', // #0EA5E9
        'bg-warm': 'var(--bg-warm)', // #FFFBF5

        // 基礎背景/前景/邊框等 (來自 ERP 的 globals.css)
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: 'var(--card)',
        'card-foreground': 'var(--card-foreground)',
        border: 'var(--border)',
        'border-muted': 'var(--border-muted)',
        popover: 'var(--popover)',
        'popover-foreground': 'var(--popover-foreground)',
        accent: 'var(--accent)',
        'accent-foreground': 'var(--accent-foreground)',
        input: 'var(--input-border)', // Map input border to 'input' color
      },
      fontFamily: {
        // 確保字體已在 globals.css 中載入
        sans: ['Noto Sans TC', 'Inter', 'sans-serif'],
        mono: ['Inter', 'monospace'], // 根據 ERP 專案的 tsconfig.json 和 Next.js 設定
      },
    },
  },
  plugins: [],
}
export default config
```

---

## `src/app/globals.css`

請將您的 `src/app/globals.css` 檔案內容更新為以下內容：

```css
@import 'tailwindcss';

/* 引入 Google Fonts - Noto Sans TC */
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&display=swap');
/* 引入 Google Fonts - Inter (用於英文) */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap');

/* 莫蘭迪主題（預設） */
:root,
[data-theme='morandi'] {
  /* 主色系 */
  --morandi-primary: #3a3633;
  --morandi-secondary: #8b8680;
  --morandi-gold: #c9aa7c;
  --morandi-gold-rgb: 201, 170, 124;
  --morandi-gold-hover: #b8996b;
  --morandi-green: #9fa68f;
  --morandi-green-rgb: 159, 166, 143;
  --morandi-red: #c08374;
  --morandi-container: #e8e5e0;
  --morandi-muted: #b8b2aa;

  /* C 端增加的暖色調 */
  --warm-accent: #f59e0b; /* 琥珀色 */
  --nature-green: #10b981; /* 自然綠 */
  --ocean-blue: #0ea5e9; /* 海洋藍 */
  --bg-warm: #fffbf5; /* 更柔和的背景 */

  /* 背景色 */
  --background: #f6f4f1;
  --card: #ffffff;
  --border: #d4c4b0;
  --popover: #ffffff;
  --popover-foreground: #3a3633;
  --accent: #e8e5e0;
  --accent-foreground: #3a3633;

  /* 設定對應變數 */
  --foreground: var(--morandi-primary);
  --card-foreground: var(--morandi-primary);
  --border-muted: var(--morandi-container);

  /* 表單元素專用變數 */
  --input-border: #d4c4b0;
  --input-border-hover: #c4a572;
  --input-border-focus: #c4a572;
  --input-bg: #ffffff;
  --input-text: #3a3633;
  --input-placeholder: #b8b2aa;
}

/* Discord 風格深色主題 */
[data-theme='modern-dark'] {
  /* 主色系 - Discord 風格柔和配色 */
  --morandi-primary: #dcddde; /* 主要文字 - 柔和白 */
  --morandi-secondary: #b9bbbe; /* 次要文字 - 灰白 */
  --morandi-gold: #5865f2; /* 主要強調色 - Discord 紫藍 */
  --morandi-gold-rgb: 88, 101, 242;
  --morandi-gold-hover: #4752c4; /* hover 狀態 - 深紫藍 */
  --morandi-green: #3ba55d; /* 成功/正面 - 柔和綠 */
  --morandi-green-rgb: 59, 165, 93;
  --morandi-red: #ed4245; /* 錯誤/負面 - 柔和紅 */
  --morandi-container: #2f3136; /* 容器背景 - 次要背景 */
  --morandi-muted: #72767d; /* 淡化文字 - 深灰 */

  /* C 端增加的暖色調 (深色模式調整) */
  --warm-accent: #fbbf24; /* 琥珀色 - 深色調整 */
  --nature-green: #34d399; /* 自然綠 - 深色調整 */
  --ocean-blue: #38bdf8; /* 海洋藍 - 深色調整 */
  --bg-warm: #262626; /* 更柔和的背景 - 深色調整 */

  /* 背景色 */
  --background: #36393f; /* 主背景 - 深灰帶藍 */
  --card: #2f3136; /* 卡片背景 - 更深灰 */
  --border: #202225; /* 邊框 - 深色 */
  --popover: #2f3136; /* 下拉選單背景 */
  --popover-foreground: #dcddde; /* 下拉選單文字 */
  --accent: #4f545c; /* 強調背景 - 較亮灰 */
  --accent-foreground: #dcddde; /* 強調文字 */

  /* 設定對應變數 */
  --foreground: #dcddde;
  --card-foreground: #dcddde;
  --border-muted: #2f3136;

  /* 表單元素專用變數（深色主題） */
  --input-border: #202225;
  --input-border-hover: #5865f2;
  --input-border-focus: #5865f2;
  --input-bg: rgba(47, 49, 54, 0.5);
  --input-text: #dcddde;
  --input-placeholder: #72767d;
}

/* 深色主題的純色背景（Discord 風格不用漸層） */
[data-theme='modern-dark'] body {
  background: #36393f;
  min-height: 100vh;
}

/* 深色主題的卡片陰影調整 */
[data-theme='modern-dark'] .morandi-card {
  box-shadow:
    0 1px 3px 0 rgba(0, 0, 0, 0.3),
    0 1px 2px 0 rgba(0, 0, 0, 0.2);
}

[data-theme='modern-dark'] .morandi-card:hover {
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.3),
    0 2px 4px -1px rgba(0, 0, 0, 0.2);
}

/* 深色主題的按鈕樣式 - Discord 紫藍色（柔和設計） */
[data-theme='modern-dark'] .btn-morandi-primary {
  background: linear-gradient(to right, #5865f2, #4752c4);
  color: white;
  box-shadow: 0 2px 8px rgba(88, 101, 242, 0.2);
}

[data-theme='modern-dark'] .btn-morandi-primary:hover {
  background: linear-gradient(to right, #4752c4, #3c45a5);
  box-shadow: 0 4px 12px rgba(88, 101, 242, 0.3);
  transform: scale(1.02);
}

[data-theme='modern-dark'] .btn-morandi-primary:active {
  transform: scale(0.98);
  box-shadow: 0 1px 4px rgba(88, 101, 242, 0.2);
}

/* 深色主題的次要按鈕 - 半透明柔和 */
[data-theme='modern-dark'] .btn-morandi-secondary {
  background: rgba(47, 49, 54, 0.8);
  color: #5865f2;
  border-color: rgba(88, 101, 242, 0.3);
}

[data-theme='modern-dark'] .btn-morandi-secondary:hover {
  background: rgba(47, 49, 54, 1);
  border-color: #5865f2;
  transform: scale(1.02);
  box-shadow: 0 2px 8px rgba(88, 101, 242, 0.15);
}

[data-theme='modern-dark'] .btn-morandi-secondary:active {
  transform: scale(0.98);
}

/* 深色主題的圖標按鈕 */
[data-theme='modern-dark'] .btn-icon-morandi {
  background: rgba(88, 101, 242, 0.1);
  color: #5865f2;
}

[data-theme='modern-dark'] .btn-icon-morandi:hover {
  background: linear-gradient(135deg, #5865f2, #4752c4);
  color: white;
  box-shadow: 0 4px 8px rgba(88, 101, 242, 0.3);
}

/* 深色主題的選單項目 - 淡淡的背景 */
[data-theme='modern-dark'] .menu-item-morandi:hover {
  background: rgba(88, 101, 242, 0.08);
}

[data-theme='modern-dark'] .menu-item-morandi.active {
  background: rgba(88, 101, 242, 0.12);
  transform: scale(1.05);
}

[data-theme='modern-dark'] .menu-item-morandi.active::after {
  background: linear-gradient(to bottom, #5865f2, #4752c4);
}

/* 深色主題的卡片 - 柔和邊框 */
[data-theme='modern-dark'] .card-morandi-elevated {
  border-color: rgba(88, 101, 242, 0.15);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

[data-theme='modern-dark'] .card-morandi-elevated:hover {
  border-color: rgba(88, 101, 242, 0.3);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}

/* 深色主題的輸入框 */
[data-theme='modern-dark'] .input-morandi {
  background: rgba(47, 49, 54, 0.5);
  border-color: rgba(32, 34, 37, 0.8);
  color: #dcddde;
}

[data-theme='modern-dark'] .input-morandi::placeholder {
  color: rgba(185, 187, 190, 0.4);
}

[data-theme='modern-dark'] .input-morandi:focus {
  background: rgba(47, 49, 54, 0.7);
  border-color: #5865f2;
  box-shadow: 0 0 0 3px rgba(88, 101, 242, 0.2);
}

/* 深色主題的徽章 - 淡淡的背景 */
[data-theme='modern-dark'] .badge-morandi {
  background: rgba(88, 101, 242, 0.12);
  color: #5865f2;
  border-color: rgba(88, 101, 242, 0.25);
}

/* 深色主題的分隔線 */
[data-theme='modern-dark'] .divider-gradient {
  background: linear-gradient(
    to right,
    transparent,
    rgba(88, 101, 242, 0.3) 20%,
    rgba(88, 101, 242, 0.4) 50%,
    rgba(88, 101, 242, 0.3) 80%,
    transparent
  );
}

/* 深色主題的下拉選單項目 */
[data-theme='modern-dark'] .dropdown-item-morandi:hover {
  background: rgba(88, 101, 242, 0.15);
}

/* 深色主題的工具提示 */
[data-theme='modern-dark'] .tooltip-morandi {
  background: linear-gradient(135deg, #2f3136, #36393f);
  border-color: rgba(88, 101, 242, 0.3);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-border: var(--border);
  --color-border-muted: var(--border-muted);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);

  /* 表單元素顏色映射 */
  --color-input: var(--input-border);

  /* 莫蘭迪色系 */
  --color-morandi-primary: var(--morandi-primary);
  --color-morandi-secondary: var(--morandi-secondary);
  --color-morandi-gold: var(--morandi-gold);
  --color-morandi-gold-hover: var(--morandi-gold-hover);
  --color-morandi-green: var(--morandi-green);
  --color-morandi-red: var(--morandi-red);
  --color-morandi-container: var(--morandi-container);
  --color-morandi-muted: var(--morandi-muted);

  /* C 端增加的暖色調 */
  --color-warm-accent: var(--warm-accent);
  --color-nature-green: var(--nature-green);
  --color-ocean-blue: var(--ocean-blue);
  --color-bg-warm: var(--bg-warm);

  --font-sans: 'Noto Sans TC', 'Inter', sans-serif;
  --font-mono: 'Inter', monospace;
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-sans); /* 使用 Tailwind config 中定義的字體 */
  transition:
    background-color 0.3s ease,
    color 0.3s ease;
}

/* 金色質感提升 - 左邊框加入細微漸層陰影 */
.hover\:border-l-3:hover {
  box-shadow: -2px 0 4px rgba(201, 170, 124, 0.15);
}

/* Active 狀態的左邊框也加陰影 */
.border-l-3 {
  box-shadow: -2px 0 4px rgba(201, 170, 124, 0.15);
}

/* 全站滾動條規範 - 完全隱藏，只在需要滾動且正在滾動時顯示 */

/* 預設完全隱藏所有滾動條 */
* {
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
}

*::-webkit-scrollbar {
  width: 0px;
  height: 0px;
  background: transparent;
}

*::-webkit-scrollbar-track {
  background: transparent;
}

*::-webkit-scrollbar-thumb {
  background: transparent;
}

/* 只有當內容真的需要滾動時才顯示滾動條 */
.scrollable-content {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.scrollable-content::-webkit-scrollbar {
  width: 0px;
  height: 0px;
}

/* 滾動中時才顯示 */
.scrollable-content.scrolling::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.scrollable-content.scrolling::-webkit-scrollbar-track {
  background: transparent;
}

.scrollable-content.scrolling::-webkit-scrollbar-thumb {
  background: rgba(139, 134, 128, 0.6);
  border-radius: 3px;
}

.scrollable-content.scrolling {
  scrollbar-width: thin;
  scrollbar-color: rgba(139, 134, 128, 0.6) transparent;
}

/* 莫蘭迪色系工具類 */

/* 背景色 */
.bg-morandi-container {
  background-color: var(--morandi-container);
}

/* 文字色 */
.text-morandi-primary {
  color: var(--morandi-primary);
}
.text-morandi-secondary {
  color: var(--morandi-secondary);
}
.text-morandi-muted {
  color: var(--morandi-muted);
}

/* 功能色 - 背景 */
.bg-morandi-gold {
  background: linear-gradient(to bottom right, #d4c5a9, #c9b896, #bfad87);
}
.bg-morandi-gold-hover:hover {
  background: linear-gradient(to bottom right, #c9b896, #bfad87, #b5a378);
}
.bg-morandi-red {
  background-color: var(--morandi-red);
}
.bg-morandi-green {
  background-color: var(--morandi-green);
}

/* 功能色 - 文字 */
.text-morandi-gold {
  color: var(--morandi-gold);
}
.text-morandi-red {
  color: var(--morandi-red);
}
.text-morandi-green {
  color: var(--morandi-green);
}

/* 功能色 - 邊框 */
.border-morandi-gold {
  border-color: var(--morandi-gold);
}
.border-morandi-red {
  border-color: var(--morandi-red);
}
.border-morandi-green {
  border-color: var(--morandi-green);
}

/* 莫蘭迪卡片樣式 */
.morandi-card {
  background-color: var(--card);
  border: 1px solid var(--border);
  border-radius: 8px;
  box-shadow:
    0 1px 3px 0 rgba(58, 54, 51, 0.1),
    0 1px 2px 0 rgba(58, 54, 51, 0.06);
  transition: all 0.2s ease-in-out;
}

.morandi-card:hover {
  box-shadow:
    0 4px 6px -1px rgba(58, 54, 51, 0.1),
    0 2px 4px -1px rgba(58, 54, 51, 0.06);
  border-color: var(--morandi-gold);
}

/* 表格美化邊框 - 不碰到上下邊界 */
.table-divider {
  position: relative;
}

.table-divider::after {
  content: '';
  position: absolute;
  right: 0;
  top: 25%;
  bottom: 25%;
  width: 1px;
  background-color: var(--border);
}

/* 主題切換動畫 */
* {
  transition:
    background-color 0.3s ease,
    color 0.3s ease,
    border-color 0.3s ease;
}

/* 全域分割線樣式 - 水平分割線左右留白 */
.divider-inset,
.border-t-inset,
.border-b-inset {
  position: relative;
}

/* 上邊框留白 */
.border-t-inset {
  border-top: none !important;
}

.border-t-inset::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  border-top: 1px solid var(--border);
}

/* 下邊框留白 */
.border-b-inset {
  border-bottom: none !important;
}

.border-b-inset::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  border-bottom: 1px solid var(--border);
}

/* Divider 組件樣式 */
.divider-inset {
  height: 1px;
  background: linear-gradient(
    to right,
    transparent 0.75rem,
    var(--border) 0.75rem,
    var(--border) calc(100% - 0.75rem),
    transparent calc(100% - 0.75rem)
  );
  border: none;
}

/* ============================================ 
   🎨 統一美學系統 - 莫蘭迪精緻按鈕與元件
   ============================================ */

/* 佈局與裝飾分離的組合式樣式 */
.btn-gradient-primary {
  background: linear-gradient(to right, #b5986a, #d4c4a8);
  color: white;
  border: none;
  box-shadow: 0 2px 8px rgba(181, 152, 106, 0.15);
  transition: all 0.2s ease;
}
.btn-gradient-primary:hover {
  background: linear-gradient(to right, #a08968, #c4b89a);
  box-shadow: 0 4px 12px rgba(181, 152, 106, 0.25);
  transform: scale(1.02);
}
.btn-gradient-primary:active {
  transform: scale(0.98);
  box-shadow: 0 1px 4px rgba(181, 152, 106, 0.2);
}

/* 主要按鈕 - 柔和漸層（參考記帳頁面） */
.btn-morandi-primary {
  background: linear-gradient(to right, #b5986a, #d4c4a8);
  color: white;
  font-weight: 500;
  padding: 0.5rem 1.25rem;
  border-radius: 0.75rem;
  border: none;
  box-shadow: 0 2px 8px rgba(181, 152, 106, 0.15);
  transition: all 0.2s ease;
  cursor: pointer;
}

.btn-morandi-primary:hover {
  background: linear-gradient(to right, #a08968, #c4b89a);
  box-shadow: 0 4px 12px rgba(181, 152, 106, 0.25);
  transform: scale(1.02);
}

.btn-morandi-primary:active {
  transform: scale(0.98);
  box-shadow: 0 1px 4px rgba(181, 152, 106, 0.2);
}

/* 次要按鈕 - 淡雅半透明（參考記帳頁面） */
.btn-morandi-secondary {
  background: rgba(255, 255, 255, 0.8);
  color: var(--morandi-gold);
  font-weight: 500;
  padding: 0.5rem 1.25rem;
  border-radius: 0.75rem;
  border: 1px solid rgba(228, 221, 212, 0.5);
  transition: all 0.2s ease;
  cursor: pointer;
}

.btn-morandi-secondary:hover {
  background: rgba(255, 255, 255, 1);
  border-color: var(--morandi-gold);
  transform: scale(1.02);
  box-shadow: 0 2px 8px rgba(181, 152, 106, 0.1);
}

.btn-morandi-secondary:active {
  transform: scale(0.98);
}

/* 圖標按鈕 - 精緻圓形 */
.btn-icon-morandi {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.5rem;
  background: linear-gradient(135deg, rgba(212, 197, 169, 0.1), rgba(201, 184, 150, 0.15));
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--morandi-gold);
  transition: all 0.3s ease;
  cursor: pointer;
}

.btn-icon-morandi:hover {
  background: linear-gradient(135deg, #d4c5a9, #c9b896, #bfad87);
  color: white;
  transform: scale(1.05);
  box-shadow: 0 4px 8px rgba(196, 165, 114, 0.25);
}

/* APP 選單按鈕樣式（側邊欄風格 - 參考記帳頁面） */
.menu-item-morandi {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 1rem;
  border-radius: 0.75rem;
  color: var(--morandi-secondary);
  background: transparent;
  transition: all 0.2s ease;
  cursor: pointer;
  border: none;
  width: 100%;
  text-align: left;
}

.menu-item-morandi:hover {
  background: rgba(181, 152, 106, 0.05);
  color: var(--morandi-primary);
}

.menu-item-morandi.active {
  background: rgba(181, 152, 106, 0.1);
  color: var(--morandi-gold);
  font-weight: 500;
  transform: scale(1.05);
}

.menu-item-morandi.active::after {
  content: '';
  position: absolute;
  right: 0;
  top: 20%;
  bottom: 20%;
  width: 3px;
  background: linear-gradient(to bottom, #b5986a, #d4c4a8);
  border-radius: 2px 0 0 2px;
}

/* 精緻卡片 - 柔和邊框（參考記帳頁面） */
.card-morandi-elevated {
  background: var(--card);
  border: 1px solid rgba(230, 221, 212, 0.5);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(181, 152, 106, 0.08);
  transition: all 0.2s ease;
}

.card-morandi-elevated:hover {
  border-color: rgba(181, 152, 106, 0.3);
  box-shadow: 0 4px 16px rgba(181, 152, 106, 0.12);
  transform: translateY(-2px);
}

/* 輸入框 - 精緻聚焦效果（參考記帳頁面） */
.input-morandi {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(230, 221, 212, 0.5);
  border-radius: 0.75rem;
  padding: 0.625rem 0.875rem;
  color: var(--morandi-primary);
  transition: all 0.2s ease;
  width: 100%;
}

.input-morandi::placeholder {
  color: rgba(139, 134, 128, 0.4);
}

.input-morandi:focus {
  outline: none;
  background: rgba(255, 255, 255, 1);
  border-color: var(--morandi-gold);
  box-shadow: 0 0 0 3px rgba(181, 152, 106, 0.1);
}

/* 標籤/徽章 - 柔和半透明（參考記帳頁面） */
.badge-morandi {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  background: rgba(181, 152, 106, 0.1);
  color: var(--morandi-gold);
  border: 1px solid rgba(181, 152, 106, 0.2);
}

/* 分隔線 - 優雅漸層 */
.divider-gradient {
  height: 1px;
  background: linear-gradient(
    to right,
    transparent,
    rgba(212, 197, 169, 0.4) 20%,
    rgba(201, 184, 150, 0.5) 50%,
    rgba(212, 197, 169, 0.4) 80%,
    transparent
  );
  border: none;
  margin: 1rem 0;
}

/* 下拉選單項目 */
.dropdown-item-morandi {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 1rem;
  color: var(--morandi-secondary);
  transition: all 0.2s ease;
  cursor: pointer;
  border-radius: 0.375rem;
}

.dropdown-item-morandi:hover {
  background: linear-gradient(135deg, rgba(212, 197, 169, 0.1), rgba(201, 184, 150, 0.15));
  color: var(--morandi-primary);
}

/* 工具提示氣泡 */
.tooltip-morandi {
  background: linear-gradient(135deg, #3a3633, #4a4540);
  color: rgba(255, 255, 255, 0.95);
  padding: 0.5rem 0.875rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(212, 197, 169, 0.2);
}

/* ============================================ 
   統一原生 HTML 表單元素樣式（全域）
   ============================================ */

/* 原生 <input> 統一樣式 */
input[type='text'],
input[type='email'],
input[type='password'],
input[type='number'],
input[type='tel'],
input[type='url'],
input[type='search'],
input[type='date'],
input[type='time'],
input[type='datetime-local'] {
  width: 100%;
  height: 2.5rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  line-height: 1.25rem;
  color: var(--input-text);
  background-color: var(--input-bg);
  border: 1px solid var(--input-border);
  border-radius: 0.375rem;
  transition: all 0.2s ease;
  outline: none;
}

/* 數字輸入自動加上最小值限制（防止負數） */
input[type='number'] {
  min: 0;
}

/* 移除數字輸入的上下箭頭 */
input[type='number']::-webkit-inner-spin-button,
input[type='number']::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type='number'] {
  -moz-appearance: textfield;
  appearance: textfield;
}

/* Placeholder 樣式 */
input::placeholder {
  color: var(--input-placeholder);
  opacity: 0.6;
}

/* Hover 狀態 */
input[type='text']:hover,
input[type='email']:hover,
input[type='password']:hover,
input[type='number']:hover,
input[type='tel']:hover,
input[type='url']:hover,
input[type='search']:hover,
input[type='date']:hover,
input[type='time']:hover,
input[type='datetime-local']:hover {
  border-color: var(--input-border-hover);
}

/* Focus 狀態 - 統一使用莫蘭迪金 */
input[type='text']:focus,
input[type='email']:focus,
input[type='password']:focus,
input[type='number']:focus,
input[type='tel']:focus,
input[type='url']:focus,
input[type='search']:focus,
input[type='date']:focus,
input[type='time']:focus,
input[type='datetime-local']:focus {
  border-color: var(--input-border-focus);
  box-shadow: 0 0 0 3px rgba(196, 165, 114, 0.1);
}

/* Disabled 狀態 */
input:disabled {
  background-color: var(--morandi-container);
  opacity: 0.6;
  cursor: not-allowed;
}

/* 原生 <select> 統一樣式 */
select {
  width: 100%;
  height: 2.5rem;
  padding: 0.5rem 2.5rem 0.5rem 0.75rem;
  font-size: 0.875rem;
  line-height: 1.25rem;
  color: var(--input-text);
  background-color: var(--input-bg);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%238B8680' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 12px;
  border: 1px solid var(--input-border);
  border-radius: 0.375rem;
  transition: all 0.2s ease;
  outline: none;
  appearance: none;
  cursor: pointer;
}

select:hover {
  border-color: var(--input-border-hover);
}

select:focus {
  border-color: var(--input-border-focus);
  box-shadow: 0 0 0 3px rgba(196, 165, 114, 0.1);
}

select:disabled {
  background-color: var(--morandi-container);
  opacity: 0.6;
  cursor: not-allowed;
}

/* 原生 <textarea> 統一樣式 */
textarea {
  width: 100%;
  min-height: 5rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  line-height: 1.5rem;
  color: var(--input-text);
  background-color: var(--input-bg);
  border: 1px solid var(--input-border);
  border-radius: 0.375rem;
  transition: all 0.2s ease;
  outline: none;
  resize: vertical;
}

textarea::placeholder {
  color: var(--input-placeholder);
  opacity: 0.6;
}

textarea:hover {
  border-color: var(--input-border-hover);
}

textarea:focus {
  border-color: var(--input-border-focus);
  box-shadow: 0 0 0 3px rgba(196, 165, 114, 0.1);
}

textarea:disabled {
  background-color: var(--morandi-container);
  opacity: 0.6;
  cursor: not-allowed;
}

/* 特殊情況：表格內嵌 input 保持透明背景 */
table input[type='text'],
table input[type='number'] {
  background-color: transparent;
  border: 0;
  padding: 0.25rem 0.5rem;
  height: auto;
}

table input[type='text']:focus,
table input[type='number']:focus {
  background-color: white;
  border: 1px solid var(--input-border-focus);
  box-shadow: none;
}

/* 深色主題的 select 下拉箭頭顏色 */
[data-theme='modern-dark'] select {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23b9bbbe' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
}

/* 手機預覽專用樣式 */
.mobile-preview-wrapper nav {
  position: relative !important;
}

.mobile-preview-wrapper .fixed {
  position: absolute !important;
}

/* 全屏相簿淡入動畫 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease-in-out;
}

/* ===== 出納單列印樣式 ===== */
@media print {
  @page {
    size: A4 landscape;
    margin: 10mm;
  }

  /* 隱藏所有非列印內容 */
  body > *:not(#__next),
  header,
  nav,
  aside,
  footer,
  .no-print,
  button,
  [data-radix-dialog-overlay],
  [data-radix-dialog-close] {
    display: none !important;
    visibility: hidden !important;
  }

  /* 重置基本樣式 */
  html,
  body {
    margin: 0 !important;
    padding: 0 !important;
    background: white !important;
    width: 100% !important;
    height: auto !important;
    overflow: visible !important;
  }

  /* 出納單列印容器 */
  #disbursement-print-container {
    display: block !important;
    visibility: visible !important;
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    width: 277mm !important;
    max-width: 277mm !important;
    padding: 5mm !important;
    margin: 0 !important;
    background: white !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    box-sizing: border-box !important;
    z-index: 999999 !important;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
  }

  #disbursement-print-container * {
    visibility: visible !important;
  }

  /* 表格樣式 */
  #disbursement-print-container table {
    width: 100% !important;
    font-size: 9pt !important;
    table-layout: fixed !important;
    border-collapse: collapse !important;
  }

  #disbursement-print-container th,
  #disbursement-print-container td {
    padding: 4px 6px !important;
    border: 1px solid #999 !important;
    word-wrap: break-word !important;
    font-size: 9pt !important;
    vertical-align: middle !important;
  }

  #disbursement-print-container thead th {
    background-color: #eee !important;
    font-weight: bold !important;
    border-bottom: 2px solid #666 !important;
  }

  #disbursement-print-container tbody tr {
    page-break-inside: avoid !important;
  }

  #disbursement-print-container tfoot td {
    border-top: 2px solid #333 !important;
    font-weight: bold !important;
    font-size: 11pt !important;
  }

  /* 標題 */
  #disbursement-print-container h1 {
    font-size: 16pt !important;
    margin-bottom: 5mm !important;
  }

  /* 頁尾 */
  #disbursement-print-container .footer {
    margin-top: 8mm !important;
    font-size: 8pt !important;
    color: #666 !important;
  }
}
```
