#!/bin/bash
# ============================================================
# OpenClaw macOS .pkg 打包腳本
# 用法：bash scripts/installer-pkg/build.sh
# ============================================================

set -e

# ── 路徑 ──
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
OUTPUT_DIR="$SCRIPT_DIR/output"
SCRIPTS_DIR="$SCRIPT_DIR/scripts"
RESOURCES_DIR="$SCRIPT_DIR/resources"

PKG_ID="com.venturo.openclaw-installer"
PKG_VERSION="1.0.0"
COMPONENT_PKG="$OUTPUT_DIR/OpenClaw-Component.pkg"
FINAL_PKG="$OUTPUT_DIR/OpenClaw-Installer.pkg"
DMG_FILE="$OUTPUT_DIR/OpenClaw-Installer.dmg"

echo ""
echo "  ╔═══════════════════════════════════════╗"
echo "  ║   OpenClaw .pkg 打包工具              ║"
echo "  ╚═══════════════════════════════════════╝"
echo ""

# ── 清理舊檔 ──
rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"

# ── 確認 postinstall 有執行權限 ──
chmod +x "$SCRIPTS_DIR/postinstall"

# ── Step 1: 建立元件包（nopayload，只跑腳本）──
echo "  [1/3] 建立元件包..."
pkgbuild \
  --nopayload \
  --identifier "$PKG_ID" \
  --version "$PKG_VERSION" \
  --scripts "$SCRIPTS_DIR" \
  "$COMPONENT_PKG"

echo "        -> $COMPONENT_PKG"

# ── Step 2: 包裝成有 UI 的安裝精靈 ──
echo "  [2/3] 包裝安裝精靈..."
productbuild \
  --distribution "$SCRIPT_DIR/Distribution.xml" \
  --resources "$RESOURCES_DIR" \
  --package-path "$OUTPUT_DIR" \
  "$FINAL_PKG"

echo "        -> $FINAL_PKG"

# ── Step 3: 包成 .dmg ──
echo "  [3/3] 建立 DMG 映像檔..."

DMG_TEMP="$OUTPUT_DIR/dmg-temp"
mkdir -p "$DMG_TEMP"
cp "$FINAL_PKG" "$DMG_TEMP/"

hdiutil create \
  -volname "OpenClaw Installer" \
  -srcfolder "$DMG_TEMP" \
  -ov \
  -format UDZO \
  "$DMG_FILE"

rm -rf "$DMG_TEMP"
echo "        -> $DMG_FILE"

# ── 清理中間檔 ──
rm -f "$COMPONENT_PKG"

# ── 完成 ──
echo ""
echo "  ✔ 打包完成！"
echo ""
echo "  產出檔案："
echo "    .pkg  $FINAL_PKG"
echo "    .dmg  $DMG_FILE"
echo ""
echo "  檔案大小："
ls -lh "$FINAL_PKG" | awk '{print "    .pkg  " $5}'
ls -lh "$DMG_FILE" | awk '{print "    .dmg  " $5}'
echo ""
