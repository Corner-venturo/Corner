#!/bin/bash
# ============================================================
# OpenClaw Installer — 專業安裝程式
# 用法：curl 下載後執行，或直接 bash setup-openclaw.sh
# ============================================================

set -e

# ── 顏色 & 樣式 ──
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
DIM='\033[2m'
BOLD='\033[1m'
WHITE='\033[1;37m'
BG_GREEN='\033[42m'
BG_CYAN='\033[46m'
NC='\033[0m'

# ── 變數 ──
step=0
total_steps=6
results=()  # 儲存每步結果

# ── 動畫 spinner ──
spinner() {
  local pid=$1
  local msg=$2
  local frames=("⠋" "⠙" "⠹" "⠸" "⠼" "⠴" "⠦" "⠧" "⠇" "⠏")
  local i=0
  tput civis  # 隱藏游標
  while kill -0 "$pid" 2>/dev/null; do
    printf "\r  ${CYAN}${frames[$i]}${NC} %s" "$msg"
    i=$(( (i + 1) % ${#frames[@]} ))
    sleep 0.08
  done
  tput cnorm  # 恢復游標
  printf "\r"
}

# ── 進度條 ──
progress_bar() {
  local current=$1
  local total=$2
  local width=40
  local pct=$((current * 100 / total))
  local filled=$((current * width / total))
  local empty=$((width - filled))

  local bar=""
  for ((i=0; i<filled; i++)); do bar+="█"; done
  for ((i=0; i<empty; i++)); do bar+="░"; done

  printf "  ${DIM}[${NC}${GREEN}%s${NC}${DIM}%s${NC}${DIM}]${NC} ${WHITE}%3d%%${NC}" \
    "$(printf '█%.0s' $(seq 1 $filled 2>/dev/null) 2>/dev/null)" \
    "$(printf '░%.0s' $(seq 1 $empty 2>/dev/null) 2>/dev/null)" \
    "$pct"
}

draw_progress() {
  local current=$1
  local total=$2
  local width=40
  local pct=$((current * 100 / total))
  local filled=$((current * width / total))
  local empty=$((width - filled))

  local bar_filled=""
  local bar_empty=""
  for ((i=0; i<filled; i++)); do bar_filled+="█"; done
  for ((i=0; i<empty; i++)); do bar_empty+="░"; done

  echo -e "  ${DIM}[${NC}${GREEN}${bar_filled}${NC}${DIM}${bar_empty}]${NC} ${WHITE}${pct}%%${NC}"
}

# ── 輸出工具 ──
print_header() {
  step=$((step + 1))
  echo ""
  echo -e "  ${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "  ${WHITE}${BOLD}  STEP $step/$total_steps${NC}  ${BOLD}$1${NC}"
  echo -e "  ${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_ok() {
  echo -e "  ${GREEN}✔${NC}  $1"
  results+=("${GREEN}✔${NC}  $1")
}

print_skip() {
  echo -e "  ${YELLOW}◉${NC}  $1 ${DIM}(已安裝)${NC}"
  results+=("${YELLOW}◉${NC}  $1 ${DIM}(已安裝)${NC}")
}

print_fail() {
  echo -e "  ${RED}✘${NC}  $1"
  results+=("${RED}✘${NC}  $1")
}

print_info() {
  echo -e "  ${DIM}│${NC}  $1"
}

# ── 清除畫面 & 顯示 Logo ──
clear
echo ""
echo -e "${CYAN}"
cat << 'LOGO'
     ╔═══════════════════════════════════════════╗
     ║                                           ║
     ║    ░█▀█░█▀█░█▀▀░█▀█░█▀▀░█░░░█▀█░█░█░    ║
     ║    ░█░█░█▀▀░█▀▀░█░█░█░░░█░░░█▀█░█▄█░    ║
     ║    ░▀▀▀░▀░░░▀▀▀░▀░▀░▀▀▀░▀▀▀░▀░▀░▀░▀░    ║
     ║                                           ║
     ║            🐾  I N S T A L L E R          ║
     ║                                           ║
     ╚═══════════════════════════════════════════╝
LOGO
echo -e "${NC}"
echo -e "  ${DIM}Version 1.0  ·  Venturo Team${NC}"
echo ""
echo -e "  ${WHITE}${BOLD}安裝項目${NC}"
echo ""
echo -e "  ${DIM}┌──────────────────────────────────────┐${NC}"
echo -e "  ${DIM}│${NC}  1. Homebrew      ${DIM}套件管理器${NC}         ${DIM}│${NC}"
echo -e "  ${DIM}│${NC}  2. Node.js 22    ${DIM}JavaScript 執行環境${NC}${DIM}│${NC}"
echo -e "  ${DIM}│${NC}  3. pnpm          ${DIM}快速套件管理器${NC}     ${DIM}│${NC}"
echo -e "  ${DIM}│${NC}  4. OpenClaw      ${DIM}AI Agent 框架${NC}     ${DIM}│${NC}"
echo -e "  ${DIM}│${NC}  5. Claude API    ${DIM}AI 服務設定${NC}       ${DIM}│${NC}"
echo -e "  ${DIM}│${NC}  6. 驗證          ${DIM}確認安裝結果${NC}      ${DIM}│${NC}"
echo -e "  ${DIM}└──────────────────────────────────────┘${NC}"
echo ""
draw_progress 0 $total_steps
echo ""
echo -e "  ${DIM}按 Enter 開始安裝，Ctrl+C 取消${NC}"
read -r

# ══════════════════════════════════════════════
# Step 1: Homebrew
# ══════════════════════════════════════════════
print_header "安裝 Homebrew"

if command -v brew &>/dev/null; then
  print_skip "Homebrew $(brew --version | head -1 | awk '{print $2}')"
else
  print_info "正在下載並安裝 Homebrew..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

  # Apple Silicon 需要加 PATH
  if [[ $(uname -m) == "arm64" ]]; then
    print_info "設定 Homebrew PATH (Apple Silicon)..."
    echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
    eval "$(/opt/homebrew/bin/brew shellenv)"
  fi

  if command -v brew &>/dev/null; then
    print_ok "Homebrew 安裝完成"
  else
    print_fail "Homebrew 安裝失敗"
    exit 1
  fi
fi

draw_progress 1 $total_steps
sleep 0.3

# ══════════════════════════════════════════════
# Step 2: Node.js 22
# ══════════════════════════════════════════════
print_header "安裝 Node.js 22"

node_version=""
node_major=0
if command -v node &>/dev/null; then
  node_version=$(node --version 2>/dev/null | sed 's/v//')
  node_major=$(echo "$node_version" | cut -d. -f1)
fi

if [[ "$node_major" -ge 22 ]]; then
  print_skip "Node.js v$node_version"
else
  if [[ -n "$node_version" ]]; then
    print_info "目前版本 v$node_version → 升級到 22..."
  else
    print_info "正在安裝 Node.js 22..."
  fi

  brew install node@22 &
  spinner $! "安裝 Node.js 22 中..."
  wait $! 2>/dev/null
  brew link --force --overwrite node@22 2>/dev/null || true

  if command -v node &>/dev/null; then
    new_version=$(node --version | sed 's/v//')
    print_ok "Node.js v$new_version"
  else
    print_fail "Node.js 安裝失敗"
    exit 1
  fi
fi

draw_progress 2 $total_steps
sleep 0.3

# ══════════════════════════════════════════════
# Step 3: pnpm
# ══════════════════════════════════════════════
print_header "安裝 pnpm"

if command -v pnpm &>/dev/null; then
  print_skip "pnpm v$(pnpm --version)"
else
  print_info "正在安裝 pnpm..."

  npm install -g pnpm &
  spinner $! "安裝 pnpm 中..."
  wait $! 2>/dev/null

  pnpm setup 2>/dev/null || true
  export PNPM_HOME="$HOME/.local/share/pnpm"
  export PATH="$PNPM_HOME:$PATH"

  if command -v pnpm &>/dev/null; then
    print_ok "pnpm v$(pnpm --version)"
  else
    print_ok "pnpm 已安裝 ${DIM}(重開終端機後生效)${NC}"
  fi
fi

draw_progress 3 $total_steps
sleep 0.3

# ══════════════════════════════════════════════
# Step 4: OpenClaw
# ══════════════════════════════════════════════
print_header "安裝 OpenClaw"

if command -v openclaw &>/dev/null; then
  existing_ver=$(openclaw --version 2>/dev/null || echo "unknown")
  print_info "已安裝 OpenClaw $existing_ver"
  read -p "  要重新安裝最新版嗎？(y/N) " reinstall
  if [[ "$reinstall" =~ ^[Yy]$ ]]; then
    (pnpm install -g openclaw@latest || npm install -g openclaw@latest) &
    spinner $! "更新 OpenClaw 中..."
    wait $! 2>/dev/null
    print_ok "OpenClaw 已更新到最新版"
  else
    print_skip "OpenClaw $existing_ver"
  fi
else
  print_info "正在安裝 OpenClaw..."

  (pnpm install -g openclaw@latest 2>/dev/null || npm install -g openclaw@latest) &
  spinner $! "安裝 OpenClaw 中..."
  wait $! 2>/dev/null

  if command -v openclaw &>/dev/null; then
    print_ok "OpenClaw $(openclaw --version 2>/dev/null)"
  else
    print_fail "OpenClaw 安裝失敗"
    exit 1
  fi
fi

draw_progress 4 $total_steps
sleep 0.3

# ══════════════════════════════════════════════
# Step 5: 設定 Anthropic Claude API
# ══════════════════════════════════════════════
print_header "設定 Claude API"

config_dir="$HOME/.openclaw"
config_file="$config_dir/openclaw.json"

mkdir -p "$config_dir"

# 檢查是否已有設定
existing_key=""
if [[ -f "$config_file" ]]; then
  existing_key=$(python3 -c "import json; c=json.load(open('$config_file')); print(c.get('llm',{}).get('apiKey',''))" 2>/dev/null || echo "")
fi

if [[ -n "$existing_key" && "$existing_key" != "" ]]; then
  masked="${existing_key:0:7}...${existing_key: -4}"
  print_info "已有 API Key: ${WHITE}$masked${NC}"
  read -p "  要更換嗎？(y/N) " change_key
  if [[ ! "$change_key" =~ ^[Yy]$ ]]; then
    print_skip "API Key 保持不變"
  else
    existing_key=""
  fi
fi

if [[ -z "$existing_key" || "$existing_key" == "" ]]; then
  echo ""
  echo -e "  ${DIM}┌──────────────────────────────────────┐${NC}"
  echo -e "  ${DIM}│${NC}  ${WHITE}請輸入 Anthropic API Key${NC}             ${DIM}│${NC}"
  echo -e "  ${DIM}│${NC}                                      ${DIM}│${NC}"
  echo -e "  ${DIM}│${NC}  ${DIM}取得方式：${NC}                            ${DIM}│${NC}"
  echo -e "  ${DIM}│${NC}  ${CYAN}console.anthropic.com/settings/keys${NC} ${DIM}│${NC}"
  echo -e "  ${DIM}└──────────────────────────────────────┘${NC}"
  echo ""
  read -sp "  🔑 API Key: " api_key
  echo ""

  if [[ -z "$api_key" ]]; then
    print_fail "未輸入 API Key（稍後可手動設定）"
  else
    cat > "$config_file" << JSONEOF
{
  "llm": {
    "provider": "anthropic",
    "model": "claude-sonnet-4-20250514",
    "displayModel": "Claude Sonnet 4",
    "apiKey": "$api_key"
  }
}
JSONEOF
    print_ok "Claude API 設定完成"
  fi
fi

# 寫入環境變數
if [[ -n "$api_key" ]]; then
  if ! grep -q "ANTHROPIC_API_KEY" ~/.zprofile 2>/dev/null; then
    echo "export ANTHROPIC_API_KEY=\"$api_key\"" >> ~/.zprofile
    export ANTHROPIC_API_KEY="$api_key"
    print_ok "環境變數 ANTHROPIC_API_KEY 已設定"
  fi
fi

draw_progress 5 $total_steps
sleep 0.3

# ══════════════════════════════════════════════
# Step 6: 驗證
# ══════════════════════════════════════════════
print_header "驗證安裝結果"

all_good=true

echo ""
# Node
if command -v node &>/dev/null; then
  print_ok "Node.js $(node --version)"
else
  print_fail "Node.js 未找到"
  all_good=false
fi

# pnpm
if command -v pnpm &>/dev/null; then
  print_ok "pnpm v$(pnpm --version)"
else
  echo -e "  ${YELLOW}◉${NC}  pnpm ${DIM}(重開終端機後可用)${NC}"
fi

# OpenClaw
if command -v openclaw &>/dev/null; then
  print_ok "OpenClaw $(openclaw --version 2>/dev/null)"
else
  print_fail "OpenClaw 未找到"
  all_good=false
fi

# Config
if [[ -f "$config_file" ]]; then
  print_ok "設定檔 ~/.openclaw/openclaw.json"
else
  print_fail "設定檔未建立"
  all_good=false
fi

draw_progress 6 $total_steps
sleep 0.5

# ══════════════════════════════════════════════
# 完成畫面
# ══════════════════════════════════════════════
echo ""
echo ""
if $all_good; then
  echo -e "${GREEN}"
  cat << 'DONE'
     ╔═══════════════════════════════════════════╗
     ║                                           ║
     ║         ✔  安 裝 完 成                    ║
     ║                                           ║
     ║   所有元件已成功安裝到您的 Mac             ║
     ║                                           ║
     ╚═══════════════════════════════════════════╝
DONE
  echo -e "${NC}"
  echo -e "  ${WHITE}${BOLD}快速開始${NC}"
  echo ""
  echo -e "  ${DIM}┌──────────────────────────────────────┐${NC}"
  echo -e "  ${DIM}│${NC}                                      ${DIM}│${NC}"
  echo -e "  ${DIM}│${NC}  ${CYAN}\$ openclaw${NC}          ${DIM}啟動 OpenClaw${NC}   ${DIM}│${NC}"
  echo -e "  ${DIM}│${NC}  ${CYAN}\$ openclaw --help${NC}   ${DIM}查看指令${NC}       ${DIM}│${NC}"
  echo -e "  ${DIM}│${NC}                                      ${DIM}│${NC}"
  echo -e "  ${DIM}└──────────────────────────────────────┘${NC}"
else
  echo -e "${YELLOW}"
  cat << 'WARN'
     ╔═══════════════════════════════════════════╗
     ║                                           ║
     ║      ⚠  部分項目需要注意                  ║
     ║                                           ║
     ║   請檢查上方標記 ✘ 的項目                 ║
     ║                                           ║
     ╚═══════════════════════════════════════════╝
WARN
  echo -e "${NC}"
fi
echo ""
echo -e "  ${DIM}── Venturo Team · $(date +%Y) ──${NC}"
echo ""
