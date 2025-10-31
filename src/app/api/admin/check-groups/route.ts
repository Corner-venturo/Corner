import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // 查詢所有群組
    const { data: allGroups, error: allError } = await supabase
      .from('channel_groups')
      .select('*')
      .order('workspace_id')
      .order('created_at')

    if (allError) throw allError

    // 檢查重複
    const groupMap = new Map<string, any[]>()
    allGroups?.forEach((group) => {
      const key = `${group.name}-${group.workspace_id}`
      if (!groupMap.has(key)) {
        groupMap.set(key, [])
      }
      groupMap.get(key)!.push(group)
    })

    const duplicates = Array.from(groupMap.entries())
      .filter(([_, groups]) => groups.length > 1)
      .map(([key, groups]) => ({
        key,
        count: groups.length,
        groups: groups.map((g) => ({
          id: g.id,
          name: g.name,
          workspace_id: g.workspace_id,
          created_at: g.created_at,
        })),
      }))

    return NextResponse.json({
      total_groups: allGroups?.length || 0,
      duplicate_count: duplicates.length,
      duplicates,
      all_groups: allGroups,
    })
  } catch (error) {
    console.error('Error checking groups:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
