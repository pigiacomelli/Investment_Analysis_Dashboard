import { getI18n } from '@/lib/i18n/server'
import { prisma } from '@/lib/db'
import { summarizePortfolio, summarizeProject } from '@/lib/finance'
import { MetricCard } from '@/components/investments/MetricCard'
import { ProjectTable } from '@/components/investments/ProjectTable'

export default async function AnalyticsPage() {
  const { t, formatCurrency, formatPercentage } = await getI18n()
  const investments = await prisma.investment.findMany({
    include: { analysisSettings: true, costs: true, revenues: true, capitalContributions: true },
    orderBy: { createdAt: 'desc' },
  })
  const summaries = investments.map(summarizeProject)
  const groups = summarizePortfolio(investments)
  return <div className="space-y-6">
    <div><h1 className="text-3xl font-bold tracking-tight">{t("Portfolio analytics")}</h1><p className="mt-2 text-muted-foreground">{t("Values are grouped by currency. Completion forecasts and recorded cash flow use the same definitions on every screen.")}</p></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard label={t("Projects")} value={String(investments.length)} />
      <MetricCard label={t("With pending entries")} value={String(summaries.filter(s => !s.forecast.isRealised).length)} note={t("Includes projects with no revenue entries yet")} />
      <MetricCard label={t("Costs above plan")} value={String(summaries.filter(s => s.costSummary.variance > 0).length)} note={t("Comparison of the same recorded entries")} />
      <MetricCard label={t("Currencies")} value={String(groups.length)} note={t("Different currencies are never added together")} />
    </div>
    <div className="grid gap-4 lg:grid-cols-2">
      {groups.map(group => <div key={group.currency} className="analysis-panel p-5">
        <h2 className="font-semibold">{group.currency} · {group.count}{" "}{t("projects")}</h2>
        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div><dt className="text-muted-foreground">{t("Aggregate forecast profit")}</dt><dd className="mt-1 text-xl font-semibold">{formatCurrency(group.expectedProfit, group.currency)}</dd></div>
          <div><dt className="text-muted-foreground">{t("Aggregate return on costs")}</dt><dd className="mt-1 text-xl font-semibold">{formatPercentage(group.expectedROI)}</dd></div>
          <div><dt className="text-muted-foreground">{t("Estimated total cost")}</dt><dd className="mt-1">{formatCurrency(group.estimatedCost, group.currency)}</dd></div>
          <div><dt className="text-muted-foreground">{t("Recorded operating cash flow")}</dt><dd className="mt-1">{formatCurrency(group.cashResult, group.currency)}</dd></div>
        </dl>
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{t("ROI = sum of forecast profits ÷ sum of estimated costs. This is the return over complete cycles, which may have different durations; it is not a monthly or annual portfolio rate.")}</p>
      </div>)}
    </div>
    {summaries.some(s => !s.forecast.hasRevenuePlan) && <p className="text-sm text-amber-400">{t("Some projects have no revenue entries. Totals only include existing entries and may still be incomplete.")}</p>}
    <ProjectTable investments={investments} />
  </div>
}
