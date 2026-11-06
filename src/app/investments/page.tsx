import { getI18n } from '@/lib/i18n/server'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { ProjectTable } from '@/components/investments/ProjectTable'

export default async function InvestmentsPage() {
  const { t } = await getI18n()
  const investments = await prisma.investment.findMany({
    include: { analysisSettings: true, costs: true, revenues: true, capitalContributions: true },
    orderBy: { startDate: 'desc' },
  })
  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div><h1 className="text-3xl font-bold tracking-tight">{t("Projects")}</h1><p className="mt-2 text-muted-foreground">{t("Full-cycle forecasts, recorded cash flow and benchmark comparisons.")}</p></div>
      <Link href="/investments/new" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">{t("New project")}</Link>
    </div>
    <p className="text-sm text-muted-foreground">{t("Open a project to set and save its duration and rate. Partial cash flow is not final profit. Returns from different cycles must be compared over the same period.")}</p>
    <ProjectTable investments={investments} allowDelete />
  </div>
}
