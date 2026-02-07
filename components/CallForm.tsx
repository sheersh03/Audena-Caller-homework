"use client";

import { useMemo, useState } from "react";
import type { Workflow } from "@/lib/types";
import { getAuthHeaders } from "@/lib/api-headers";

// As a scalable option this data can be fetched from the server or API response or a config file, but for sample webapp it's hardcoded here.
const COUNTRY_OPTIONS = [
  { value: "+1", label: "United States (+1)", placeholder: "123 456 7890" },
  { value: "+44", label: "United Kingdom (+44)", placeholder: "7123 456789" },
  { value: "+91", label: "India (+91)", placeholder: "98765 43210" },
  { value: "+61", label: "Australia (+61)", placeholder: "4123 456 789" },
  { value: "+52", label: "Mexico (+52)", placeholder: "55 1234 5678" },
];

export function CallForm({ onCreated }: { onCreated: () => void }) {
  const [customerName, setCustomerName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState(COUNTRY_OPTIONS[0].value);
  const [scheduledAt, setScheduledAt] = useState("");
  const [workflow, setWorkflow] = useState<Workflow>("SUPPORT");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return customerName.trim().length > 0 && phoneNumber.trim().length >= 7 && !submitting;
  }, [customerName, phoneNumber, submitting]);

  const selectedCountry = COUNTRY_OPTIONS.find((option) => option.value === countryCode);
  const phonePlaceholder = selectedCountry?.placeholder ?? "123 456 7890";

  async function submit() {
    setError(null);
    setSubmitting(true);
    try {
      const fullPhoneNumber = `${countryCode}${phoneNumber.trim()}`;
      const body: Record<string, unknown> = {
        customerName,
        phoneNumber: fullPhoneNumber,
        workflow,
      };
      // Optional scheduledAt field is added only when user selects a date, otherwise the call will be created for immediate dialing.
      // As a scalable option, later on we'll integrate the online cron scheduler to process the scheduled calls, but for the demo app, it's sufficient to handle this via a simple timestamp check in the provider webhook simulation.
      if (scheduledAt) {
        body.scheduledAt = new Date(scheduledAt).toISOString();
      }
      const res = await fetch("/api/calls", {
        method: "POST",
        headers: getAuthHeaders({ "content-type": "application/json" }),
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await safeJson(res);
        throw new Error(data?.error || `Request failed (${res.status})`);
      }
      setCustomerName("");
      setPhoneNumber("");
      setScheduledAt("");
      setWorkflow("SUPPORT");
      onCreated();
    } catch (e: any) {
      setError(e?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold">Create a call</h2>
      <p className="mt-1 text-sm text-slate-600">
        Submit a request and watch the status update via a simulated provider webhook.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        <label className="grid gap-1">
          <span className="text-sm font-medium text-slate-700">Customer name</span>
          <input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="e.g., Sheersh Atrishi"
            className="h-10 rounded-xl border px-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
          />
        </label>

        <label className="grid gap-1">
          <span className="text-sm font-medium text-slate-700">Country code</span>
          <select
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            className="h-10 rounded-xl border px-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
          >
            {COUNTRY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 sm:col-span-2">
          <span className="text-sm font-medium text-slate-700">Phone number</span>
          <input
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder={phonePlaceholder}
            className="h-10 rounded-xl border px-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
          />
        </label>

        <label className="grid gap-1">
          <span className="text-sm font-medium text-slate-700">Workflow</span>
          <select
            value={workflow}
            onChange={(e) => setWorkflow(e.target.value as Workflow)}
            className="h-10 rounded-xl border px-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
          >
            <option value="SUPPORT">Support</option>
            <option value="SALES">Sales</option>
            <option value="REMINDER">Reminder</option>
          </select>
        </label>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 sm:col-span-2">
          <span className="text-sm font-medium text-slate-700">Schedule a call (optional)</span>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="h-10 rounded-xl border px-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
          />
          <p className="text-xs text-slate-500">
            Choose a time slot and the call will stay pending until the scheduled moment. Leave empty for immediate dialing.
          </p>
        </label>
      </div>

      {error && (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="mt-4 flex items-center justify-end gap-2">
        <button
          disabled={!canSubmit}
          onClick={submit}
          className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {submitting ? "Submitting..." : "Request call"}
        </button>
      </div>
    </div>
  );
}

async function safeJson(res: Response) {
  try { return await res.json(); } catch { return null; }
}
