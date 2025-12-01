'use server'

import { adminDb } from '@/lib/supabase/admin.ts'
import { startOfMonth, endOfMonth } from 'date-fns'

export async function getApiUsageForCurrentMonth(apiService: string) {
  const now = new Date()
  const startDate = startOfMonth(now)
  const endDate = endOfMonth(now)

  const { count, error } = await adminDb
    .from('api_usage_log')
    .select('*', { count: 'exact', head: true })
    .eq('api_service', apiService)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())

  if (error) {
    console.error(`Error fetching API usage for ${apiService}:`, error)
    return { error: 'Failed to fetch API usage data.' }
  }

  return { count }
}
