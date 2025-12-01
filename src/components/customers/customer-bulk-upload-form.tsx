'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { UploadCloud, File as FileIcon, Loader2 } from 'lucide-react'

// Assuming a shared Button component exists, similar to Shadcn/UI
// If not, this would need to be created or replaced with a standard <button>
import { Button } from '@/components/ui/button' 
// Assuming a shared Input component exists
import { Input } from '@/components/ui/input'

export function CustomerBulkUploadForm() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // You can add validation for file type here if needed
      // e.g., check for .csv, .xlsx, .xls
      setSelectedFile(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file to upload.')
      return
    }

    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', selectedFile)

    const promise = fetch('/api/customers/upload', {
      method: 'POST',
      body: formData,
    }).then(async (response) => {
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Something went wrong.')
      }
      return response.json()
    })

    toast.promise(promise, {
      loading: 'Uploading customers...',
      success: (data) => {
        setSelectedFile(null) // Reset file input
        return `Successfully created ${data.count} new customers for verification.`
      },
      error: (err) => {
        return err.message
      },
      finally: () => {
        setIsUploading(false)
      }
    })
  }
  
  const handleRemoveFile = () => {
    setSelectedFile(null)
    // Reset the input field value
    const input = document.getElementById('customer-upload-input') as HTMLInputElement
    if (input) {
      input.value = ''
    }
  }

  return (
    <div className="w-full max-w-lg p-6 border rounded-lg shadow-sm bg-card text-card-foreground">
      <h3 className="text-lg font-semibold mb-4">Upload Customer Data</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Upload a CSV or Excel file with customer data. Required columns are 'code', 'name', and 'phone'. All uploaded customers will be marked as 'unverified'.
      </p>

      <div className="space-y-4">
        <div className="flex items-center justify-center w-full">
          <label
            htmlFor="customer-upload-input"
            className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/80"
          >
            {selectedFile ? (
              <div className="flex flex-col items-center">
                <FileIcon className="w-12 h-12 text-primary" />
                <p className="mt-2 text-sm font-medium">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
                <Button variant="link" size="sm" className="mt-2" onClick={(e) => { e.preventDefault(); handleRemoveFile()}}>
                    Remove
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                <p className="mb-2 text-sm text-muted-foreground">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">.xlsx, .xls, or .csv</p>
              </div>
            )}
            <Input
              id="customer-upload-input"
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              disabled={isUploading}
            />
          </label>
        </div>

        <Button onClick={handleUpload} disabled={!selectedFile || isUploading} className="w-full">
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            'Upload and Create Customers'
          )}
        </Button>
      </div>
    </div>
  )
}

