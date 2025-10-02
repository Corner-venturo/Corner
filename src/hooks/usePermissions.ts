import { useMemo } from 'react';
import { useAuthStore } from '@/stores/auth-store';

export const usePermissions = () => {
  const { user } = useAuthStore();

  const permissions = useMemo(() => {
    if (!user) {
      return {
        canViewReceipts: false,
        canCreateReceipts: false,
        canEditReceipts: false,
        canConfirmReceipts: false,
        canViewFinance: false,
        canManageFinance: false,
        isAdmin: false,
        isAccountant: false
      };
    }

    const userPermissions = user.permissions || [];
    const isSuperAdmin = userPermissions.includes('super_admin');
    const isAdmin = userPermissions.includes('admin') || isSuperAdmin;

    return {
      canViewReceipts: isSuperAdmin || userPermissions.includes('payments') || userPermissions.includes('finance'),
      canCreateReceipts: isSuperAdmin || userPermissions.includes('payments') || userPermissions.includes('finance'),
      canEditReceipts: isSuperAdmin || userPermissions.includes('payments') || userPermissions.includes('finance'),
      canConfirmReceipts: isSuperAdmin || userPermissions.includes('payments') || userPermissions.includes('finance'),
      canViewFinance: isSuperAdmin || userPermissions.includes('finance') || userPermissions.includes('accounting'),
      canManageFinance: isSuperAdmin || userPermissions.includes('finance'),
      isAdmin,
      isAccountant: isSuperAdmin || userPermissions.includes('accounting') || userPermissions.includes('finance')
    };
  }, [user]);

  return permissions;
};