import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'venturo_app_jwt_secret_key_change_in_production_2024';

export interface AuthPayload {
  id: string;
  employee_number: string;
  permissions: string[];
  role: string;
}

// 生成 JWT token
export function generateToken(payload: AuthPayload): string {
  try {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: '8h',
      issuer: 'venturo-app'
    });
  } catch (error) {
        // 如果 JWT 失敗，使用簡單的編碼方案
    return btoa(JSON.stringify({
      ...payload,
      exp: Date.now() + 8 * 60 * 60 * 1000, // 8小時
      iss: 'venturo-app'
    }));
  }
}

// 驗證 JWT token
export function verifyToken(token: string): AuthPayload | null {
  try {
    // 嘗試 JWT 驗證
    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
    return decoded;
  } catch (_jwtError) {
    try {
      // 如果 JWT 失敗，嘗試簡單解碼
      const decoded = JSON.parse(atob(token));

      // 檢查是否過期
      if (decoded.exp && Date.now() > decoded.exp) {
        return null;
      }

      return decoded as AuthPayload;
    } catch (fallbackError) {
            return null;
    }
  }
}

// 加密密碼
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

// 驗證密碼
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// 從 token 取得用戶資訊
export function getUserFromToken(token: string): AuthPayload | null {
  return verifyToken(token);
}

// 檢查權限
export function hasPermission(userPermissions: string[], requiredPermission: string): boolean {
  return userPermissions.includes(requiredPermission) ||
         userPermissions.includes('admin'); // 移除 super_admin，統一使用 admin
}

// 檢查角色
export function hasRole(userPermissions: string[], requiredRoles: string[]): boolean {
  return requiredRoles.some(role => userPermissions.includes(role));
}