import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerAuth } from '@/lib/auth/server-auth'
import { ApiError } from '@/lib/api/response'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function getSupabase() {
  return createClient(supabaseUrl, supabaseServiceKey)
}

// GET: Load shared room for workspace
export async function GET(req: NextRequest) {
  // 🔒 安全修復 2026-03-15：需要認證
  const auth = await getServerAuth()
  if (!auth.success) {
    return ApiError.unauthorized('請先登入')
  }
  const workspaceId = req.nextUrl.searchParams.get('workspace_id')
  if (!workspaceId) {
    return NextResponse.json({ error: 'workspace_id required' }, { status: 400 })
  }

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('game_office_rooms')
    .select('room_data, updated_at, updated_by')
    .eq('workspace_id', workspaceId)
    .is('user_id', null)
    .single()

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ room: data?.room_data || null })
}

// POST: Save shared room for workspace
export async function POST(req: NextRequest) {
  // 🔒 安全修復 2026-03-15：需要認證
  const auth = await getServerAuth()
  if (!auth.success) {
    return ApiError.unauthorized('請先登入')
  }
  const { workspace_id, room_data, user_id } = await req.json()
  if (!workspace_id || !room_data) {
    return NextResponse.json({ error: 'workspace_id and room_data required' }, { status: 400 })
  }

  const supabase = getSupabase()

  // Check if shared room exists
  const { data: existing } = await supabase
    .from('game_office_rooms')
    .select('id')
    .eq('workspace_id', workspace_id)
    .is('user_id', null)
    .single()

  if (existing) {
    const { error } = await supabase
      .from('game_office_rooms')
      .update({ room_data, updated_by: user_id || null, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else {
    const { error } = await supabase
      .from('game_office_rooms')
      .insert({ workspace_id, user_id: null, room_data, updated_by: user_id || null })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
