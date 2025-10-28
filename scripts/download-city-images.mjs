#!/usr/bin/env node

/**
 * 下載城市背景圖並上傳到 Supabase Storage
 * 用途：將 constants.ts 中的 Unsplash 圖片下載並遷移到 Supabase Storage
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 城市圖片對照表（從 constants.ts 複製）
const cityImages = {
  // 日本
  "東京": "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200&q=75&auto=format&fit=crop",
  "京都": "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&q=75&auto=format&fit=crop",
  "大阪": "https://images.unsplash.com/photo-1590559899731-a382839e5549?w=1200&q=75&auto=format&fit=crop",
  "札幌": "https://images.unsplash.com/photo-1562828119-19e7a4f8b913?w=1200&q=75&auto=format&fit=crop",
  "沖繩": "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200&q=75&auto=format&fit=crop",
  "名古屋": "https://images.unsplash.com/photo-1554797589-7241bb691973?w=1200&q=75&auto=format&fit=crop",
  "福岡": "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=1200&q=75&auto=format&fit=crop",
  "廣島": "https://images.unsplash.com/photo-1578469550956-0e16b69c6a3d?w=1200&q=75&auto=format&fit=crop",
  "橫濱": "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200&q=75&auto=format&fit=crop",
  "神戶": "https://images.unsplash.com/photo-1590559899731-a382839e5549?w=1200&q=75&auto=format&fit=crop",
  "熊本": "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=1200&q=75&auto=format&fit=crop",
  "長崎": "https://images.unsplash.com/photo-1578469550956-0e16b69c6a3d?w=1200&q=75&auto=format&fit=crop",
  "那霸": "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200&q=75&auto=format&fit=crop",

  // 泰國
  "曼谷": "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=1200&q=75&auto=format&fit=crop",
  "清邁": "https://images.unsplash.com/photo-1519451241324-20b4ea2c4220?w=1200&q=75&auto=format&fit=crop",
  "普吉島": "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=1200&q=75&auto=format&fit=crop",

  // 韓國
  "首爾": "https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=1200&q=75&auto=format&fit=crop",
  "釜山": "https://images.unsplash.com/photo-1574923548835-6b2b6dee4f1a?w=1200&q=75&auto=format&fit=crop",
  "濟州島": "https://images.unsplash.com/photo-1630160184476-e8bdc8e97c51?w=1200&q=75&auto=format&fit=crop",

  // 菲律賓
  "宿務": "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200&q=75&auto=format&fit=crop",
  "長灘島": "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200&q=75&auto=format&fit=crop",
};

// 城市 ID 對照表（中文名稱 → 資料庫 ID）
const cityIdMap = {
  "東京": "tokyo",
  "京都": "kyoto",
  "大阪": "osaka",
  "札幌": "sapporo",
  "沖繩": "naha",
  "名古屋": "nagoya",
  "福岡": "fukuoka",
  "廣島": "hiroshima",
  "橫濱": "yokohama",
  "神戶": "kobe",
  "熊本": "kumamoto",
  "長崎": "nagasaki",
  "那霸": "naha",
  "曼谷": "bangkok",
  "清邁": "chiang-mai",
  "普吉島": "phuket",
  "首爾": "seoul",
  "釜山": "busan",
  "濟州島": "jeju",
  "宿務": "cebu",
  "長灘島": "boracay",
};

// 下載圖片
async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.open(filepath, 'w');

    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }

      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', async () => {
        const buffer = Buffer.concat(chunks);
        await fs.writeFile(filepath, buffer);
        resolve(filepath);
      });
    }).on('error', reject);
  });
}

async function main() {
  const outputDir = path.join(__dirname, '../public/city-backgrounds');

  // 建立輸出目錄
  await fs.mkdir(outputDir, { recursive: true });

  console.log('🚀 開始下載城市背景圖...\n');

  let successCount = 0;
  let errorCount = 0;

  for (const [cityName, imageUrl] of Object.entries(cityImages)) {
    const cityId = cityIdMap[cityName];
    if (!cityId) {
      console.log(`⚠️  跳過: ${cityName} (無對應 ID)`);
      continue;
    }

    const filename = `${cityId}.jpg`;
    const filepath = path.join(outputDir, filename);

    try {
      console.log(`📥 下載中: ${cityName} (${cityId})`);
      await downloadImage(imageUrl, filepath);
      console.log(`✅ 成功: ${filename}\n`);
      successCount++;
    } catch (error) {
      console.error(`❌ 失敗: ${cityName} - ${error.message}\n`);
      errorCount++;
    }
  }

  console.log('\n📊 下載完成統計:');
  console.log(`✅ 成功: ${successCount} 個`);
  console.log(`❌ 失敗: ${errorCount} 個`);
  console.log(`📁 輸出目錄: ${outputDir}`);
  console.log('\n下一步: 執行 upload-city-images.mjs 上傳到 Supabase Storage');
}

main().catch(console.error);
