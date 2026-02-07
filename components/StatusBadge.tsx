import clsx from "clsx";
import type { CallStatus } from "@/lib/types";

export function StatusBadge({ status }: { status: CallStatus }) {
  const label =
    status === "PENDING" ? "pending" : status === "COMPLETED" ? "completed" : "failed";

  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        status === "PENDING" && "bg-yellow-100 text-yellow-800",
        status === "COMPLETED" && "bg-green-100 text-green-800",
        status === "FAILED" && "bg-red-100 text-red-800"
      )}
    >
      {label}
    </span>
  );
}
