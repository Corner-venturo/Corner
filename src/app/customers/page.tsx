import { CustomerBulkUploadForm } from '@/components/customers/customer-bulk-upload-form'
import { updateCustomerStatus } from '../verify/actions'
import { toast } from 'sonner'
import { ImageUploadDropzone } from '@/components/customers/image-upload-dropzone'

export default function CustomersPage() {
  return (
    <div className="container mx-auto py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Customer Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage your customer data, including bulk uploads and verification.
        </p>
      </header>
      
      <main className="flex justify-center">
        <CustomerBulkUploadForm />
      </main>

    </div>
  )
}