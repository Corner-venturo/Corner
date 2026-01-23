#!/bin/bash
# 下載 PDF 所需的 Google Fonts TTF 檔案

FONT_DIR="/Users/williamchien/Projects/venturo-erp/public/assets/fonts"

echo "Downloading fonts to $FONT_DIR..."

# 創建目錄
mkdir -p "$FONT_DIR"

cd "$FONT_DIR"

# Noto Sans TC (中文黑體)
echo "Downloading Noto Sans TC..."
curl -L -o "NotoSansTC-Regular.ttf" "https://github.com/notofonts/noto-cjk/raw/main/Sans/OTF/TraditionalChinese/NotoSansCJKtc-Regular.otf" 2>/dev/null || \
curl -L -o "NotoSansTC-Regular.ttf" "https://fonts.gstatic.com/s/notosanstc/v35/-nFuOG829Oofr2wohFbTp9ifNAn722rq0MXz76Cy_CpOtma3uNQ.ttf" 2>/dev/null

curl -L -o "NotoSansTC-Bold.ttf" "https://github.com/notofonts/noto-cjk/raw/main/Sans/OTF/TraditionalChinese/NotoSansCJKtc-Bold.otf" 2>/dev/null || \
curl -L -o "NotoSansTC-Bold.ttf" "https://fonts.gstatic.com/s/notosanstc/v35/-nFuOG829Oofr2wohFbTp9ifNAn722rq0MXz76Cy_N9ItGa3uNQ.ttf" 2>/dev/null

# Noto Serif TC (中文宋體)
echo "Downloading Noto Serif TC..."
curl -L -o "NotoSerifTC-Regular.ttf" "https://fonts.gstatic.com/s/notoseriftc/v23/XLY9IZb5bJNDGYxLBibeHZ0BhnQ.ttf" 2>/dev/null
curl -L -o "NotoSerifTC-Bold.ttf" "https://fonts.gstatic.com/s/notoseriftc/v23/XLYgIZb5bJNDGYxLBibeHZ0Bvr8vbX9GTsoOAX4.ttf" 2>/dev/null

# LXGW WenKai TC (中文手寫)
echo "Downloading LXGW WenKai TC..."
curl -L -o "LXGWWenKaiTC-Regular.ttf" "https://github.com/lxgw/LxgwWenKai/releases/download/v1.330/LXGWWenKaiTC-Regular.ttf" 2>/dev/null
curl -L -o "LXGWWenKaiTC-Bold.ttf" "https://github.com/lxgw/LxgwWenKai/releases/download/v1.330/LXGWWenKaiTC-Bold.ttf" 2>/dev/null

# Inter (英文無襯線)
echo "Downloading Inter..."
curl -L -o "Inter-Regular.ttf" "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.ttf" 2>/dev/null
curl -L -o "Inter-Bold.ttf" "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hjp-Ek-_EeA.ttf" 2>/dev/null

# Playfair Display (英文襯線)
echo "Downloading Playfair Display..."
curl -L -o "PlayfairDisplay-Regular.ttf" "https://fonts.gstatic.com/s/playfairdisplay/v36/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvXDXbtXK-F2qC0s.ttf" 2>/dev/null
curl -L -o "PlayfairDisplay-Bold.ttf" "https://fonts.gstatic.com/s/playfairdisplay/v36/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvUDYbtXK-F2qC0s.ttf" 2>/dev/null

echo "Done! Fonts downloaded to $FONT_DIR"
ls -la "$FONT_DIR"
