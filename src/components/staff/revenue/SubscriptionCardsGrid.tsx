import { CalendarDays, Wallet } from "lucide-react";
import type { SubscriptionWithStatus } from "@/components/staff/revenue/subscriptionManagementModels";

interface SubscriptionCardsGridProps {
  subscriptions: SubscriptionWithStatus[];
  selectedSubscriptionId: number | null;
  onSelectSubscription: (subscriptionId: number) => void;
  formatCurrency: (value: number) => string;
  formatDuration: (value: number) => string;
}

export default function SubscriptionCardsGrid({
  subscriptions,
  selectedSubscriptionId,
  onSelectSubscription,
  formatCurrency,
  formatDuration,
}: SubscriptionCardsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {subscriptions.map((subscription) => {
        const isSelected = selectedSubscriptionId === subscription.id;

        return (
          <button
            key={subscription.id}
            type="button"
            onClick={() => onSelectSubscription(subscription.id)}
            className={`text-left rounded-xl border p-6 transition-all ${
              isSelected
                ? "border-slate-900 dark:border-slate-100 shadow-md"
                : "border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500"
            }`}
          >
            <p className="text-lg font-extrabold text-slate-900 dark:text-slate-100 leading-tight">
              {subscription.name}
            </p>

            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mt-3 ${
                subscription.isActive
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
              }`}
            >
              {subscription.isActive ? "Đang hoạt động" : "Tạm ngưng"}
            </span>

            <div className="space-y-3 mt-5">
              <p className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <Wallet className="w-4 h-4" />
                {formatCurrency(subscription.price)}
              </p>
              <p className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <CalendarDays className="w-4 h-4" />
                {formatDuration(subscription.durationInDays)}
              </p>
            </div>

            <div className="mt-6">
              <span
                className={`inline-flex w-full justify-center rounded-lg px-3 py-2.5 text-sm font-bold ${
                  isSelected
                    ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900"
                    : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                }`}
              >
                {isSelected ? "Đang được chọn" : "Cấu hình"}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
