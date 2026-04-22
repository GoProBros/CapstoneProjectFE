"use client";

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { USER_ROLES } from '@/constants/roles';
import { DataFeature } from "@/features/admin/components/DataFeature";

export default function StaffDataPage() {
  const { user } = useAuth();
  const router = useRouter();

  if (user?.role?.trim() !== USER_ROLES.ADMIN) {
    router.replace('/system-manager');
    return null;
  }

  return <DataFeature />;
}
