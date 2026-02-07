"use client";

import { useState } from "react";
import { CallForm } from "@/components/CallForm";
import { CallList } from "@/components/CallList";

export default function Home() {
  const [refreshToken, setRefreshToken] = useState(0);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-8">
        {/* <div className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          Provider + webhook simulated
        </div> */}
        <h1 className="mt-4 text-3xl font-bold tracking-tight">Audena Caller</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Submit a “call request”, then watch its status transition from <b>pending</b> to{" "}
          <b>completed</b> or <b>failed</b> after a simulated provider callback.
        </p>
      </header>

      <div className="grid gap-6">
        <CallForm onCreated={() => setRefreshToken((x) => x + 1)} />
        <CallList refreshToken={refreshToken} />
      </div>

    </main>
  );
}
