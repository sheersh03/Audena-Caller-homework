"use client";

import { useEffect, useMemo, useState } from "react";
import { StatusBadge } from "./StatusBadge";
import type { CallStatus, Workflow } from "@/lib/types";
import { getAuthHeaders } from "@/lib/api-headers";

type Call = {
  id: string;
  customerName: string;
  phoneNumber: string;
  workflow: Workflow;
  status: CallStatus;
  createdAt: string;
  scheduledAt?: string | null;
};

export function CallList({ refreshToken }: { refreshToken: number }) {
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);

  const pendingCount = useMemo(
    () => calls.filter((c) => c.status === "PENDING").length,
    [calls]
  );

  async function load() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/calls", { cache: "no-store", headers: getAuthHeaders() });
      if (!res.ok) {
        const data = await safeJson(res);
        throw new Error(data?.error || `Failed to load (${res.status})`);
      }
      const data = await res.json();
      setCalls(data.calls);
    } catch (e: any) {
      setError(e?.message || "Failed to load calls");
    } finally {
      setLoading(false);
    }
  }

  async function clearAll() {
    setError(null);
    setClearing(true);
    try {
      const res = await fetch("/api/calls", { method: "DELETE", headers: getAuthHeaders() });
      if (!res.ok) {
        const data = await safeJson(res);
        throw new Error(data?.error || `Failed to clear (${res.status})`);
      }
      await load();
    } catch (e: any) {
      setError(e?.message || "Failed to clear call history");
    } finally {
      setClearing(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [refreshToken]);

  useEffect(() => {
    if (pendingCount === 0) return;
    const t = setInterval(() => load(), 1500);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingCount]);

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Call history</h2>
          <p className="mt-1 text-sm text-slate-600">
            Latest calls first. Status updates are driven by the provider webhook simulation.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="h-9 rounded-xl border px-3 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            Refresh
          </button>
          <button
            onClick={clearAll}
            disabled={clearing}
            className="h-9 rounded-xl border px-3 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {clearing ? "Clearing…" : "Clear all"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-left text-slate-600">
            <tr className="border-b">
              <th className="py-2 pr-3">Customer</th>
              <th className="py-2 pr-3">Phone</th>
              <th className="py-2 pr-3">Workflow</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2 pr-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="py-6 text-center text-slate-500">Loading…</td></tr>
            ) : calls.length === 0 ? (
              <tr><td colSpan={5} className="py-6 text-center text-slate-500">No calls yet. Create one above.</td></tr>
            ) : (
              calls.map((c) => (
                <tr key={c.id} className="border-b last:border-b-0">
                  <td className="py-3 pr-3 font-medium text-slate-900">{c.customerName}</td>
                  <td className="py-3 pr-3 text-slate-700">{c.phoneNumber}</td>
                  <td className="py-3 pr-3">
                    <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                      {labelWorkflow(c.workflow)}
                    </span>
                  </td>
                  <td className="py-3 pr-3 align-top">
                    <div className="flex flex-col gap-1">
                      <StatusBadge status={c.status} />
                      {c.status === "PENDING" && c.scheduledAt && (
                        <span className="text-xs text-slate-500">
                          Scheduled at {new Date(c.scheduledAt).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 pr-3 text-slate-600">{new Date(c.createdAt).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function labelWorkflow(w: Workflow) {
  return w === "SUPPORT" ? "Support" : w === "SALES" ? "Sales" : "Reminder";
}

async function safeJson(res: Response) {
  try { return await res.json(); } catch { return null; }
}
