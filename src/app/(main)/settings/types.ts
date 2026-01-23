export interface PasswordData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export interface CacheInfo {
  dbExists: boolean
  tableCount: number
}

export interface ThemePreview {
  bg: string
  primary: string
  secondary: string
  accent: string
  card: string
}

export interface Theme {
  id: 'morandi' | 'modern-dark' | 'nordic'
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  preview: ThemePreview
}
