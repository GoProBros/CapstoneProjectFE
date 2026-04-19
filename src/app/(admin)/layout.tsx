'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import type { ReactNode } from 'react';

const ALLOWED_ROLES = ['Staff', 'Admin'];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    const role = user?.role?.trim();
    if (!role || !ALLOWED_ROLES.includes(role)) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isLoading, user, router]);

  if (isLoading) return null;
  if (!isAuthenticated) return null;
  if (!user?.role || !ALLOWED_ROLES.includes(user.role.trim())) return null;

  return <>{children}</>;
}
