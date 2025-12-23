import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/utils/logger';

// 使用 service role key 來管理使用者
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/auth/admin-reset-password - 管理員重置會員密碼
export async function POST(request: NextRequest) {
  try {
    const { email, new_password } = await request.json();

    if (!email || !new_password) {
      return NextResponse.json(
        { error: '缺少必要參數' },
        { status: 400 }
      );
    }

    if (new_password.length < 6) {
      return NextResponse.json(
        { error: '密碼至少需要 6 個字元' },
        { status: 400 }
      );
    }

    // 先透過 email 找到使用者
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      logger.error('List users error:', listError);
      return NextResponse.json(
        { error: '查詢使用者失敗' },
        { status: 500 }
      );
    }

    const user = users.users.find((u) => u.email === email);

    if (!user) {
      return NextResponse.json(
        { error: '找不到此電子郵件的使用者' },
        { status: 404 }
      );
    }

    // 使用 admin API 更新密碼
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: new_password }
    );

    if (updateError) {
      logger.error('Update password error:', updateError);
      return NextResponse.json(
        { error: '重置密碼失敗：' + updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '密碼已重置成功'
    });
  } catch (error) {
    logger.error('Admin reset password error:', error);
    return NextResponse.json(
      { error: '伺服器錯誤' },
      { status: 500 }
    );
  }
}
