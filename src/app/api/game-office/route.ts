import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function getSupabase() {
  return createClient(supabaseUrl, supabaseServiceKey)
}

export async function GET(req: NextRequest) {
  const workspaceId = req.nextUrl.searchParams.get('workspace_id')
  const userId = req.nextUrl.searchParams.get('user_id')
  if (!workspaceId || !userId) {
    return NextResponse.json({ error: 'workspace_id and user_id required' }, { status: 400 })
  }

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('game_office_rooms')
    .select('room_data, updated_at')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ room: data?.room_data || null })
}

export async function POST(req: NextRequest) {
  const { workspace_id, user_id, room_data } = await req.json()
  if (!workspace_id || !user_id || !room_data) {
    return NextResponse.json({ error: 'workspace_id, user_id, room_data required' }, { status: 400 })
  }

  const supabase = getSupabase()
  const { error } = await supabase
    .from('game_office_rooms')
    .upsert({
      workspace_id,
      user_id,
      room_data,
      updated_by: user_id,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'workspace_id,user_id' })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
