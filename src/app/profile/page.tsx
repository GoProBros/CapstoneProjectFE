"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { fileService } from "@/services/fileService";
import { getMe } from "@/services/authService";
import { FileCategory } from "@/types/file";
import type { User } from "@/types/auth";
import { ROUTES } from "@/constants/routes";
import { Spinner } from "@/components/profile/Spinner";
import { AvatarDisplay } from "@/components/profile/AvatarDisplay";
import { ProfileInfoTab } from "@/components/profile/ProfileInfoTab";
import { ProfileAlertTab } from "@/components/profile/ProfileAlertTab";
import { ProfilePortfolioTab } from "@/components/profile/ProfilePortfolioTab";
import { ProfileSubscriptionTab } from "@/components/profile/ProfileSubscriptionTab";
import { ProfileTransactionTab } from "@/components/profile/ProfileTransactionTab";
import { canViewProfileTransactions } from "@/components/profile/helpers";
import { useProfileTheme } from "@/components/profile/useProfileTheme";

type ProfileTab = "account" | "subscription" | "portfolio" | "transactions" | "alerts";

export default function ProfilePage() {
  const router = useRouter();
  const { user: authUser, isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    isDark,
    bgPage,
    bgCard,
    borderCls,
    textPrimary,
    textSecondary,
    textMuted,
    hoverBg,
    fieldBg,
  } = useProfileTheme();

  const blobUrlRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const successTimeoutRef = useRef<number | null>(null);

  const [activeTab, setActiveTab] = useState<ProfileTab>("account");
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [avatarBlobUrl, setAvatarBlobUrl] = useState<string | null>(null);
  const [loadingAvatar, setLoadingAvatar] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace(ROUTES.LOGIN);
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated || typeof window === "undefined") return;

    const hasPendingPayment = Boolean(sessionStorage.getItem("pendingPayment"));
    const query = new URLSearchParams(window.location.search);
    const hasPaymentCallbackParams =
      query.has("orderCode") ||
      query.has("ordercode") ||
      query.has("status") ||
      query.has("code") ||
      query.has("cancel");

    if (hasPendingPayment || hasPaymentCallbackParams) {
      setActiveTab("subscription");
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoadingUser(true);
    getMe()
      .then((data) => setUser(data))
      .catch((err) => console.error("[Profile] getMe error:", err))
      .finally(() => setLoadingUser(false));
  }, [isAuthenticated]);

  const loadAvatar = useCallback(async (userId: string) => {
    setLoadingAvatar(true);
    try {
      const blob = await fileService.downloadFile({
        category: FileCategory.Avatar,
        entityId: userId,
      });
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      const url = URL.createObjectURL(blob);
      blobUrlRef.current = url;
      setAvatarBlobUrl(url);
    } catch {
      setAvatarBlobUrl(null);
    } finally {
      setLoadingAvatar(false);
    }
  }, []);

  useEffect(() => {
    if (user?.id) loadAvatar(user.id);
  }, [user?.id, loadAvatar]);

  useEffect(() => {
    return () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      if (successTimeoutRef.current)
        window.clearTimeout(successTimeoutRef.current);
    };
  }, []);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingAvatar(true);
    setUploadSuccess(false);

    try {
      await fileService.uploadFile({
        file,
        category: FileCategory.Avatar,
        relatedEntityId: user.id,
      });

      await loadAvatar(user.id);

      setUploadSuccess(true);
      if (successTimeoutRef.current) {
        window.clearTimeout(successTimeoutRef.current);
      }
      successTimeoutRef.current = window.setTimeout(
        () => setUploadSuccess(false),
        3000,
      );
    } catch (err) {
      console.error("[Profile] Avatar upload failed:", err);
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const displayUser = user ?? authUser;
  const canViewRestrictedTabs = canViewProfileTransactions(displayUser?.role);
  const sidebarBg = isDark ? "bg-[#1e1e26]" : "bg-gray-50";
  const headingBg = isDark
    ? "bg-gradient-to-r from-[#282832] via-[#2f2f3a] to-[#36504a]"
    : "bg-gradient-to-r from-gray-900 via-gray-800 to-green-700";

  useEffect(() => {
    if (!canViewRestrictedTabs && (activeTab === "portfolio" || activeTab === "transactions" || activeTab === "alerts")) {
      setActiveTab("account");
    }
  }, [activeTab, canViewRestrictedTabs]);

  if (authLoading || loadingUser) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${bgPage}`}
      >
        <Spinner className="w-8 h-8 text-green-500" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div
      className={`flex h-screen w-full flex-col overflow-hidden ${bgPage} ${textPrimary}`}
    >
      <header
        className={`sticky top-0 z-40 border-b ${borderCls} ${bgCard}/90 backdrop-blur-md`}
      >
        <div className="flex h-16 w-full items-center justify-between px-4 md:px-10">
          <div className="flex items-center gap-8">
            <button
              onClick={() => router.push(ROUTES.HOME)}
              className="text-left"
              aria-label="Về dashboard"
            >
              <p className="text-lg font-extrabold tracking-tight">KF Stock</p>
              <p
                className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${textMuted}`}
              >
                Hồ sơ người dùng
              </p>
            </button>

            <nav className="hidden items-center gap-6 md:flex">
              <button
                onClick={() => router.push(ROUTES.DASHBOARD)}
                className={`px-1 py-1 text-sm ${textSecondary} transition-colors hover:text-green-500`}
              >
                Dashboard
              </button>
              <button className="border-b-2 border-green-500 px-1 py-1 text-sm font-bold text-green-500">
                Hồ sơ
              </button>
            </nav>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-64px)] w-full overflow-hidden">
        <aside
          className={`hidden h-[calc(100vh-64px)] w-64 flex-col border-r ${borderCls} ${sidebarBg} px-4 py-6 md:flex`}
        >
          <div className="mb-5 px-2">
            <h2 className="text-lg font-black">Quản lý tài khoản</h2>
            <p className={`text-xs ${textMuted}`}>
              Thiết lập thông tin và gói dịch vụ
            </p>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab("account")}
              className={`w-full rounded-r-lg border-l-4 px-3 py-3 text-left text-sm transition-all ${
                activeTab === "account"
                  ? `${bgCard} border-green-500 font-bold ${textPrimary}`
                  : `border-transparent ${textSecondary} ${hoverBg}`
              }`}
            >
              Thông tin tài khoản
            </button>

            <button
              onClick={() => setActiveTab("subscription")}
              className={`w-full rounded-r-lg border-l-4 px-3 py-3 text-left text-sm transition-all ${
                activeTab === "subscription"
                  ? `${bgCard} border-green-500 font-bold ${textPrimary}`
                  : `border-transparent ${textSecondary} ${hoverBg}`
              }`}
            >
              Gói thành viên
            </button>
            {canViewRestrictedTabs && (
              <button
                onClick={() => setActiveTab("transactions")}
                className={`w-full rounded-r-lg border-l-4 px-3 py-3 text-left text-sm transition-all ${
                  activeTab === "transactions"
                    ? `${bgCard} border-green-500 font-bold ${textPrimary}`
                    : `border-transparent ${textSecondary} ${hoverBg}`
                }`}
              >
                Lịch sử giao dịch
              </button>
            )}
            {canViewRestrictedTabs && (
            <button
              onClick={() => setActiveTab("portfolio")}
              className={`w-full rounded-r-lg border-l-4 px-3 py-3 text-left text-sm transition-all ${
                activeTab === "portfolio"
                  ? `${bgCard} border-green-500 font-bold ${textPrimary}`
                  : `border-transparent ${textSecondary} ${hoverBg}`
              }`}
            >
              Danh mục đầu tư
            </button>
            )}
            {canViewRestrictedTabs && (
              <button
                onClick={() => setActiveTab("alerts")}
                className={`w-full rounded-r-lg border-l-4 px-3 py-3 text-left text-sm transition-all ${
                  activeTab === "alerts"
                    ? `${bgCard} border-green-500 font-bold ${textPrimary}`
                    : `border-transparent ${textSecondary} ${hoverBg}`
                }`}
              >
                Cảnh báo
              </button>
            )}
          </nav>

          <button
            onClick={() => router.push(ROUTES.DASHBOARD)}
            className={`mt-auto rounded-lg border ${borderCls} px-3 py-2 text-sm ${textSecondary} transition-colors ${hoverBg}`}
          >
            Trở về dashboard
          </button>
        </aside>

        <main
          className={`h-[calc(100vh-64px)] w-full flex-1 overflow-y-auto ${bgPage} p-4 md:p-8`}
        >
          <div
            className={`mb-4 grid gap-2 ${canViewRestrictedTabs ? "grid-cols-5" : "grid-cols-3"} md:hidden`}
          >
            <button
              onClick={() => setActiveTab("account")}
              className={`rounded-lg px-2 py-2 text-xs font-semibold transition-colors ${
                activeTab === "account"
                  ? "bg-green-500 text-white"
                  : `${bgCard} ${textSecondary}`
              }`}
            >
              Tài khoản
            </button>

            <button
              onClick={() => setActiveTab("subscription")}
              className={`rounded-lg px-2 py-2 text-xs font-semibold transition-colors ${
                activeTab === "subscription"
                  ? "bg-green-500 text-white"
                  : `${bgCard} ${textSecondary}`
              }`}
            >
              Thành viên
            </button>

            {canViewRestrictedTabs && (
              <button
                onClick={() => setActiveTab("portfolio")}
                className={`rounded-lg px-2 py-2 text-xs font-semibold transition-colors ${
                  activeTab === "portfolio"
                    ? "bg-green-500 text-white"
                    : `${bgCard} ${textSecondary}`
                }`}
              >
                Danh mục
              </button>
            )}

            {canViewRestrictedTabs && (
              <button
                onClick={() => setActiveTab("transactions")}
                className={`rounded-lg px-2 py-2 text-xs font-semibold transition-colors ${
                  activeTab === "transactions"
                    ? "bg-green-500 text-white"
                    : `${bgCard} ${textSecondary}`
                }`}
              >
                Giao dịch
              </button>
            )}

            {canViewRestrictedTabs && (
              <button
                onClick={() => setActiveTab("alerts")}
                className={`rounded-lg px-2 py-2 text-xs font-semibold transition-colors ${
                  activeTab === "alerts"
                    ? "bg-green-500 text-white"
                    : `${bgCard} ${textSecondary}`
                }`}
              >
                Cảnh báo
              </button>
            )}
          </div>

          <div className="mx-auto flex max-w-7xl flex-col gap-6 xl:flex-row">
            <section className="xl:w-[340px] xl:flex-shrink-0">
              <div
                className={`overflow-hidden rounded-2xl border ${borderCls} ${bgCard} shadow-sm`}
              >
                <div className={`h-24 ${headingBg}`} />

                <div className="-mt-11 px-6 pb-7 text-center">
                  <div className="relative inline-block">
                    <AvatarDisplay
                      blobUrl={avatarBlobUrl}
                      loading={loadingAvatar}
                      size={96}
                    />

                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingAvatar}
                      className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-green-500 text-white transition-colors hover:bg-green-600 disabled:opacity-60"
                      aria-label="Đổi ảnh đại diện"
                    >
                      {uploadingAvatar ? (
                        <Spinner className="w-3.5 h-3.5" />
                      ) : (
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />

                  {uploadSuccess && (
                    <p className="mt-2 text-xs font-medium text-green-500">
                      Cập nhật ảnh đại diện thành công
                    </p>
                  )}

                  <p className={`mt-1 text-[11px] ${textMuted}`}>
                    Định dạng hỗ trợ: JPG, PNG, GIF
                  </p>

                  <div className="mt-6 space-y-3 text-left">
                    <div
                      className={`rounded-lg ${fieldBg} border ${borderCls} p-3`}
                    >
                      <p
                        className={`text-[10px] font-bold uppercase tracking-wider ${textMuted}`}
                      >
                        Họ và tên
                      </p>
                      <h1
                        className={`truncate text-sm font-medium ${textPrimary}`}
                      >
                        {displayUser?.fullName || "Người dùng"}
                      </h1>
                    </div>

                    <div
                      className={`rounded-lg ${fieldBg} border ${borderCls} p-3`}
                    >
                      <p
                        className={`text-[10px] font-bold uppercase tracking-wider ${textMuted}`}
                      >
                        Vai trò
                      </p>
                      <h1
                        className={`truncate text-sm font-medium ${textPrimary} `}
                      >
                        {displayUser?.role || "Member"}
                      </h1>
                    </div>

                    <div
                      className={`rounded-lg ${fieldBg} border ${borderCls} p-3`}
                    >
                      <p
                        className={`text-[10px] font-bold uppercase tracking-wider ${textMuted}`}
                      >
                        Số điện thoại
                      </p>
                      <p className={`text-sm font-medium ${textPrimary}`}>
                        {displayUser?.phoneNumber || "—"}
                      </p>
                    </div>

                    <div
                      className={`rounded-lg ${fieldBg} border ${borderCls} p-3`}
                    >
                      <p
                        className={`text-[10px] font-bold uppercase tracking-wider ${textMuted}`}
                      >
                        Email
                      </p>
                      <p
                        className={`truncate text-sm font-medium ${textPrimary}`}
                      >
                        {displayUser?.email || "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="flex-1 space-y-6">
              {activeTab === "account" && (
                <div
                  className={`rounded-2xl border ${borderCls} ${bgCard} p-6 shadow-sm md:p-8`}
                >
                  <div className="mb-6 space-y-1">
                    <h2 className="text-2xl font-extrabold tracking-tight">
                      Thiết lập tài khoản
                    </h2>
                    <p className={`text-sm ${textSecondary}`}>
                      Quản lý thông tin cá nhân và tùy chọn bảo mật của bạn.
                    </p>
                  </div>
                  <ProfileInfoTab user={user} />
                </div>
              )}

              {activeTab === "subscription" && (
                <div
                  className={`rounded-2xl border ${borderCls} ${bgCard} p-6 shadow-sm md:p-8`}
                >
                  <div className="mb-6 space-y-1">
                    <h2 className="text-2xl font-extrabold tracking-tight">
                      Gói thành viên
                    </h2>
                    <p className={`text-sm ${textSecondary}`}>
                      Theo dõi và nâng cấp quyền lợi thành viên theo nhu cầu sử
                      dụng.
                    </p>
                  </div>
                  <ProfileSubscriptionTab />
                </div>
              )}

              {activeTab === "portfolio" && canViewRestrictedTabs && (
                <div
                  className={`rounded-2xl border ${borderCls} ${bgCard} p-6 shadow-sm md:p-8`}
                >
                  <ProfilePortfolioTab />
                </div>
              )}

              {activeTab === "transactions" && canViewRestrictedTabs && (
                <ProfileTransactionTab />
              )}

              {activeTab === "alerts" && canViewRestrictedTabs && (
                <ProfileAlertTab />
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
