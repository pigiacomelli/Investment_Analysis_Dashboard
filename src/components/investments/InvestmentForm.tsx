'use client'

import { useI18n } from '@/lib/i18n/client'

import { useState } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
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
  const { t } = useI18n()
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<InvestmentInput>({
    resolver: zodResolver(investmentSchema) as unknown as Resolver<InvestmentInput>,
    defaultValues: initialData ? {
      name: initialData.name,
      description: initialData.description || '',
      category: initialData.category,
      status: initialData.status as InvestmentInput['status'],
      initialInvestment: initialData.initialInvestment,
      currency: initialData.currency,
      startDate: new Date(initialData.startDate).toISOString().split('T')[0] as unknown as Date,
      endDate: initialData.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] as unknown as Date : undefined,
      notes: initialData.notes || '',
    } : {
      status: 'PLANNED',
      currency: 'USD',
      initialInvestment: 0,
      startDate: new Date().toISOString().split('T')[0] as unknown as Date,
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
          <label className="text-sm font-medium">{t("Project Name")}</label>
          <input
            {...register('name')}
            placeholder={t("e.g. Downtown Apartment, SaaS Startup...")}
            className={inputClass(!!errors.name)}
          />
          {errors.name && <p className="text-xs text-destructive">{t(errors.name.message || '')}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">{t("Category")}</label>
          <select
            {...register('category')}
            className={inputClass(!!errors.category)}
          >
            <option value="">{t("Select Category...")}</option>
            <option value="Business">{t("Business")}</option>
            <option value="Startup">{t("Startup")}</option>
            <option value="Real Estate">{t("Real Estate")}</option>
            <option value="Stock Investment">{t("Stock Investment")}</option>
            <option value="Private Investment">{t("Private Investment")}</option>
            <option value="Software Project">{t("Software Project")}</option>
            <option value="Other">{t("Other")}</option>
          </select>
          {errors.category && <p className="text-xs text-destructive">{t(errors.category.message || '')}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">{t("Currency")}</label>
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
          <label htmlFor="initialInvestment" className="text-sm font-medium">{t("Initial Capital")}</label>
          <input
            id="initialInvestment"
            type="number"
            min="0"
            step="0.01"
            {...register('initialInvestment', { valueAsNumber: true })}
            className={inputClass(!!errors.initialInvestment)}
          />
          <p className="text-xs text-muted-foreground">{t("Capital contributed to fund the project; ROI is calculated separately on total project costs.")}</p>
          {errors.initialInvestment && <p className="text-xs text-destructive">{t(errors.initialInvestment.message || '')}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">{t("Start Date")}</label>
          <input
            type="date"
            {...register('startDate')}
            className={inputClass(!!errors.startDate)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">{t("Status")}</label>
          <select
            {...register('status')}
            className={inputClass(!!errors.status)}
          >
            <option value="PLANNED">{t("Planned")}</option>
            <option value="ACTIVE">{t("Active")}</option>
            <option value="COMPLETED">{t("Completed")}</option>
            <option value="CANCELLED">{t("Cancelled")}</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t border-border">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-sm font-medium border border-input rounded-md hover:bg-muted transition-colors"
        >{t("Cancel")}{" "}</button>
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm"
        >
          {isPending ? t("Saving...") : initialData ? t("Save Project") : t("Create Project")}
        </button>
      </div>
    </form>
  )
}
