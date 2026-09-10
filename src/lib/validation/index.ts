import { z } from 'zod'

export const investmentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  status: z.enum(['PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED']),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional().nullable(),
  initialInvestment: z.coerce.number().min(0, 'Must be a positive number'),
  currency: z.string().min(3).max(3),
  notes: z.string().optional(),
})

export const costSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  costType: z.enum(['FIXED', 'VARIABLE']),
  projectedAmount: z.coerce.number().min(0, 'Must be positive'),
  actualAmount: z.coerce.number().min(0, 'Must be positive'),
  recurrence: z.enum(['ONE_TIME', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']),
  date: z.coerce.date(),
})

export const revenueSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  projectedAmount: z.coerce.number().min(0, 'Must be positive'),
  actualAmount: z.coerce.number().min(0, 'Must be positive'),
  date: z.coerce.date(),
})

export const capitalContributionSchema = z.object({
  amount: z.coerce.number().positive('Amount must be positive'),
  date: z.coerce.date(),
  description: z.string().optional(),
})

export type InvestmentInput = z.infer<typeof investmentSchema>
export type CostInput = z.infer<typeof costSchema>
export type RevenueInput = z.infer<typeof revenueSchema>
export type CapitalContributionInput = z.infer<typeof capitalContributionSchema>
