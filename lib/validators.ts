import { z } from "zod";
import { WORKFLOWS, STATUSES } from "./types";

export const WorkflowEnum = z.enum(WORKFLOWS);
export const StatusEnum = z.enum(STATUSES);

export const CreateCallSchema = z.object({
  customerName: z.string().min(1).max(80),
  phoneNumber: z
    .string()
    .min(7)
    .max(20)
    .regex(/^[0-9+()\-\s]+$/, "Invalid phone number format"),
  workflow: WorkflowEnum,
  scheduledAt: z.string().datetime().optional(),
});

export const UpdateStatusSchema = z.object({
  status: StatusEnum,
});
