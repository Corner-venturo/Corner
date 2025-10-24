import bcrypt from 'bcryptjs';

/**
 * 密碼管理工具
 */
export class PasswordUtils {
  /**
   * 加密密碼
   */
  static async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  /**
   * 驗證密碼
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * 生成預設密碼
   * 格式：員工編號@當前年份
   */
  static generateDefaultPassword(employee_number: string): string {
    const year = new Date().getFullYear();
    return `${employee_number}@${year}`;
  }

  /**
   * 生成隨機密碼
   */
  static generateRandomPassword(length: number = 8): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }

  /**
   * 檢查密碼強度
   */
  static checkPasswordStrength(password: string): {
    score: number;
    message: string;
    isValid: boolean;
  } {
    let score = 0;
    const messages: string[] = [];

    // 長度檢查
    if (password.length >= 8) score += 1;
    else messages.push('密碼至少需要 8 個字元');

    if (password.length >= 12) score += 1;

    // 包含小寫字母
    if (/[a-z]/.test(password)) score += 1;
    else messages.push('需要包含小寫字母');

    // 包含大寫字母
    if (/[A-Z]/.test(password)) score += 1;
    else messages.push('需要包含大寫字母');

    // 包含數字
    if (/\d/.test(password)) score += 1;
    else messages.push('需要包含數字');

    // 包含特殊字符
    if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) score += 1;

    // 評分
    let strength = '弱';
    let isValid = false;

    if (score <= 2) {
      strength = '弱';
    } else if (score <= 4) {
      strength = '中等';
      isValid = true;
    } else {
      strength = '強';
      isValid = true;
    }

    const finalMessage = messages.length > 0 
      ? messages.join('、') 
      : `密碼強度：${strength}`;

    return {
      score,
      message: finalMessage,
      isValid
    };
  }

  /**
   * 檢查密碼是否過期（90天）
   */
  static isPasswordExpired(last_password_change?: string): boolean {
    if (!last_password_change) return true;

    const lastChange = new Date(last_password_change);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - lastChange.getTime()) / (1000 * 60 * 60 * 24));

    return daysDiff >= 90;
  }
}
