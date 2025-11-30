/**
 * Quick Login Token 工具
 * 使用 HMAC-SHA256 簽名防止偽造
 */

const QUICK_LOGIN_SECRET = process.env.QUICK_LOGIN_SECRET || 'venturo_quick_login_secret_2024_change_in_production'
const TOKEN_EXPIRY_MS = 8 * 60 * 60 * 1000 // 8 小時

/**
 * 產生 HMAC 簽名（瀏覽器端）
 */
async function generateHmacBrowser(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const keyData = encoder.encode(secret)
  const messageData = encoder.encode(message)

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign('HMAC', key, messageData)
  const hashArray = Array.from(new Uint8Array(signature))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * 產生 Quick Login Token（用於客戶端）
 * 格式：quick-login-v2-{profileId}-{timestamp}-{signature}
 */
export async function generateQuickLoginToken(profileId: string): Promise<string> {
  const timestamp = Date.now()
  const payload = `${profileId}-${timestamp}`
  const signature = await generateHmacBrowser(payload, QUICK_LOGIN_SECRET)

  return `quick-login-v2-${profileId}-${timestamp}-${signature}`
}

/**
 * 驗證 Quick Login Token（用於 middleware - Edge Runtime）
 */
export async function verifyQuickLoginToken(token: string): Promise<boolean> {
  // 支援舊版格式（只在過渡期）
  if (token.startsWith('quick-login-') && !token.startsWith('quick-login-v2-')) {
    // 舊版格式不再接受，強制重新登入
    return false
  }

  // 新版格式：quick-login-v2-{profileId}-{timestamp}-{signature}
  if (!token.startsWith('quick-login-v2-')) {
    return false
  }

  const parts = token.split('-')
  // 應該是 ['quick', 'login', 'v2', profileId, timestamp, signature]
  if (parts.length < 6) {
    return false
  }

  const profileId = parts[3]
  const timestamp = parseInt(parts[4])
  const providedSignature = parts.slice(5).join('-') // 處理 signature 可能包含 - 的情況

  // 檢查時間戳有效性
  if (isNaN(timestamp)) {
    return false
  }

  // 檢查是否過期
  if (Date.now() - timestamp > TOKEN_EXPIRY_MS) {
    return false
  }

  // 驗證簽名
  try {
    const payload = `${profileId}-${timestamp}`
    const encoder = new TextEncoder()
    const keyData = encoder.encode(QUICK_LOGIN_SECRET)
    const messageData = encoder.encode(payload)

    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )

    const signature = await crypto.subtle.sign('HMAC', key, messageData)
    const expectedSignature = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    return expectedSignature === providedSignature
  } catch {
    return false
  }
}
