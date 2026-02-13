import { Card } from '@/components/ui/card'
import { Palette, Check, Sun, Moon, Snowflake } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Theme } from '../types'
import { LABELS } from '../constants/labels'

interface AppearanceSettingsProps {
  currentTheme: 'morandi' | 'modern-dark' | 'nordic'
  onThemeChange: (theme: 'morandi' | 'modern-dark' | 'nordic') => void
}

const themes: Theme[] = [
  {
    id: 'morandi' as const,
    name: LABELS.MORANDI_THEME_NAME,
    description: LABELS.MORANDI_THEME_DESC,
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
    name: LABELS.MODERN_DARK_NAME,
    description: LABELS.MODERN_DARK_DESC,
    icon: Moon,
    preview: {
      bg: '#36393f',
      primary: '#dcddde',
      secondary: '#b9bbbe',
      accent: '#5865f2',
      card: '#2f3136',
    },
  },
  {
    id: 'nordic' as const,
    name: LABELS.NORDIC_THEME_NAME,
    description: LABELS.NORDIC_THEME_DESC,
    icon: Snowflake,
    preview: {
      bg: '#F8F8F8',
      primary: '#36454F',
      secondary: '#6B7B86',
      accent: '#3C5A47',
      card: '#FFFFFF',
    },
  },
]

export function AppearanceSettings({ currentTheme, onThemeChange }: AppearanceSettingsProps) {
  return (
    <Card className="rounded-xl shadow-lg border border-border p-8">
      <div className="flex items-center gap-3 mb-6">
        <Palette className="h-6 w-6 text-morandi-gold" />
        <h2 className="text-xl font-semibold">{LABELS.THEME_SETTINGS}</h2>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
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
          <strong>{LABELS.THEME_TIP_TITLE}</strong>{LABELS.THEME_TIP_DESC}
        </p>
      </div>
    </Card>
  )
}
