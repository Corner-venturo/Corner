'use client';

import { useThemeStore } from '@/stores/theme-store';
import { Button } from '@/components/ui/button';
import { Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ThemeToggle({ className }: { className?: string }) {
  const { currentTheme, toggleTheme } = useThemeStore();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className={cn(
        'relative h-9 w-9 rounded-lg transition-all duration-300',
        'hover:bg-morandi-container/50',
        className
      )}
      title={currentTheme === 'morandi' ? '切換至深色主題' : '切換至莫蘭迪主題'}
    >
      <Sun className={cn(
        'h-5 w-5 absolute transition-all duration-300',
        currentTheme === 'morandi' 
          ? 'rotate-0 scale-100 opacity-100' 
          : 'rotate-90 scale-0 opacity-0'
      )} />
      <Moon className={cn(
        'h-5 w-5 absolute transition-all duration-300',
        currentTheme === 'modern-dark' 
          ? 'rotate-0 scale-100 opacity-100' 
          : '-rotate-90 scale-0 opacity-0'
      )} />
    </Button>
  );
}
