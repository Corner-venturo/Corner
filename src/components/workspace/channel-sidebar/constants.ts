/**
 * Constants and utility functions for ChannelSidebar
 */

export const ROLE_LABELS: Record<string, string> = {
  owner: '擁有者',
  admin: '管理員',
  manager: '管理者',
  member: '成員',
  guest: '訪客',
};

export const STATUS_LABELS: Record<string, string> = {
  active: '使用中',
  invited: '已邀請',
  pending: '待加入',
  suspended: '已停用',
  removed: '已移除',
};

export const STATUS_BADGE_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  active: 'default',
  invited: 'secondary',
  pending: 'secondary',
  suspended: 'outline',
  removed: 'destructive',
};

export const getMemberInitials = (name?: string | null, fallback?: string | null) => {
  const source = name || fallback || '';
  if (!source) return '成員';
  const words = source.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
};

export const formatRoleLabel = (role?: string | null) => {
  if (!role) return '成員';
  const normalized = role.toLowerCase();
  return ROLE_LABELS[normalized] || role;
};

export const formatStatusLabel = (status?: string | null) => {
  if (!status) return '未知狀態';
  const normalized = status.toLowerCase();
  return STATUS_LABELS[normalized] || status;
};

export const getStatusBadgeVariant = (status?: string | null) => {
  if (!status) return 'outline';
  const normalized = status.toLowerCase();
  return STATUS_BADGE_VARIANTS[normalized] || 'outline';
};
