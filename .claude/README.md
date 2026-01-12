# 雙電腦同步指南

## 📦 已同步的檔案

### 0. .claude/VENTURO_VISION.md (最重要！)
- Venturo 雙平台願景文件
- 說明 ERP 與 Online 的關係
- 價值飛輪與資料流向
- **所有 AI 助手必讀**

### 1. TODO.md
- 專案待辦清單
- 包含所有緊急/重要/未來任務
- **更新頻率**: 每次工作結束前

### 2. .claude/CLAUDE.md
- Claude Code 工作規範
- 包含專案架構、開發規範、Supabase 設定
- **已同步到 Git**

### 3. src/lib/supabase/types.ts
- Supabase 資料庫型別定義
- 由 `supabase gen types` 自動產生
- **自動同步**

---

## 🔄 同步流程

### 離開公司前（電腦 A）
```bash
# 1. 更新待辦清單
vim TODO.md

# 2. 提交變更
git add TODO.md .claude/ src/
git commit -m "chore: 更新待辦進度 ($(date +%Y-%m-%d))"
git push
```

### 回家後（電腦 B）
```bash
# 1. 拉取最新版本
cd /Users/william/Projects/venturo-new
git pull

# 2. 查看今天的任務
cat TODO.md

# 3. 開始工作
npm run dev
```

---

## ⚠️ 注意事項

### 不要同步的檔案（已加入 .gitignore）
- `node_modules/`
- `.next/`
- `*.tsbuildinfo`
- `.env.local`
- `Corner/` （備份資料夾）

### 同步衝突處理
如果遇到 `git pull` 衝突：
```bash
# 1. 查看衝突檔案
git status

# 2. 如果是 TODO.md 衝突
#    優先使用遠端版本（公司電腦的最新版本）
git checkout --theirs TODO.md

# 3. 完成合併
git add TODO.md
git commit -m "fix: 解決 TODO.md 衝突"
```

---

## 🛠️ 常用指令

### 快速同步（公司 → 家）
```bash
# 公司電腦
git add . && git commit -m "chore: 工作進度同步" && git push

# 家裡電腦
git pull && cat TODO.md
```

### 檢查同步狀態
```bash
git status                    # 查看本地變更
git log --oneline -5          # 查看最近 5 次提交
git diff origin/main          # 查看與遠端的差異
```

### 緊急回退
```bash
git log --oneline -10         # 找到要回退的 commit
git reset --hard <commit-id>  # 回退到指定版本
git push --force              # 強制推送（慎用！）
```

---

## 📋 Git 提交訊息規範

```
feat: 新增功能
fix: 修復問題
chore: 雜項（更新待辦、同步進度）
docs: 文檔更新
refactor: 重構代碼
test: 測試相關
```

### 範例
```bash
git commit -m "feat: 新增箱型時間計時器功能"
git commit -m "fix: 修復 timebox-store 型別錯誤"
git commit -m "chore: 更新待辦進度 (2025-11-09)"
git commit -m "docs: 更新 Realtime 同步文檔"
```

---

**最後更新**: 2025-11-09
