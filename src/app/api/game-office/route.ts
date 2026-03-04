import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function getSupabase() {
  return createClient(supabaseUrl, supabaseServiceKey)
}

// GET: Load room for a workspace
export async function GET(req: NextRequest) {
  const workspaceId = req.nextUrl.searchParams.get('workspace_id')
  if (!workspaceId) {
    return NextResponse.json({ error: 'workspace_id required' }, { status: 400 })
  }

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('game_office_rooms')
    .select('room_data, updated_at, updated_by')
    .eq('workspace_id', workspaceId)
    .single()

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ room: data?.room_data || null, updated_at: data?.updated_at })
}

// POST: Save room for a workspace
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { workspace_id, room_data, user_id } = body

  if (!workspace_id || !room_data) {
    return NextResponse.json({ error: 'workspace_id and room_data required' }, { status: 400 })
  }

  const supabase = getSupabase()
  const { error } = await supabase
    .from('game_office_rooms')
    .upsert({
      workspace_id,
      room_data,
      updated_by: user_id || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'workspace_id' })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
