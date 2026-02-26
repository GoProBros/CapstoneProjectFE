"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import StaffSidebar, { StaffFeature } from "@/components/staff/StaffSidebar";
import DashboardFeature from "@/components/staff/DashboardFeature";
import UsersFeature from "@/components/staff/UsersFeature";
import FinancialReportsFeature from "@/components/staff/FinancialReportsFeature";
import AnalysisReportsFeature from "@/components/staff/AnalysisReportsFeature";
import NewsFeature from "@/components/staff/NewsFeature";
import DataFeature from "@/components/staff/DataFeature";

export default function StaffPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [activeFeature, setActiveFeature] = useState<StaffFeature>("dashboard");

  useEffect(() => {
    // Redirect if not authenticated or not staff
    if (!isLoading && (!isAuthenticated || user?.role !== "Nhân viên")) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isLoading, user, router]);

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

  if (!isAuthenticated || user?.role !== "Nhân viên") {
    return null;
  }

  // Render feature component based on active selection
  const renderFeature = () => {
    switch (activeFeature) {
      case "dashboard":
        return <DashboardFeature />;
      case "users":
        return <UsersFeature />;
      case "financial-reports":
        return <FinancialReportsFeature />;
      case "analysis-reports":
        return <AnalysisReportsFeature />;
      case "news":
        return <NewsFeature />;
      case "data":
        return <DataFeature />;
      default:
        return <DashboardFeature />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar */}
      <StaffSidebar
        activeFeature={activeFeature}
        setActiveFeature={setActiveFeature}
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="px-6 py-6">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <button
                  onClick={() => router.push("/dashboard")}
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  aria-label="Quay lại Dashboard"
                >
                  <svg
                    className="w-5 h-5 text-gray-700 dark:text-gray-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                </button>
                <div className="absolute left-0 top-full mt-2 px-3 py-1 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                  Quay lại Dashboard
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Quản lí hệ thống
                </h1>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Chào mừng, {user?.fullName}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Feature Content */}
        <main className="flex-1 p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">{renderFeature()}</div>
        </main>
      </div>
    </div>
  );
}
