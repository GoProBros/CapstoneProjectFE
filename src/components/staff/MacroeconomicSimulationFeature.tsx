"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import macroeconomicDataService from "@/services/macroeconomicDataService";
import type {
  MacroeconomicData,
  UpsertMacroeconomicDataRequest,
} from "@/types/macroeconomicData";

type FieldKey = Exclude<keyof UpsertMacroeconomicDataRequest, "recordDate">;

type MessageTone = "success" | "error" | "info";

interface StatusMessage {
  tone: MessageTone;
  text: string;
}

interface FieldConfig {
  key: FieldKey;
  label: string;
  min: number;
  max: number;
  step: number;
  unit?: string;
}

const FIELD_CONFIGS: FieldConfig[] = [
  {
    key: "govBondsReturn",
    label: "Lợi suất trái phiếu chính phủ",
    min: 0,
    max: 50,
    step: 0.01,
    unit: "%",
  },
  {
    key: "usdVndExchangeRate",
    label: "Tỷ giá USD/VND",
    min: 20000,
    max: 40000,
    step: 1,
  },
  {
    key: "usdVndExchangeRateReturn",
    label: "USD/VND Exchange Rate Return",
    min: 20000,
    max: 40000,
    step: 1,
  },
  {
    key: "equalWeightIndexReturn",
    label: "Equal Weight Index Return",
    min: -15,
    max: 15,
    step: 0.01,
    unit: "%",
  },
  {
    key: "marketIndexValue",
    label: "Market Index Value",
    min: 1000,
    max: 3000,
    step: 1,
  },
  {
    key: "marketIndexReturn",
    label: "Market Index Return",
    min: -10,
    max: 10,
    step: 0.01,
    unit: "%",
  },
  {
    key: "goldSpotUsdReturn",
    label: "Gold Spot USD Return",
    min: -10,
    max: 10,
    step: 0.01,
    unit: "%",
  },
];

const FORM_KEYS: Array<keyof UpsertMacroeconomicDataRequest> = [
  "recordDate",
  "govBondsReturn",
  "usdVndExchangeRate",
  "usdVndExchangeRateReturn",
  "equalWeightIndexReturn",
  "marketIndexValue",
  "marketIndexReturn",
  "goldSpotUsdReturn",
];

function getTodayDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

const DEFAULT_FORM_VALUES: UpsertMacroeconomicDataRequest = {
  recordDate: getTodayDate(),
  govBondsReturn: 0,
  usdVndExchangeRate: 25000,
  usdVndExchangeRateReturn: 25000,
  equalWeightIndexReturn: 0,
  marketIndexValue: 1200,
  marketIndexReturn: 0,
  goldSpotUsdReturn: 0,
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function formatNumericValue(value: number, step: number): string {
  const maximumFractionDigits = step < 1 ? 2 : 0;
  return new Intl.NumberFormat("vi-VN", {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  }).format(value);
}

function normalizeRecordDate(value: string | undefined): string {
  if (!value) {
    return getTodayDate();
  }

  return value.slice(0, 10);
}

function mapApiDataToForm(
  data: MacroeconomicData,
): UpsertMacroeconomicDataRequest {
  return {
    recordDate: normalizeRecordDate(data.recordDate),
    govBondsReturn: Number(data.govBondsReturn),
    usdVndExchangeRate: Number(data.usdVndExchangeRate),
    usdVndExchangeRateReturn: Number(data.usdVndExchangeRateReturn),
    equalWeightIndexReturn: Number(data.equalWeightIndexReturn),
    marketIndexValue: Number(data.marketIndexValue),
    marketIndexReturn: Number(data.marketIndexReturn),
    goldSpotUsdReturn: Number(data.goldSpotUsdReturn),
  };
}

function sliderBackground(value: number, min: number, max: number): string {
  const range = max - min;
  const normalizedPercent = range <= 0 ? 0 : ((value - min) / range) * 100;
  const percent = clamp(normalizedPercent, 0, 100);

  return `linear-gradient(to right, #2563eb 0%, #2563eb ${percent}%, #cbd5e1 ${percent}%, #cbd5e1 100%)`;
}

export default function MacroeconomicSimulationFeature() {
  const { user } = useAuth();
  const [formValues, setFormValues] =
    useState<UpsertMacroeconomicDataRequest>(DEFAULT_FORM_VALUES);
  const [baselineValues, setBaselineValues] =
    useState<UpsertMacroeconomicDataRequest>(DEFAULT_FORM_VALUES);
  const [isFetching, setIsFetching] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<StatusMessage | null>(null);

  const normalizedRole = user?.role?.trim().toLowerCase() ?? "";
  const isAdmin =
    normalizedRole === "admin" ||
    normalizedRole === "administrator" ||
    normalizedRole === "quản trị viên";

  const configByKey = useMemo(() => {
    return FIELD_CONFIGS.reduce<Record<FieldKey, FieldConfig>>(
      (accumulator, config) => {
        accumulator[config.key] = config;
        return accumulator;
      },
      {} as Record<FieldKey, FieldConfig>,
    );
  }, []);

  const isDirty = useMemo(() => {
    return FORM_KEYS.some((key) => formValues[key] !== baselineValues[key]);
  }, [formValues, baselineValues]);

  const handleLoadData = async () => {
    try {
      setIsFetching(true);
      setMessage(null);

      const data = await macroeconomicDataService.getMacroeconomicData();

      if (!data) {
        setFormValues(DEFAULT_FORM_VALUES);
        setBaselineValues(DEFAULT_FORM_VALUES);
        setMessage({
          tone: "info",
          text: "Chưa có dữ liệu trong database. Bạn có thể nhập và bấm Cập nhật để tạo dữ liệu mới.",
        });
        return;
      }

      const mappedData = mapApiDataToForm(data);
      setFormValues(mappedData);
      setBaselineValues(mappedData);
      setMessage({
        tone: "success",
        text: "Đã tải dữ liệu vĩ mô từ database thành công.",
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Không thể tải dữ liệu kinh tế vĩ mô";
      setMessage({
        tone: "error",
        text: errorMessage,
      });
    } finally {
      setIsFetching(false);
    }
  };

  const handleResetChanges = () => {
    setFormValues(baselineValues);
    setMessage({
      tone: "info",
      text: "Đã hủy các thay đổi chưa lưu.",
    });
  };

  const updateNumericField = (key: FieldKey, rawValue: string) => {
    const parsedValue = Number(rawValue.replace(",", "."));
    if (!Number.isFinite(parsedValue)) {
      return;
    }

    const fieldConfig = configByKey[key];
    const clampedValue = clamp(parsedValue, fieldConfig.min, fieldConfig.max);

    setFormValues((previous) => ({
      ...previous,
      [key]: clampedValue,
    }));
  };

  const handleUpdateData = async () => {
    if (!formValues.recordDate) {
      setMessage({
        tone: "error",
        text: "Vui lòng chọn ngày ghi nhận trước khi cập nhật.",
      });
      return;
    }

    try {
      setIsUpdating(true);
      setMessage(null);

      const updatedData =
        await macroeconomicDataService.upsertMacroeconomicData(formValues);
      const mappedData = mapApiDataToForm(updatedData);
      setFormValues(mappedData);
      setBaselineValues(mappedData);
      setMessage({
        tone: "success",
        text: "Cập nhật dữ liệu kinh tế vĩ mô thành công.",
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Không thể cập nhật dữ liệu kinh tế vĩ mô";
      setMessage({
        tone: "error",
        text: errorMessage,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-3xl mx-auto rounded-xl border border-amber-200 bg-amber-50 px-6 py-5 text-amber-800">
        Chức năng Mô phỏng vĩ mô (DEMO) chỉ hiển thị cho tài khoản Admin.
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 font-headline mb-2">
            Mô phỏng vĩ mô (DEMO)
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-3xl">
            Tinh chỉnh nhanh dữ liệu kinh tế vĩ mô bằng thanh kéo và ô nhập số,
            sau đó cập nhật trực tiếp vào hệ thống để phục vụ mục đích demo.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleLoadData}
            disabled={isFetching || isUpdating}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isFetching ? "Đang lấy dữ liệu..." : "Lấy dữ liệu"}
          </button>
          <button
            type="button"
            onClick={handleResetChanges}
            disabled={!isDirty || isFetching || isUpdating}
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Hủy thay đổi
          </button>
          <button
            type="button"
            onClick={handleUpdateData}
            disabled={isFetching || isUpdating}
            className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isUpdating ? "Đang cập nhật..." : "Cập nhật"}
          </button>
        </div>
      </div>

      <div className="rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 p-5 md:p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label
              htmlFor="recordDate"
              className="block text-sm font-semibold text-slate-800 dark:text-slate-100"
            >
              Ngày ghi nhận
            </label>
            <input
              id="recordDate"
              type="date"
              value={formValues.recordDate}
              onChange={(event) => {
                setFormValues((previous) => ({
                  ...previous,
                  recordDate: event.target.value,
                }));
              }}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        <div className="space-y-4">
          {FIELD_CONFIGS.map((field) => (
            <div
              key={field.key}
              className="rounded-lg border border-slate-200 dark:border-slate-700 p-4"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
                <div className="lg:w-64">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {field.label}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Min: {formatNumericValue(field.min, field.step)}
                    {field.unit ? ` ${field.unit}` : ""} | Max:{" "}
                    {formatNumericValue(field.max, field.step)}
                    {field.unit ? ` ${field.unit}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-200 dark:hover:bg-blue-900/50"
                >
                  Lấy dữ liệu
                </button>
                <div className="flex-1 space-y-3">
                  <input
                    type="range"
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    value={formValues[field.key]}
                    onChange={(event) =>
                      updateNumericField(field.key, event.target.value)
                    }
                    className="w-full h-2 appearance-none rounded-lg cursor-pointer"
                    style={{
                      background: sliderBackground(
                        formValues[field.key],
                        field.min,
                        field.max,
                      ),
                    }}
                  />

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      value={formValues[field.key]}
                      onChange={(event) =>
                        updateNumericField(field.key, event.target.value)
                      }
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                    />
                    {field.unit && (
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                        {field.unit}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
