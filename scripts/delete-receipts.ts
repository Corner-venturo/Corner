import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pfqvdacxowpgfamuvnsn.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || ''

async function deleteReceipts() {
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  const receiptNumbers = ['HKG260125A-R01', 'HKG260125A-R02']
  
  for (const receiptNumber of receiptNumbers) {
    const { error } = await supabase
      .from('receipts')
      .delete()
      .eq('receipt_number', receiptNumber)
    
    if (error) {
      console.error(`刪除 ${receiptNumber} 失敗:`, error.message)
    } else {
      console.log(`已刪除 ${receiptNumber}`)
    }
  }
}

deleteReceipts()
