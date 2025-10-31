#!/usr/bin/env node

/**
 * Venturo 快速測試腳本
 * 執行方式: node scripts/quick-test.js
 */

const https = require('https');

const PROD_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://venturo.vercel.app';
const DEV_URL = 'http://localhost:3000';

const testMode = process.argv[2] || 'dev';
const BASE_URL = testMode === 'prod' ? PROD_URL : DEV_URL;

console.log(`\n🔍 Venturo 快速測試 - ${testMode === 'prod' ? '生產環境' : '開發環境'}`);
console.log(`📍 測試網址: ${BASE_URL}\n`);

// 要測試的頁面路徑
const routes = [
  { path: '/', name: '首頁' },
  { path: '/login', name: '登入頁' },
  { path: '/todos', name: '待辦事項' },
  { path: '/calendar', name: '行事曆' },
  { path: '/workspace', name: '工作空間' },
  { path: '/tours', name: '旅遊團管理' },
  { path: '/customers', name: '客戶管理' },
  { path: '/quotes', name: '報價單' },
  { path: '/finance', name: '財務管理' },
  { path: '/database', name: '資料庫' },
  { path: '/hr', name: '人事管理' },
];

// 測試單個頁面
async function testRoute(route) {
  return new Promise((resolve) => {
    const url = new URL(route.path, BASE_URL);
    const startTime = Date.now();

    const req = (url.protocol === 'https:' ? https : require('http')).get(
      url.toString(),
      { timeout: 10000 },
      (res) => {
        const duration = Date.now() - startTime;
        const status = res.statusCode;

        let result = {
          path: route.path,
          name: route.name,
          status: status,
          duration: duration,
          ok: status === 200 || status === 302 || status === 307,
        };

        // 讀取回應內容（檢查是否有錯誤訊息）
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          // 檢查是否包含常見錯誤關鍵字
          const hasError =
            body.includes('Application Error') ||
            body.includes('500') ||
            body.includes('Internal Server Error');

          if (hasError) {
            result.ok = false;
            result.error = '頁面包含錯誤訊息';
          }

          resolve(result);
        });
      }
    );

    req.on('error', (err) => {
      resolve({
        path: route.path,
        name: route.name,
        status: 0,
        duration: Date.now() - startTime,
        ok: false,
        error: err.message,
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        path: route.path,
        name: route.name,
        status: 0,
        duration: 10000,
        ok: false,
        error: '請求超時（> 10秒）',
      });
    });
  });
}

// 執行所有測試
async function runTests() {
  const results = [];

  for (const route of routes) {
    const result = await testRoute(route);
    results.push(result);

    // 即時顯示結果
    const icon = result.ok ? '✅' : '❌';
    const statusStr = result.status > 0 ? result.status : 'FAIL';
    const durationStr = `${result.duration}ms`;

    console.log(
      `${icon} ${result.name.padEnd(15)} [${statusStr}] ${durationStr.padStart(8)} ${result.error || ''}`
    );
  }

  // 統計結果
  console.log('\n' + '='.repeat(60));
  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  const avgDuration = Math.round(totalDuration / results.length);

  console.log(`\n📊 測試摘要:`);
  console.log(`   總共: ${results.length} 個頁面`);
  console.log(`   通過: ${passed} 個 ✅`);
  console.log(`   失敗: ${failed} 個 ❌`);
  console.log(`   平均載入時間: ${avgDuration}ms`);

  if (failed > 0) {
    console.log(`\n⚠️  有 ${failed} 個頁面測試失敗，請檢查:`);
    results
      .filter((r) => !r.ok)
      .forEach((r) => {
        console.log(`   - ${r.name} (${r.path}): ${r.error || `HTTP ${r.status}`}`);
      });
  } else {
    console.log('\n🎉 所有頁面測試通過！');
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // 返回退出碼
  process.exit(failed > 0 ? 1 : 0);
}

// 執行測試
runTests().catch((err) => {
  console.error('測試執行失敗:', err);
  process.exit(1);
});
