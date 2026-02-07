export const WORKFLOWS = ["SUPPORT", "SALES", "REMINDER"] as const;
export type Workflow = (typeof WORKFLOWS)[number];

export const STATUSES = ["PENDING", "COMPLETED", "FAILED"] as const;
export type CallStatus = (typeof STATUSES)[number];
