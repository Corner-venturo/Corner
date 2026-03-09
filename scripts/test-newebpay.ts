/**
 * 測試藍新金流 API 連線
 * 執行: npx ts-node scripts/test-newebpay.ts
 */

import { aesEncrypt } from '../src/lib/newebpay/crypto'

const config = {
  merchantId: 'MS3814348716',
  hashKey: 'nPWXLUG3fjrtqZ05BAMcmzbE1kVeNWLZ',
  hashIV: 'PDCrxWEhXG0Se0PC',
}

// 正式環境
const API_URL = 'https://api.travelinvoice.com.tw/invoice_issue'

async function testConnection() {
  console.log('🔍 測試藍新金流 API 連線...\n')
  console.log('設定:', {
    merchantId: config.merchantId,
    hashKey: config.hashKey.slice(0, 4) + '****',
    hashIV: config.hashIV.slice(0, 4) + '****',
    url: API_URL,
  })

  // 組裝測試資料
  const testData = {
    Version: '1.1',
    TimeStamp: Math.floor(Date.now() / 1000),
    MerchantOrderNo: 'TEST' + Date.now(),
    Status: 1, // 即時開立
    Category: 'B2C',
    BuyerName: '測試客戶',
    BuyerEmail: 'test@example.com',
    SellerName: '系統管理員',
    TotalAmt: 100,
    ItemName: '測試商品',
    ItemCount: '1',
    ItemUnit: '式',
    ItemPrice: '100',
    ItemAmt: '100',
  }

  // 轉為 URL encoded
  const urlEncoded = Object.entries(testData)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&')

  console.log('\n📦 PostData (未加密):', urlEncoded.slice(0, 100) + '...')

  // 加密
  const encrypted = aesEncrypt(urlEncoded, config.hashKey, config.hashIV)
  console.log('🔐 PostData (加密後):', encrypted.slice(0, 50) + '...')

  // 發送請求
  console.log('\n📡 發送請求到:', API_URL)

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000) // 30秒超時

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        MerchantID_: config.merchantId,
        PostData_: encrypted,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    console.log('📬 HTTP Status:', response.status)
    console.log('📬 Headers:', Object.fromEntries(response.headers))

    const responseText = await response.text()
    console.log('\n📄 回應內容:')
    console.log(responseText)
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('❌ 請求超時（30秒）')
    } else {
      console.error('❌ 請求失敗:', error)
    }
  }
}

testConnection()
