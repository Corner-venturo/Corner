import { NextRequest, NextResponse } from 'next/server';
import { writeFileSync, appendFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const errorData = await request.json();
    
    // 創建 logs 目錄（如果不存在）
    const logsDir = join(process.cwd(), 'logs');
    if (!existsSync(logsDir)) {
      mkdirSync(logsDir, { recursive: true });
    }
    
    // 寫入錯誤日誌
    const logFile = join(logsDir, 'errors.json');
    const logEntry = JSON.stringify({
      ...errorData,
      userAgent: request.headers.get('user-agent'),
      url: request.headers.get('referer'),
    }) + '\n';
    
    if (existsSync(logFile)) {
      appendFileSync(logFile, logEntry);
    } else {
      writeFileSync(logFile, logEntry);
    }
    
    // 在開發模式下，也在控制台輸出
    if (process.env.NODE_ENV === 'development') {
      console.log('📝 Error logged:', errorData);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to log error:', error);
    return NextResponse.json({ error: 'Failed to log error' }, { status: 500 });
  }
}