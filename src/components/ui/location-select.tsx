// src/components/ui/location-select.tsx
import { cn } from '@/lib/utils'
import { LOCATIONS } from '@/constants'

interface LocationSelectProps {
  value: string
  onChange: (value: string) => void
  className?: string
  placeholder?: string
}

export function LocationSelect({
  value,
  onChange,
  className,
  placeholder = '選擇地點',
}: LocationSelectProps) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className={cn(
        'w-full p-2 border border-border rounded-md bg-background text-morandi-primary focus:outline-none focus:ring-1 focus:ring-morandi-gold',
        className
      )}
    >
      <option value="">{placeholder}</option>
      {LOCATIONS.map(location => (
        <option key={location.value} value={location.value}>
          {location.label}
        </option>
      ))}
    </select>
  )
}
