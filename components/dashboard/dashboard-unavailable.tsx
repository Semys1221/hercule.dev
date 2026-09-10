import { DASHBOARD_UNAVAILABLE_MESSAGE } from "@/lib/dashboard/copy";

export function DashboardUnavailable() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-6">
      <p className="max-w-md text-center text-sm text-zinc-400">
        {DASHBOARD_UNAVAILABLE_MESSAGE}
      </p>
    </div>
  );
}
