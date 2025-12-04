import bcrypt from 'bcryptjs'

const JWT_SECRET = process.env.JWT_SECRET || 'venturo_app_jwt_secret_key_change_in_production_2024'

export interface AuthPayload {
  id: string
  employee_number: string
  permissions: string[]
  role: string
}

// 生成 token（瀏覽器相容版本，使用 base64 編碼）
// 注意：jsonwebtoken 只能在 Node.js 環境使用，這裡改用簡單的 base64 編碼
export function generateToken(payload: AuthPayload): string {
  // 在瀏覽器環境使用 base64 編碼
  return btoa(
    JSON.stringify({
      ...payload,
      exp: Date.now() + 8 * 60 * 60 * 1000, // 8小時
      iss: 'venturo-app',
    })
  )
}

// 驗證 token（瀏覽器相容版本）
export function verifyToken(token: string): AuthPayload | null {
  try {
    // 使用 base64 解碼
    const decoded = JSON.parse(atob(token))

    // 檢查是否過期
    if (decoded.exp && Date.now() > decoded.exp) {
      return null
    }

    // 檢查 issuer
    if (decoded.iss !== 'venturo-app') {
      return null
    }

    return decoded as AuthPayload
  } catch {
    return null
  }
}

// 加密密碼
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return bcrypt.hash(password, saltRounds)
}

// 驗證密碼
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// 從 token 取得用戶資訊
export function getUserFromToken(token: string): AuthPayload | null {
  return verifyToken(token)
}

// 檢查權限
export function hasPermission(userPermissions: string[], requiredPermission: string): boolean {
  return userPermissions.includes(requiredPermission) || userPermissions.includes('admin') // 移除 super_admin，統一使用 admin
}

// 檢查角色
export function hasRole(userPermissions: string[], requiredRoles: string[]): boolean {
  return requiredRoles.some(role => userPermissions.includes(role))
}
