import { adminDb } from '@/lib/supabase/admin.ts'
import { CustomerVerificationTable } from '@/components/customers/customer-verification-table'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { FileWarning } from 'lucide-react'

// Revalidate the page every 60 seconds to get fresh data
export const revalidate = 60

async function getUnverifiedCustomers() {
  const { data, error } = await adminDb
    .from('customers')
    .select('*')
    .eq('verification_status', 'unverified')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching unverified customers:', error)
    // In a real app, you'd want to handle this more gracefully
    // Maybe show an error state to the user
    return []
  }

  return data
}

export default async function VerifyCustomersPage() {
  const unverifiedCustomers = await getUnverifiedCustomers()

  return (
    <div className="container mx-auto py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Verify Customer Data</h1>
        <p className="text-muted-foreground mt-2">
          Review and approve or reject newly uploaded customer records.
        </p>
      </header>
      
      <main>
        {unverifiedCustomers.length > 0 ? (
          <CustomerVerificationTable customers={unverifiedCustomers} />
        ) : (
          <Alert>
            <FileWarning className="h-4 w-4" />
            <AlertTitle>All Clear!</AlertTitle>
            <AlertDescription>
              There are no pending customers to verify at the moment.
            </AlertDescription>
          </Alert>
        )}
      </main>
    </div>
  )
}
