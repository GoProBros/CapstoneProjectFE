"use client";

import { ReactNode, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import StaffSidebar from "@/components/staff/StaffSidebar";

interface StaffLayoutProps {
  children: ReactNode;
}

export default function StaffLayout({ children }: StaffLayoutProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const role = user?.role?.trim();
  const canAccessSystemManagement =
    role === "Nhân viên" || role === "Admin" || role === "Quản trị viên";

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !canAccessSystemManagement)) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isLoading, canAccessSystemManagement, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !canAccessSystemManagement) {
    return null;
  }

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex overflow-hidden">
      <StaffSidebar />

      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <main className="flex-1 p-8 overflow-y-auto overflow-x-hidden">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
