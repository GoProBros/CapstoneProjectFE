import SubscriptionManagement from "./SubscriptionManagement";

interface SubscriptionProps {
  isLoading: boolean;
}

export default function Subscription({
  isLoading,
}: SubscriptionProps) {
  return (
    <section className="space-y-8">
      <div className="flex items-center gap-2">
        <span className="h-6 w-1 rounded-full bg-blue-500"></span>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Quản lý gói đăng ký
        </h2>
      </div>
      <SubscriptionManagement isLoading={isLoading} />
    </section>
  );
}
