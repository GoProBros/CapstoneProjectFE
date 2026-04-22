"use client";

import React, { useState } from "react";
import { forgotPassword, resetPassword } from "@/services/auth/authService";
import { Spinner } from "./Spinner";
import { useProfileTheme } from "./useProfileTheme";

type ResetStep = "idle" | "sending" | "form" | "submitting" | "done";
type OtpState = "idle" | "typing" | "valid" | "invalid";

interface ResetPasswordSectionProps {
  email: string;
}

export function ResetPasswordSection({ email }: ResetPasswordSectionProps) {
  const { borderCls, textPrimary, textSecondary, textMuted, hoverBg, fieldBg } =
    useProfileTheme();

  const [resetStep, setResetStep] = useState<ResetStep>("idle");
  const [resetOtp, setResetOtp] = useState("");
  const [otpState, setOtpState] = useState<OtpState>("idle");
  const [resetNewPwd, setResetNewPwd] = useState("");
  const [resetConfirmPwd, setResetConfirmPwd] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);

  const handleSendOtp = async () => {
    if (!email) return;
    setResetStep("sending");
    setResetError(null);
    try {
      await forgotPassword(email);
      setResetOtp("");
      setOtpState("idle");
      setResetStep("form");
    } catch (err: unknown) {
      setResetError(
        err instanceof Error ? err.message : "Đã xảy ra lỗi khi gửi OTP",
      );
      setResetStep("idle");
    }
  };

  const handleOtpChange = (value: string) => {
    const nextOtp = value.replace(/\D/g, "").slice(0, 6);
    setResetOtp(nextOtp);

    if (nextOtp.length === 0) {
      setOtpState("idle");
      return;
    }

    if (/^\d{6}$/.test(nextOtp)) {
      setOtpState("valid");
      setResetError(null);
      return;
    }

    setOtpState(nextOtp.length < 6 ? "typing" : "invalid");
  };

  const canSubmit =
    resetStep === "form" &&
    otpState === "valid" &&
    resetNewPwd.length >= 6 &&
    resetConfirmPwd.length > 0 &&
    resetNewPwd === resetConfirmPwd;

  const handleSubmitReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetStep === "idle") {
      setResetError("Vui lòng lấy OTP trước khi đổi mật khẩu");
      return;
    }
    if (otpState !== "valid") {
      setResetError("OTP chưa hợp lệ");
      return;
    }
    if (resetNewPwd !== resetConfirmPwd) {
      setResetError("Mật khẩu xác nhận không khớp");
      return;
    }
    if (resetNewPwd.length < 6) {
      setResetError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }
    if (!email) return;
    setResetStep("submitting");
    setResetError(null);
    try {
      await resetPassword(email, resetOtp, resetNewPwd);
      setResetStep("done");
    } catch (err: unknown) {
      setResetError(err instanceof Error ? err.message : "Đã xảy ra lỗi");
      setResetStep("form");
    }
  };

  if (resetStep === "done") {
    return (
      <div
        className={`rounded-lg border ${borderCls} ${fieldBg} p-4 flex items-center justify-between gap-3`}
      >
        <div className="flex items-center gap-2 text-sm text-green-500">
          <svg
            className="w-5 h-5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          Mật khẩu đã được đặt lại thành công!
        </div>
        <button
          onClick={() => {
            setResetStep("idle");
            setResetError(null);
            setResetOtp("");
            setOtpState("idle");
            setResetNewPwd("");
            setResetConfirmPwd("");
          }}
          className={`text-xs underline ${textMuted}`}
        >
          Đặt lại
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmitReset}
      className={`rounded-xl border ${borderCls} ${fieldBg} p-4 space-y-3`}
    >
      {(resetStep === "form" || resetStep === "submitting") && (
        <p className={`text-xs ${textSecondary}`}>
          OTP sẽ được gửi về email{" "}
          <span className={`font-medium ${textPrimary}`}>{email}</span>. Mã có
          hiệu lực trong 15 phút.
        </p>
      )}

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              className={`block text-xs font-medium uppercase tracking-wide mb-1 ${textMuted}`}
            >
              Mật khẩu mới
            </label>
            <input
              type="password"
              value={resetNewPwd}
              onChange={(e) => setResetNewPwd(e.target.value)}
              placeholder="Nhập mật khẩu mới"
              required
              className={`w-full px-3 py-2 rounded-lg border text-sm ${borderCls} ${textPrimary} bg-transparent focus:outline-none focus:border-green-500`}
            />
          </div>

          <div>
            <label
              className={`block text-xs font-medium uppercase tracking-wide mb-1 ${textMuted}`}
            >
              Xác nhận mật khẩu mới
            </label>
            <input
              type="password"
              value={resetConfirmPwd}
              onChange={(e) => setResetConfirmPwd(e.target.value)}
              placeholder="Nhập lại mật khẩu mới"
              required
              className={`w-full px-3 py-2 rounded-lg border text-sm ${borderCls} ${textPrimary} bg-transparent focus:outline-none focus:border-green-500`}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 items-end">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={resetOtp}
              onChange={(e) => handleOtpChange(e.target.value)}
              placeholder="Nhập mã OTP 6 số để tiếp tục"
              required
              className={`w-full px-3 py-2 rounded-lg border text-sm ${borderCls} ${textPrimary} bg-transparent focus:outline-none focus:border-green-500`}
            />

          <button
            type="button"
            onClick={handleSendOtp}
            disabled={
              resetStep === "sending" || resetStep === "submitting" || !email
            }
            className="w-full py-2 rounded-lg bg-gray-600 hover:bg-gray-800 text-white text-xs font-semibold transition-colors disabled:opacity-60"
          >
            {resetStep === "sending" ? (
              <span className="flex items-center justify-center gap-1">
                <Spinner className="w-3.5 h-3.5" /> Đang gửi OTP
              </span>
            ) : (
              "Lấy OTP"
            )}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              setResetStep("idle");
              setResetError(null);
              setResetOtp("");
              setOtpState("idle");
              setResetNewPwd("");
              setResetConfirmPwd("");
            }}
            className={`w-full py-2 rounded-lg border text-xs font-medium transition-colors ${borderCls} ${textSecondary} ${hoverBg}`}
          >
            Hủy thao tác
          </button>
          <button
            type="submit"
            disabled={resetStep === "submitting" || !canSubmit}
            className="w-full py-2.5 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {resetStep === "submitting" ? (
              <>
                <Spinner className="w-4 h-4" /> Đang xử lý...
              </>
            ) : (
              "Đổi mật khẩu"
            )}
          </button>
        </div>
      </div>

      {otpState === "typing" && (
        <p className={`text-xs ${textMuted}`}>Đang kiểm tra OTP...</p>
      )}
      {otpState === "valid" && (
        <p className="text-xs text-green-500">
          OTP hợp lệ. Bạn có thể đổi mật khẩu.
        </p>
      )}
      {otpState === "invalid" && (
        <p className="text-xs text-red-500">OTP không hợp lệ.</p>
      )}

      {resetError && <p className="text-xs text-red-500">{resetError}</p>}
    </form>
  );
}
