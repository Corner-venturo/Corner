import { Card } from '@/components/ui/card'
import { Palette, Check, Sun, Moon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Theme } from '../types'

interface AppearanceSettingsProps {
  currentTheme: 'morandi' | 'modern-dark'
  onThemeChange: (theme: 'morandi' | 'modern-dark') => void
}

const themes: Theme[] = [
  {
    id: 'morandi' as const,
    name: '莫蘭迪優雅',
    description: '柔和的色彩，溫暖的米色背景，適合長時間使用',
    icon: Sun,
    preview: {
      bg: '#F9F8F6',
      primary: '#333333',
      secondary: '#8C8C8C',
      accent: '#B8A99A',
      card: '#FFFFFF',
    },
  },
  {
    id: 'modern-dark' as const,
    name: '現代深色',
    description: '深色背景，高對比度，現代感十足的設計',
    icon: Moon,
    preview: {
      bg: '#36393f',
      primary: '#dcddde',
      secondary: '#b9bbbe',
      accent: '#5865f2',
      card: '#2f3136',
    },
  },
]

export function AppearanceSettings({ currentTheme, onThemeChange }: AppearanceSettingsProps) {
  return (
    <Card className="rounded-xl shadow-lg border border-border p-8">
      <div className="flex items-center gap-3 mb-6">
        <Palette className="h-6 w-6 text-morandi-gold" />
        <h2 className="text-xl font-semibold">主題設定</h2>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {themes.map(theme => {
          const Icon = theme.icon
          const is_active = currentTheme === theme.id

          return (
            <button
              key={theme.id}
              onClick={() => onThemeChange(theme.id)}
              className={cn(
                'relative group text-left transition-all duration-300',
                'border rounded-xl overflow-hidden shadow-lg',
                is_active
                  ? 'border-morandi-gold scale-[1.02]'
                  : 'border-border hover:border-morandi-gold/40'
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
                <p className="text-sm text-morandi-secondary">{theme.description}</p>
              </div>
            </button>
          )
        })}
      </div>

      <div className="mt-6 p-4 bg-morandi-container/20 rounded-lg">
        <p className="text-sm text-morandi-secondary">
          <strong>提示：</strong>主題設定會立即生效並自動儲存。
          不同主題適合不同的使用場景和個人喜好。
        </p>
      </div>
    </Card>
  )
}
