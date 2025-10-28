#!/usr/bin/env node

/**
 * 上傳城市背景圖到 Supabase Storage 並更新資料庫
 * 用途：將下載的圖片上傳到 Supabase Storage，並更新 cities 表的 background_image_url
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase 設定
const SUPABASE_URL = 'https://pfqvdacxowpgfamuvnsn.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ 錯誤: 需要設定 SUPABASE_SERVICE_KEY 或 SUPABASE_ANON_KEY 環境變數');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// 城市 ID 列表
const cityIds = [
  'tokyo', 'kyoto', 'osaka', 'sapporo', 'naha', 'fukuoka',
  'yokohama', 'kobe', 'kumamoto', 'nagasaki',
  'bangkok', 'chiang-mai', 'phuket',
  'seoul', 'busan', 'jeju',
  'cebu', 'boracay'
];

async function uploadImage(cityId, filepath) {
  const fileBuffer = await fs.readFile(filepath);
  const filename = `${cityId}.jpg`;

  // 上傳到 Supabase Storage
  const { data, error } = await supabase.storage
    .from('city-backgrounds')
    .upload(filename, fileBuffer, {
      contentType: 'image/jpeg',
      upsert: true  // 如果已存在則覆蓋
    });

  if (error) {
    throw error;
  }

  // 取得公開 URL
  const { data: urlData } = supabase.storage
    .from('city-backgrounds')
    .getPublicUrl(filename);

  return urlData.publicUrl;
}

async function updateCityBackgroundUrl(cityId, imageUrl) {
  const { error } = await supabase
    .from('cities')
    .update({ background_image_url: imageUrl })
    .eq('id', cityId);

  if (error) {
    throw error;
  }
}

async function main() {
  const inputDir = path.join(__dirname, '../public/city-backgrounds');

  console.log('🚀 開始上傳城市背景圖到 Supabase Storage...\n');

  let successCount = 0;
  let errorCount = 0;

  for (const cityId of cityIds) {
    const filepath = path.join(inputDir, `${cityId}.jpg`);

    try {
      // 檢查檔案是否存在
      await fs.access(filepath);

      console.log(`📤 上傳中: ${cityId}`);

      // 上傳圖片
      const publicUrl = await uploadImage(cityId, filepath);
      console.log(`✅ 上傳成功: ${publicUrl}`);

      // 更新資料庫
      await updateCityBackgroundUrl(cityId, publicUrl);
      console.log(`✅ 資料庫更新成功\n`);

      successCount++;
    } catch (error) {
      console.error(`❌ 失敗: ${cityId} - ${error.message}\n`);
      errorCount++;
    }
  }

  console.log('\n📊 上傳完成統計:');
  console.log(`✅ 成功: ${successCount} 個`);
  console.log(`❌ 失敗: ${errorCount} 個`);
}

main().catch(console.error);
