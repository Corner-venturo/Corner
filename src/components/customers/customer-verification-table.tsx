'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Customer } from '@/types/customer.types'
import { updateCustomerStatus } from '@/app/customers/verify/actions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Check, X, Loader2 } from 'lucide-react'

interface CustomerVerificationTableProps {
  customers: Customer[]
}

export function CustomerVerificationTable({ customers: initialCustomers }: CustomerVerificationTableProps) {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers)
  const [loadingStates, setLoadingStates] = useState<Record<string, 'approving' | 'rejecting' | null>>({})

  const handleUpdateStatus = async (customerId: string, status: 'verified' | 'rejected') => {
    setLoadingStates(prev => ({ ...prev, [customerId]: status === 'verified' ? 'approving' : 'rejecting' }))

    const result = await updateCustomerStatus(customerId, status)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`Customer has been ${status}.`)
      // Remove the customer from the list in the UI
      setCustomers(prevCustomers => prevCustomers.filter(c => c.id !== customerId))
    }
    
    setLoadingStates(prev => ({ ...prev, [customerId]: null }))
  }

  if (customers.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
            <p>No more customers to verify.</p>
        </div>
      )
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Passport No.</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => {
            const isLoading = loadingStates[customer.id]
            return (
              <TableRow key={customer.id}>
                <TableCell>
                  <Badge variant="outline">{customer.code}</Badge>
                </TableCell>
                <TableCell className="font-medium">{customer.name}</TableCell>
                <TableCell>{customer.phone}</TableCell>
                <TableCell>{customer.email || 'N/A'}</TableCell>
                <TableCell>{customer.passport_number || 'N/A'}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdateStatus(customer.id, 'verified')}
                      disabled={!!isLoading}
                    >
                      {isLoading === 'approving' ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="mr-2 h-4 w-4" />
                      )}
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleUpdateStatus(customer.id, 'rejected')}
                      disabled={!!isLoading}
                    >
                      {isLoading === 'rejecting' ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <X className="mr-2 h-4 w-4" />
                      )}
                      Reject
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
