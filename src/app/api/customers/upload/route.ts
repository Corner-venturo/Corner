
import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/supabase/admin.ts'
import * as XLSX from 'xlsx'
import { CreateCustomerData } from '@/types/customer.types'

// Define the expected columns in the uploaded file
// This helps with validation and mapping
const EXPECTED_COLUMNS = [
  'code',
  'name',
  'english_name',
  'phone',
  'email',
  'national_id',
  'passport_number',
  'date_of_birth',
  'gender',
]

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 })
    }

    const fileBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' })

    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]

    // Convert sheet to JSON, but keep headers for validation
    const data: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

    if (data.length < 2) {
      return NextResponse.json({ error: 'The uploaded file is empty or has no data rows.' }, { status: 400 })
    }

    const headers = data[0]
    const rows = data.slice(1)

    // Basic validation to check if essential columns exist
    if (!headers.includes('code') || !headers.includes('name') || !headers.includes('phone')) {
        return NextResponse.json({ error: 'Missing required columns. The file must contain at least "code", "name", and "phone".' }, { status: 400 })
    }

    const customersToCreate: CreateCustomerData[] = rows.map(row => {
        const customerObject: any = {}
        headers.forEach((header, index) => {
            customerObject[header] = row[index]
        })
        
        return {
            code: customerObject.code,
            name: customerObject.name,
            english_name: customerObject.english_name,
            phone: String(customerObject.phone), // Ensure phone is a string
            alternative_phone: customerObject.alternative_phone,
            email: customerObject.email,
            address: customerObject.address,
            city: customerObject.city,
            country: customerObject.country,
            national_id: customerObject.national_id,
            passport_number: customerObject.passport_number,
            passport_romanization: customerObject.passport_romanization,
            passport_expiry_date: customerObject.passport_expiry_date,
            date_of_birth: customerObject.date_of_birth,
            gender: customerObject.gender,
            company: customerObject.company,
            tax_id: customerObject.tax_id,
            is_vip: customerObject.is_vip || false,
            source: customerObject.source || 'bulk_upload',
            notes: customerObject.notes,
            is_active: customerObject.is_active || true,
            // Set the verification status for all uploaded customers
            verification_status: 'unverified',
        }
    })

    const { data: insertedData, error } = await adminDb
      .from('customers')
      .insert(customersToCreate)
      .select()

    if (error) {
      console.error('Supabase insert error:', error)
      // Provide a more specific error message if possible
      let errorMessage = 'Failed to insert customer data.'
      if (error.code === '23505') { // Unique constraint violation
        errorMessage = `Failed to insert data. One or more customers with the provided 'code' already exist.`
      }
      return NextResponse.json({ error: errorMessage, details: error.message }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Successfully uploaded and created customers.',
      count: insertedData.length,
      data: insertedData,
    })
  } catch (err: any) {
    console.error('Customer upload error:', err)
    return NextResponse.json({ error: 'An unexpected error occurred during file processing.', details: err.message }, { status: 500 })
  }
}
