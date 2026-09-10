'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { investmentSchema, type InvestmentInput } from '@/lib/validation'
import { createInvestment, updateInvestment } from '@/lib/actions'
import { cn } from '@/lib/utils'
import type { Investment } from '@prisma/client'

interface InvestmentFormProps {
  initialData?: Investment
}

export function InvestmentForm({ initialData }: InvestmentFormProps) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<InvestmentInput>({
    resolver: zodResolver(investmentSchema) as any,
    defaultValues: initialData ? {
      name: initialData.name,
      description: initialData.description || '',
      category: initialData.category,
      status: initialData.status as any,
      initialInvestment: initialData.initialInvestment,
      currency: initialData.currency,
      startDate: new Date(initialData.startDate).toISOString().split('T')[0] as any,
      endDate: initialData.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] as any : undefined,
      notes: initialData.notes || '',
    } : {
      status: 'PLANNED',
      currency: 'USD',
      initialInvestment: 0,
      startDate: new Date().toISOString().split('T')[0] as any,
    },
  })

  const onSubmit = async (data: InvestmentInput) => {
    setIsPending(true)
    try {
      const formData = new FormData()
      Object.entries(data).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          formData.append(key, val.toString())
        }
      })

      if (initialData) {
        await updateInvestment(initialData.id, formData)
      } else {
        await createInvestment(formData)
      }
      router.push('/')
    } catch (error) {
      console.error(error)
    } finally {
      setIsPending(false)
    }
  }

  const inputClass = (hasError: boolean) =>
    cn(
      'w-full px-3 py-2 rounded-md text-sm bg-background border outline-none transition-colors focus:ring-2 focus:ring-primary placeholder:text-muted-foreground',
      hasError ? 'border-destructive' : 'border-input'
    )

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium">Project Name</label>
          <input
            {...register('name')}
            placeholder="e.g. Downtown Apartment, SaaS Startup..."
            className={inputClass(!!errors.name)}
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Category</label>
          <select
            {...register('category')}
            className={inputClass(!!errors.category)}
          >
            <option value="">Select Category...</option>
            <option value="Business">Business</option>
            <option value="Startup">Startup</option>
            <option value="Real Estate">Real Estate</option>
            <option value="Stock Investment">Stock Investment</option>
            <option value="Private Investment">Private Investment</option>
            <option value="Software Project">Software Project</option>
            <option value="Other">Other</option>
          </select>
          {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Currency</label>
          <select
            {...register('currency')}
            className={inputClass(!!errors.currency)}
          >
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="BRL">BRL (R$)</option>
            <option value="GBP">GBP (£)</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Start Date</label>
          <input
            type="date"
            {...register('startDate')}
            className={inputClass(!!errors.startDate)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Status</label>
          <select
            {...register('status')}
            className={inputClass(!!errors.status)}
          >
            <option value="PLANNED">Planned</option>
            <option value="ACTIVE">Active</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
        
        {/* Hidden but required fields to simplify UI for user */}
        <input type="hidden" {...register('initialInvestment', { valueAsNumber: true })} value={0} />
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t border-border">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-sm font-medium border border-input rounded-md hover:bg-muted transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm"
        >
          {isPending ? 'Creating...' : 'Create Project'}
        </button>
      </div>
    </form>
  )
}
