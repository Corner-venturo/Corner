import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateTourCode(location: string, date: Date, isSpecial = false): string {
  if (isSpecial) {
    const dateStr = format(date, 'yyMMdd')
    return `SPC${dateStr}01`
  }

  const locationCodes: Record<string, string> = {
    'Tokyo': 'TYO',
    'Okinawa': 'OKA',
    'Osaka': 'OSA',
    'Kyoto': 'KYO',
    'Hokkaido': 'HOK',
  }

  const locationCode = locationCodes[location] || 'UNK'
  const dateStr = format(date, 'yyMMdd')
  const sequence = '01' // 實際應該從資料庫查詢當天同地點已有數量

  return `${locationCode}${dateStr}${sequence}`
}

// 根據身分證字號判斷性別 (僅台灣身分證字號)
export function getGenderFromIdNumber(idNumber: string): 'M' | 'F' | '' {
  if (!idNumber) return '';

  // 檢查是否為台灣身分證字號格式
  if (!validateIdNumber(idNumber)) {
    // 非台灣身分證字號，跳出通知
    if (typeof window !== 'undefined' && idNumber.length > 0) {
      alert('此身分證字號格式不符合台灣身分證系統，請手動輸入性別');
    }
    return '';
  }

  const secondDigit = idNumber.charAt(1);
  // 第二碼為1表示男性，2表示女性
  if (secondDigit === '1') {
    return 'M';
  } else if (secondDigit === '2') {
    return 'F';
  }
  return '';
}

// 根據生日和回團日期計算年齡
export function calculateAge(birthday: string, departure_date: string, return_date?: string): number {
  if (!birthday || !departure_date) return 0;

  const birth_date = new Date(birthday);
  // 優先使用回團日期，如果沒有則使用出發日期
  const referenceDate = return_date ? new Date(return_date) : new Date(departure_date);

  let age = referenceDate.getFullYear() - birth_date.getFullYear();
  const monthDiff = referenceDate.getMonth() - birth_date.getMonth();

  // 如果還沒到生日，年齡減1
  if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < birth_date.getDate())) {
    age--;
  }

  return age;
}

// 驗證身分證字號格式
export function validateIdNumber(idNumber: string): boolean {
  if (!idNumber) return false;

  // 台灣身分證格式：英文字母 + 9位數字
  const pattern = /^[A-Z]\d{9}$/;
  return pattern.test(idNumber);
}

// 驗證護照號碼格式
export function validatePassportNumber(passportNumber: string): boolean {
  if (!passportNumber) return false;

  // 台灣護照格式：數字 + 英文字母，總長8-9位
  const pattern = /^[0-9]{8,9}$|^[A-Z0-9]{8,9}$/;
  return pattern.test(passportNumber);
}