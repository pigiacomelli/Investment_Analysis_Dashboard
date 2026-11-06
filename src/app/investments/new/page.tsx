import { getI18n } from '@/lib/i18n/server'
import { InvestmentForm } from '@/components/investments/InvestmentForm'

export default async function NewInvestmentPage() {
  const { t } = await getI18n()
  return (
    <div className="max-w-2xl mx-auto space-y-6 mt-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("New Project")}</h1>
        <p className="text-muted-foreground">{t("Create a new investment or project in your portfolio.")}</p>
      </div>
      
      <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm p-6">
        <InvestmentForm />
      </div>
    </div>
  )
}
