import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { iata_code, city_name_zh, country_code } = body

  if (!iata_code || !city_name_zh || !country_code) {
    return NextResponse.json({ error: '缺少必填欄位' }, { status: 400 })
  }

  if (!/^[A-Z]{3}$/.test(iata_code)) {
    return NextResponse.json({ error: 'IATA 代碼必須為 3 碼大寫英文' }, { status: 400 })
  }

  const supabase = getSupabaseAdminClient()
  const { error } = await supabase
    .from('ref_airports')
    .upsert({
      iata_code,
      city_name_zh,
      country_code,
      usage_count: 1,
      is_favorite: false,
    }, { onConflict: 'iata_code' })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ iata_code })
}
