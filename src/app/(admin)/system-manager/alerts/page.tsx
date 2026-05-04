'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { USER_ROLES } from '@/constants/roles';
import { AlertTemplatesFeature } from '@/features/admin/components/AlertTemplatesFeature';

export default function StaffAlertsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const isAdmin = user?.role?.trim() === USER_ROLES.ADMIN;

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!user || !isAdmin) {
      router.replace('/system-manager');
    }
  }, [isAdmin, isLoading, router, user]);

  if (isLoading) {
    return null;
  }

  if (!user || !isAdmin) {
    return null;
  }

  return <AlertTemplatesFeature />;
}