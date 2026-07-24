import { z } from "zod";

// Shared schema: imported by both the client form (react-hook-free manual
// validation) and the API route, so the two can never drift out of sync.
export const leadSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name is too long"),
  email: z.string().trim().email("Enter a valid email address"),
  budgetRange: z.enum(
    ["<$1k", "$1k-$5k", "$5k-$15k", "$15k+", "Not sure yet"],
    { errorMap: () => ({ message: "Select a budget range" }) }
  ),
  message: z
    .string()
    .trim()
    .min(10, "Tell us a bit more (at least 10 characters)")
    .max(2000, "Message is too long"),
});

export type LeadInput = z.infer<typeof leadSchema>;

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const statusUpdateSchema = z.object({
  status: z.enum(["NEW", "CONTACTED", "CLOSED"]),
});
