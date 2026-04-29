"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts";
import type { User } from "@/types/auth";
import { getTelegramStartLink } from "@/services/notifications/telegramService";
import { getMe, updateMyProfile } from "@/services/auth/authService";
import { ResetPasswordSection } from "./ResetPasswordSection";
import { useProfileTheme } from "./useProfileTheme";

interface ProfileInfoTabProps {
  user: User | null;
  onProfileUpdated?: (nextUser: User) => void;
}

export function ProfileInfoTab({ user, onProfileUpdated }: ProfileInfoTabProps) {
  const { user: authUser, updateUser } = useAuth();
  const { borderCls, textPrimary, textSecondary, textMuted, fieldBg, hoverBg } =
    useProfileTheme();
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [connectingTelegram, setConnectingTelegram] = useState(false);
  const [telegramError, setTelegramError] = useState<string | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileFullName, setProfileFullName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const displayUser = user || authUser;
  const isTelegramLinked = Boolean(
    displayUser?.isTelegramLinked && displayUser?.telegramChatId,
  );

  useEffect(() => {
    setProfileFullName(displayUser?.fullName ?? "");
    setProfilePhone(displayUser?.phoneNumber ?? "");
  }, [displayUser?.fullName, displayUser?.phoneNumber]);

  const leftFields: { label: string; value: string }[] = [
    { label: "Họ và tên", value: displayUser?.fullName || "—" },
    { label: "Số điện thoại", value: displayUser?.phoneNumber || "—" },
    { label: "Vai trò", value: displayUser?.role || "—" },
  ];

  const rightFields: { label: string; value: string }[] = [
    { label: "Email", value: displayUser?.email || "—" },
    {
      label: "Trạng thái Telegram",
      value: isTelegramLinked ? "Đã liên kết" : "Chưa liên kết",
    },
    { label: "Mã chat Telegram", value: displayUser?.telegramChatId || "—" },
  ];

  const email = displayUser?.email || "";

  const handleEditProfile = () => {
    setIsEditingProfile(true);
    setProfileError(null);
    setProfileSuccess(null);
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    setProfileError(null);
    setProfileSuccess(null);
    setProfileFullName(displayUser?.fullName ?? "");
    setProfilePhone(displayUser?.phoneNumber ?? "");
  };

  const handleSaveProfile = async () => {
    const normalizedFullName = profileFullName.trim();
    const normalizedPhone = profilePhone.trim();
    const currentFullName = displayUser?.fullName?.trim() ?? "";
    const currentPhone = displayUser?.phoneNumber?.trim() ?? "";

    const hasNameChange = normalizedFullName !== currentFullName;
    const hasPhoneChange = normalizedPhone !== currentPhone;

    if (!hasNameChange && !hasPhoneChange) {
      setProfileError("Không có thay đổi để lưu.");
      setProfileSuccess(null);
      return;
    }

    if (hasNameChange) {
      if (!normalizedFullName) {
        setProfileError("Họ và tên không được để trống.");
        setProfileSuccess(null);
        return;
      }

      if (normalizedFullName.length > 24) {
        setProfileError("Họ và tên không được vượt quá 24 ký tự.");
        setProfileSuccess(null);
        return;
      }
    }

    if (hasPhoneChange) {
      if (!normalizedPhone) {
        setProfileError("Số điện thoại không được để trống.");
        setProfileSuccess(null);
        return;
      }

      const phoneRegex = /^(\+84|0)[0-9]{9,10}$/;
      if (!phoneRegex.test(normalizedPhone)) {
        setProfileError(
          "Số điện thoại không hợp lệ. Định dạng: +84xxxxxxxxx hoặc 0xxxxxxxxx.",
        );
        setProfileSuccess(null);
        return;
      }
    }

    setIsSavingProfile(true);
    setProfileError(null);
    setProfileSuccess(null);

    try {
      await updateMyProfile({
        fullName: hasNameChange ? normalizedFullName : null,
        phoneNumber: hasPhoneChange ? normalizedPhone : null,
      });

      const refreshedUser = await getMe();
      updateUser(refreshedUser);
      onProfileUpdated?.(refreshedUser);

      setProfileSuccess("Cập nhật thông tin thành công.");
      setIsEditingProfile(false);
    } catch (error) {
      setProfileError(
        error instanceof Error
          ? error.message
          : "Không thể cập nhật thông tin. Vui lòng thử lại.",
      );
      setProfileSuccess(null);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleConnectTelegram = async () => {
    setConnectingTelegram(true);
    setTelegramError(null);

    try {
      const result = await getTelegramStartLink();
      const targetUrl =
        result.deepLink ||
        (result.botUsername
          ? `https://t.me/${result.botUsername}?start=${result.startToken}`
          : null);

      if (!targetUrl) {
        throw new Error("Không tìm thấy liên kết Telegram hợp lệ");
      }

      window.open(targetUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      setTelegramError(
        error instanceof Error
          ? error.message
          : "Không thể mở liên kết Telegram",
      );
    } finally {
      setConnectingTelegram(false);
    }
  };

  return (
    <div className="space-y-5">
      <section
        className={`rounded-xl border ${borderCls} ${fieldBg} p-4 md:p-5`}
      >
        <h3 className={`mb-4 text-base font-semibold ${textPrimary}`}>
          Tài khoản liên kết
        </h3>
        <div
          className={`flex flex-col gap-4 rounded-lg border ${borderCls} bg-transparent p-4 md:flex-row md:items-center md:justify-between`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/15 text-green-500">
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
            </div>
            <div>
              <p className={`text-sm font-semibold ${textPrimary}`}>Telegram</p>
              <p className={`text-xs ${textSecondary}`}>
                Nhận thông báo giao dịch thời gian thực
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 md:items-end">
            <button
              type="button"
              className={`w-fit rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                isTelegramLinked
                  ? "bg-green-500 text-white"
                  : `bg-amber-500/15 text-amber-500 ${hoverBg}`
              }`}
            >
              {isTelegramLinked ? "Đã kết nối" : "Chưa kết nối"}
            </button>

            {!isTelegramLinked && (
              <button
                type="button"
                onClick={handleConnectTelegram}
                disabled={connectingTelegram}
                className="w-fit rounded-lg bg-green-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {connectingTelegram
                  ? "Đang mở Telegram..."
                  : "Kết nối Telegram"}
              </button>
            )}
          </div>
        </div>
        {telegramError && (
          <p className="mt-2 text-xs text-red-500">{telegramError}</p>
        )}
      </section>

      <section
        className={`rounded-xl border ${borderCls} ${fieldBg} p-4 md:p-5`}
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className={`text-base font-semibold ${textPrimary}`}>
            Thông tin tài khoản
          </h3>
          {isEditingProfile ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={isSavingProfile}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${borderCls} ${textSecondary} ${hoverBg} disabled:opacity-60`}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={isSavingProfile}
                className="rounded-lg bg-green-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-green-600 disabled:opacity-60"
              >
                {isSavingProfile ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleEditProfile}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${borderCls} ${textSecondary} ${hoverBg}`}
            >
              Chỉnh sửa
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className={`rounded-lg border ${borderCls} bg-transparent p-3`}>
            <p className={`text-[10px] font-bold uppercase tracking-wider ${textMuted}`}>
              Họ và tên
            </p>
            {isEditingProfile ? (
              <input
                value={profileFullName}
                onChange={(e) => setProfileFullName(e.target.value)}
                disabled={isSavingProfile}
                className={`mt-1 w-full rounded-md border ${borderCls} ${fieldBg} px-3 py-2 text-sm ${textPrimary} focus:outline-none focus:ring-1 focus:ring-green-500 disabled:opacity-60`}
                placeholder="Nhập họ và tên"
              />
            ) : (
              <p className={`mt-1 text-sm font-medium ${textPrimary}`}>
                {displayUser?.fullName || "—"}
              </p>
            )}
          </div>

          <div className={`rounded-lg border ${borderCls} bg-transparent p-3`}>
            <p className={`text-[10px] font-bold uppercase tracking-wider ${textMuted}`}>
              Số điện thoại
            </p>
            {isEditingProfile ? (
              <div className="space-y-1">
                <input
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  disabled={isSavingProfile}
                  className={`mt-1 w-full rounded-md border ${borderCls} ${fieldBg} px-3 py-2 text-sm ${textPrimary} focus:outline-none focus:ring-1 focus:ring-green-500 disabled:opacity-60`}
                  placeholder="Nhập số điện thoại"
                />
              </div>
            ) : (
              <p className={`mt-1 text-sm font-medium ${textPrimary}`}>
                {displayUser?.phoneNumber || "—"}
              </p>
            )}
          </div>

          {[...leftFields.slice(2), ...rightFields].map((field) => (
            <div
              key={field.label}
              className={`rounded-lg border ${borderCls} bg-transparent p-3`}
            >
              <p
                className={`text-[10px] font-bold uppercase tracking-wider ${textMuted}`}
              >
                {field.label}
              </p>
              <p className={`mt-1 text-sm font-medium ${textPrimary}`}>
                {field.value}
              </p>
            </div>
          ))}
        </div>

        {profileError && (
          <p className="mt-3 text-xs text-red-500">{profileError}</p>
        )}
        {profileSuccess && (
          <p className="mt-3 text-xs text-green-500">{profileSuccess}</p>
        )}
      </section>

      <section
        className={`rounded-xl border ${borderCls} ${fieldBg} p-4 md:p-5`}
      >
        <h3 className={`mb-4 text-base font-semibold ${textPrimary}`}>
          Đổi mật khẩu
        </h3>
        <ResetPasswordSection email={email} />
      </section>

      <section
        className={`rounded-xl border border-red-500/30 ${fieldBg} p-4 md:p-5`}
      >
        <h3 className="mb-3 text-base font-semibold text-red-500">
          Vùng nguy hiểm
        </h3>
        <p className={`mb-4 text-xs ${textPrimary}`}>
          Vô hiệu hóa tài khoản sẽ mất quyền truy cập. Tất cả dữ liệu cá nhân sẽ
          bị ẩn và không thể truy cập được. Hãy chắc chắn rằng bạn muốn thực
          hiện hành động này.
        </p>

        <label
          className={`mb-4 flex items-center gap-2 text-sm ${textPrimary}`}
        >
          <input
            type="checkbox"
            checked={confirmDeactivate}
            onChange={(e) => setConfirmDeactivate(e.target.checked)}
            className="h-4 w-4 accent-red-500"
          />
          Tôi xác nhận muốn vô hiệu hóa tài khoản
        </label>

        <button
          type="button"
          disabled={!confirmDeactivate}
          className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Vô hiệu hóa tài khoản
        </button>
        <p className={`mt-2 text-[11px] ${textMuted}`}>
          Chức năng này đang được phát triển.
        </p>
      </section>
    </div>
  );
}
