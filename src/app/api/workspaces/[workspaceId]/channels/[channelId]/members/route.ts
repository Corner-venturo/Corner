import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

type RouteParams = {
  params: {
    workspaceId: string;
    channelId: string;
  };
};

export async function GET(_request: Request, { params }: RouteParams) {
  const { workspaceId, channelId } = params;

  if (!workspaceId || !channelId) {
    return NextResponse.json(
      { error: 'workspaceId and channelId are required' },
      { status: 400 }
    );
  }

  try {
    const supabase = getSupabaseAdminClient();

    const { data, error } = await supabase
      .from('channel_members' as any)
      .select(
        `
          id,
          workspace_id,
          channel_id,
          employee_id,
          role,
          status,
          created_at,
          updated_at,
          employees:employee_id (
            id,
            display_name,
            english_name,
            email,
            avatar,
            status
          )
        `
      )
      .eq('workspace_id', workspaceId)
      .eq('channel_id', channelId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Failed to load channel members:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const members = (data || []).map((member: any) => ({
      id: member.id as string,
      workspaceId: member.workspace_id as string,
      channelId: member.channel_id as string,
      employeeId: member.employee_id as string,
      role: member.role as string,
      status: member.status as string,
      invitedAt: null as string | null,
      joinedAt: member.created_at as string | null,
      lastSeenAt: member.updated_at as string | null,
      profile: member.employees
        ? {
            id: member.employees.id as string,
            displayName: member.employees.display_name as string,
            englishName: member.employees.english_name as string | null,
            email: member.employees.email as string | null,
            avatar: member.employees.avatar as string | null,
            status: member.employees.status as string | null,
          }
        : null,
    }));

    return NextResponse.json({ members });
  } catch (error) {
    console.error('Unexpected error while loading channel members:', error);
    return NextResponse.json({ error: 'Failed to load channel members' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const { workspaceId, channelId } = params;

  if (!workspaceId || !channelId) {
    return NextResponse.json(
      { error: 'workspaceId and channelId are required' },
      { status: 400 }
    );
  }

  const { memberId } = await request.json().catch(() => ({ memberId: undefined }));

  if (!memberId) {
    return NextResponse.json({ error: 'memberId is required' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdminClient();

    const { error } = await supabase
      .from('channel_members' as any)
      .delete()
      .eq('workspace_id', workspaceId)
      .eq('channel_id', channelId)
      .eq('id', memberId);

    if (error) {
      console.error('Failed to remove channel member:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error while removing channel member:', error);
    return NextResponse.json({ error: 'Failed to remove channel member' }, { status: 500 });
  }
}
