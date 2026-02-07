import type { CallStatus } from "./types";

function clampInt(v: string | undefined, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : fallback;
}

function clampRate(v: string | undefined, fallback: number) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(1, Math.max(0, n));
}

export function pickProviderDelayMs() {
  const min = clampInt(process.env.PROVIDER_DELAY_MS_MIN, 800);
  const max = clampInt(process.env.PROVIDER_DELAY_MS_MAX, 2200);
  if (max <= min) return min;
  return min + Math.floor(Math.random() * (max - min + 1));
}

export function pickOutcome(): CallStatus {
  const failRate = clampRate(process.env.PROVIDER_FAIL_RATE, 0.15);
  return Math.random() < failRate ? "FAILED" : "COMPLETED";
}
