'use server'

import { adminDb } from '@/lib/supabase/admin.ts'
import { revalidatePath } from 'next/cache'

export async function updateCustomerStatus(customerId: string, status: 'verified' | 'rejected') {
  if (!customerId || !status) {
    return { error: 'Customer ID and status are required.' }
  }

  const { data, error } = await adminDb
    .from('customers')
    .update({ verification_status: status })
    .eq('id', customerId)
    .select()
    .single()

  if (error) {
    console.error('Error updating customer status:', error)
    return { error: 'Failed to update customer status.' }
  }

  // Revalidate the verification page to show the updated list
  revalidatePath('/customers/verify')

  return { data }
}
