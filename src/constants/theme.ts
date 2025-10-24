export const theme = {
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.5rem',
    '2xl': '2rem'
  },
  radius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem'
  },
  colors: {
    surface: 'hsl(var(--background))',
    surfaceSubtle: 'hsla(var(--muted), 0.85)',
    surfaceElevated: 'hsl(var(--card))',
    border: 'hsl(var(--border))',
    borderStrong: 'hsla(var(--border), 0.65)',
    textPrimary: 'hsl(var(--foreground))',
    textMuted: 'hsl(var(--muted-foreground))',
    accent: 'hsl(var(--primary))',
    accentMuted: 'hsla(var(--primary), 0.12)',
    accentStrong: 'hsla(var(--primary), 0.18)',
    destructive: 'hsl(var(--destructive))',
    destructiveMuted: 'hsla(var(--destructive), 0.14)',
    success: 'hsl(142 71% 45%)',
    successMuted: 'hsla(142 71% 45% / 0.14)'
  },
  typography: {
    body: 'text-sm leading-6 text-muted-foreground',
    heading: 'text-lg font-semibold text-foreground',
    label: 'text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground'
  },
  shadows: {
    card: '0 18px 45px -30px rgba(15, 23, 42, 0.45)',
    overlay: '0 12px 32px -12px rgba(15, 23, 42, 0.28)'
  }
} as const;

export type ThemeConfig = typeof theme;
