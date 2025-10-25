'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { ResponsiveHeader } from '@/components/layout/responsive-header';
import { Card } from '@/components/ui/card';
import { Settings } from 'lucide-react';
import { useWidgets } from '@/features/dashboard/hooks';
import { WidgetSettingsDialog, AVAILABLE_WIDGETS } from '@/features/dashboard/components';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const { activeWidgets, toggleWidget } = useWidgets();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-morandi-gold/20 mx-auto"></div>
          <p className="mt-4 text-morandi-muted">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title="首頁"
        breadcrumb={[{ label: '首頁', href: '/' }]}
        actions={
          <WidgetSettingsDialog
            activeWidgets={activeWidgets}
            onToggleWidget={toggleWidget}
          />
        }
      />

      <div className="flex-1 overflow-auto min-h-0">
        {activeWidgets.length === 0 ? (
          <Card className="p-12 text-center border-morandi-gold/20 shadow-sm rounded-2xl bg-white">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-[#B5986A]/10 to-[#D4C4A8]/10 flex items-center justify-center mx-auto mb-4 shadow-sm">
                <Settings className="h-8 w-8 text-morandi-gold" />
              </div>
              <h3 className="text-lg font-semibold text-morandi-primary mb-2">尚未選擇任何小工具</h3>
              <p className="text-sm text-morandi-muted mb-6">
                點擊右上角「小工具設定」來新增你需要的工具
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {AVAILABLE_WIDGETS.filter((w) => activeWidgets.includes(w.id)).map(
              (widget) => {
                const Component = widget.component;
                return (
                  <div key={widget.id} className={widget.span === 2 ? 'md:col-span-2' : ''}>
                    <Component />
                  </div>
                );
              }
            )}
          </div>
        )}
      </div>
    </div>
  );
}
