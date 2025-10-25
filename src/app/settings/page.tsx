'use client';

import { useState, useEffect } from 'react';
import { useThemeStore } from '@/stores/theme-store';
import { useAuthStore } from '@/stores/auth-store';
import { ResponsiveHeader } from '@/components/layout/responsive-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Palette, Sun, Moon, User, LogOut, Check, EyeOff, Eye, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/utils/logger';

// 強制客戶端渲染，不預取伺服器資料
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export default function SettingsPage() {
  const { currentTheme, setTheme } = useThemeStore();
  const { user, logout } = useAuthStore();
  const [isPageReady, setIsPageReady] = useState(false);

  // 快速載入頁面（不等待任何非同步操作）
  useEffect(() => {
    setIsPageReady(true);
  }, []);

  // 密碼修改狀態
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [passwordUpdateLoading, setPasswordUpdateLoading] = useState(false);

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const handlePasswordUpdate = async () => {
    if (!user) {
      alert('請先登入');
      return;
    }

    if (!passwordData.currentPassword) {
      alert('請輸入目前密碼！');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('新密碼與確認密碼不符！');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      alert('密碼長度至少需要8個字元！');
      return;
    }

    // 檢查網路狀態
    if (!navigator.onLine) {
      alert('⚠️ 目前離線，無法修改密碼。請連接網路後再試。');
      return;
    }

    setPasswordUpdateLoading(true);

    try {
      // 動態導入（只在需要時載入）
      const [authModule, supabaseModule] = await Promise.all([
        import('@/lib/auth'),
        import('@/lib/supabase/client')
      ]);

      const { hashPassword, verifyPassword } = authModule;
      const { supabase } = supabaseModule;

      // 1. 驗證目前密碼
      const { data: userData, error: fetchError } = await supabase
        .from('employees')
        .select('password_hash')
        .eq('employee_number', user.employee_number)
        .single();

      if (fetchError || !userData) {
        alert('驗證失敗，請稍後再試');
        setPasswordUpdateLoading(false);
        return;
      }

      const isPasswordValid = await verifyPassword(passwordData.currentPassword, (userData as any).password_hash);
      if (!isPasswordValid) {
        alert('目前密碼錯誤！');
        setPasswordUpdateLoading(false);
        return;
      }

      // 2. 更新新密碼
      const hashedPassword = await hashPassword(passwordData.newPassword);

      const result: unknown = await (supabase as any)
        .from('employees')
        .update({ password_hash: hashedPassword })
        .eq('employee_number', user.employee_number);

      const { error } = result;

      if (error) {
        logger.error('密碼更新失敗:', error);
        alert('密碼更新失敗：' + error.message);
        setPasswordUpdateLoading(false);
        return;
      }

      // 3. 清除角色卡（重要！否則舊密碼還能登入）
      try {
        const { useLocalAuthStore } = await import('@/lib/auth/local-auth-manager');
        const localAuthStore = useLocalAuthStore.getState();

        // 刪除當前用戶的角色卡
        localAuthStore.removeProfile(user.id);
        logger.log('🗑️ 已刪除角色卡，下次登入需從網路驗證');
      } catch (profileError) {
        logger.warn('⚠️ 清除角色卡失敗（不影響密碼更新）:', profileError);
      }

      // 4. 同步更新 IndexedDB 的密碼
      try {
        const { localDB } = await import('@/lib/db');
        const { TABLES } = await import('@/lib/db/schemas');

        const employee = await localDB.read(TABLES.EMPLOYEES, user.id) as any;
        if (employee) {
          await localDB.put(TABLES.EMPLOYEES, {
            ...employee,
            password_hash: hashedPassword,
            last_password_change: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          logger.log('✅ IndexedDB 密碼已更新');
        }
      } catch (dbError) {
        logger.warn('⚠️ IndexedDB 更新失敗（不影響主要功能）:', dbError);
      }

      alert('✅ 密碼更新成功！下次登入需重新驗證。');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordSection(false);
    } catch (error) {
      logger.error('密碼更新過程中發生錯誤:', error);
      alert('密碼更新失敗，請稍後再試');
    } finally {
      setPasswordUpdateLoading(false);
    }
  };

  const themes = [
    {
      id: 'morandi' as const,
      name: '莫蘭迪優雅',
      description: '柔和的色彩，溫暖的米色背景，適合長時間使用',
      icon: Sun,
      preview: {
        bg: '#F6F4F1',
        primary: '#3A3633',
        secondary: '#8B8680',
        accent: '#C4A572',
        card: '#FFFFFF',
      },
    },
    {
      id: 'modern-dark' as const,
      name: '現代深色',
      description: '深色背景，高對比度，現代感十足的設計',
      icon: Moon,
      preview: {
        bg: '#36393f',           // Discord 深灰背景
        primary: '#dcddde',      // 主文字色（柔和白）
        secondary: '#b9bbbe',    // 次文字色（灰白）
        accent: '#5865f2',       // Discord 紫藍色
        card: '#2f3136',         // 卡片背景
      },
    },
  ];

  return (
    <div className="space-y-6">
      <ResponsiveHeader
        title="系統設定"
        breadcrumb={[
          { label: '首頁', href: '/' },
          { label: '設定', href: '/settings' },
        ]}
        actions={
          <div className="flex items-center gap-3">
            {/* 用戶資訊 */}
            {user && (
              <div className="flex items-center gap-2 px-3 py-2 bg-morandi-container rounded-lg">
                <User className="h-4 w-4 text-morandi-secondary" />
                <span className="text-sm font-medium text-morandi-primary">
                  {user.display_name}
                </span>
              </div>
            )}

            {/* 登出按鈕 */}
            <Button
              variant="outline"
              onClick={handleLogout}
              className="flex items-center gap-2 text-morandi-red border-morandi-red hover:bg-morandi-red hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              登出
            </Button>
          </div>
        }
      />

      <div className="max-w-4xl mx-auto space-y-8">
        {/* 主題設定區塊 */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Palette className="h-6 w-6 text-morandi-gold" />
            <h2 className="text-xl font-semibold">主題設定</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {themes.map((theme) => {
              const Icon = theme.icon;
              const is_active = currentTheme === theme.id;

              return (
                <button
                  key={theme.id}
                  onClick={() => setTheme(theme.id)}
                  className={cn(
                    'relative group text-left transition-all duration-300',
                    'border-2 rounded-xl overflow-hidden',
                    is_active
                      ? 'border-morandi-gold/20 shadow-lg scale-[1.02]'
                      : 'border-border hover:border-morandi-gold/20 hover:shadow-md'
                  )}
                >
                  {/* 選中標記 */}
                  {is_active && (
                    <div className="absolute top-3 right-3 z-10 bg-morandi-gold text-white rounded-full p-1">
                      <Check className="h-4 w-4" />
                    </div>
                  )}

                  {/* 預覽區域 */}
                  <div
                    className="h-32 p-4 relative overflow-hidden"
                    style={{
                      background: theme.preview.bg,
                    }}
                  >
                    {/* 模擬介面元素 */}
                    <div className="space-y-2">
                      {/* 模擬導航欄 */}
                      <div className="flex gap-2">
                        <div
                          className="h-2 w-16 rounded-full opacity-80"
                          style={{ backgroundColor: theme.preview.accent }}
                        />
                        <div
                          className="h-2 w-12 rounded-full opacity-60"
                          style={{ backgroundColor: theme.preview.secondary }}
                        />
                      </div>
                      
                      {/* 模擬卡片 */}
                      <div
                        className="p-2 rounded-lg shadow-sm"
                        style={{ backgroundColor: theme.preview.card }}
                      >
                        <div
                          className="h-1.5 w-20 rounded-full mb-1"
                          style={{ backgroundColor: theme.preview.primary }}
                        />
                        <div
                          className="h-1 w-16 rounded-full opacity-60"
                          style={{ backgroundColor: theme.preview.secondary }}
                        />
                      </div>

                      {/* 模擬按鈕 */}
                      <div className="flex gap-2">
                        <div
                          className="h-6 w-14 rounded-md"
                          style={{ backgroundColor: theme.preview.accent }}
                        />
                        <div
                          className="h-6 w-14 rounded-md border"
                          style={{ borderColor: theme.preview.secondary }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 主題資訊 */}
                  <div className="p-4 bg-card">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="h-5 w-5 text-morandi-gold" />
                      <h3 className="font-semibold text-base">{theme.name}</h3>
                    </div>
                    <p className="text-sm text-morandi-secondary">
                      {theme.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-6 p-4 bg-morandi-container/20 rounded-lg">
            <p className="text-sm text-morandi-secondary">
              <strong>提示：</strong>主題設定會立即生效並自動儲存。
              不同主題適合不同的使用場景和個人喜好。
            </p>
          </div>
        </Card>

        {/* 帳號安全設定 */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Lock className="h-6 w-6 text-morandi-gold" />
            <h2 className="text-xl font-semibold">帳號安全</h2>
          </div>

          <div className="space-y-4">
            {/* 修改密碼區塊 */}
            <div className="p-4 border border-border rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-medium mb-1">修改密碼</h3>
                  <p className="text-sm text-morandi-secondary">定期更換密碼以保護您的帳號安全</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowPasswordSection(!showPasswordSection)}
                >
                  {showPasswordSection ? '取消' : '修改密碼'}
                </Button>
              </div>

              {showPasswordSection && (
                <div className="mt-4 space-y-4 pt-4 border-t border-border">
                  {/* 目前密碼 */}
                  <div>
                    <label className="block text-sm font-medium text-morandi-primary mb-1">
                      目前密碼
                    </label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({
                          ...passwordData,
                          currentPassword: e.target.value
                        })}
                        placeholder="請輸入目前密碼"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-morandi-secondary hover:text-morandi-primary"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* 新密碼 */}
                  <div>
                    <label className="block text-sm font-medium text-morandi-primary mb-1">
                      新密碼
                    </label>
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({
                        ...passwordData,
                        newPassword: e.target.value
                      })}
                      placeholder="至少8個字元"
                    />
                  </div>

                  {/* 確認新密碼 */}
                  <div>
                    <label className="block text-sm font-medium text-morandi-primary mb-1">
                      確認新密碼
                    </label>
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({
                        ...passwordData,
                        confirmPassword: e.target.value
                      })}
                      placeholder="再次輸入新密碼"
                    />
                  </div>

                  {/* 密碼確認提示 */}
                  {passwordData.newPassword && passwordData.confirmPassword && (
                    <div className="text-sm">
                      {passwordData.newPassword === passwordData.confirmPassword ? (
                        <span className="text-green-600">✓ 密碼確認一致</span>
                      ) : (
                        <span className="text-red-600">✗ 密碼確認不一致</span>
                      )}
                    </div>
                  )}

                  {/* 操作按鈕 */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={handlePasswordUpdate}
                      disabled={
                        passwordUpdateLoading ||
                        !passwordData.currentPassword ||
                        !passwordData.newPassword ||
                        passwordData.newPassword !== passwordData.confirmPassword ||
                        passwordData.newPassword.length < 8
                      }
                      className="bg-morandi-gold hover:bg-morandi-gold-hover"
                    >
                      {passwordUpdateLoading ? '更新中...' : '更新密碼'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowPasswordSection(false);
                        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                      }}
                    >
                      取消
                    </Button>
                  </div>

                  {/* 密碼要求提示 */}
                  <div className="text-xs text-morandi-muted bg-morandi-container/30 p-3 rounded">
                    <p className="font-medium mb-1">📝 密碼要求：</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>至少8個字元</li>
                      <li>建議包含數字和字母</li>
                      <li>需要先輸入目前密碼進行驗證</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* 其他設定區塊 */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">其他設定</h2>
          <div className="space-y-4">
            <div className="p-4 border border-border rounded-lg">
              <h3 className="font-medium mb-2">語言設定</h3>
              <p className="text-sm text-morandi-secondary">繁體中文（預設）</p>
            </div>
            <div className="p-4 border border-border rounded-lg">
              <h3 className="font-medium mb-2">通知設定</h3>
              <p className="text-sm text-morandi-secondary">系統通知：開啟</p>
            </div>
            <div className="p-4 border border-border rounded-lg">
              <h3 className="font-medium mb-2">資料備份</h3>
              <p className="text-sm text-morandi-secondary">自動備份：每日凌晨 2:00</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
