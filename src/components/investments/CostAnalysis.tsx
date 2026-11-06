'use client'

import { useI18n } from '@/lib/i18n/client'

import type { Cost } from '@prisma/client'
import { isRecordedCost, summarizeCosts, type CostBreakdown } from '@/lib/finance'
import { cn } from '@/lib/utils'

function Variance({ item, currency }: { item: CostBreakdown; currency: string }) {
  const { t, formatCurrency } = useI18n()
  if (item.actual === 0 && item.projected === 0) return <span className="text-muted-foreground">{t("None")}</span>
  return (
    <span className={cn('font-semibold tabular-nums', item.variance > 0 ? 'text-rose-400' : item.variance < 0 ? 'text-emerald-400' : 'text-muted-foreground')}>
      {item.variance > 0 ? '+' : ''}{formatCurrency(item.variance, currency)}
    </span>
  )
}

function ComparisonBars({ item, scale }: { item: CostBreakdown; scale: number }) {
  const { t } = useI18n()
  const width = (value: number) => `${Math.max(value > 0 ? 2 : 0, (value / scale) * 100)}%`
  return (
    <div className="space-y-1.5" aria-label={t("Planned {0}; actual {1}", [item.projected, item.actual])}>
      <div className="h-2.5 rounded-full bg-muted"><div className="h-full rounded-full bg-sky-400" style={{ width: width(item.projected) }} /></div>
      <div className="h-2.5 rounded-full bg-muted"><div className="h-full rounded-full bg-amber-400" style={{ width: width(item.actual) }} /></div>
    </div>
  )
}

export function CostAnalysis({ costs, currency }: { costs: Cost[]; currency: string }) {
  const { t, formatCurrency, formatPercentage, formatDate } = useI18n()
  const summary = summarizeCosts(costs)
  const pending = costs.filter(cost => !isRecordedCost(cost))
  const scale = Math.max(1, ...summary.categories.flatMap(item => [item.projected, item.actual]))
  const monthlyScale = Math.max(1, ...summary.months.flatMap(item => [item.projected, item.actual]))
  const varianceText = summary.recordedCount === 0
    ? t("Waiting for recorded costs")
    : summary.variancePercentage === null
      ? t("No planned baseline for recorded costs")
      : t("{0}{1} vs matched plan", [summary.variancePercentage > 0 ? '+' : '', formatPercentage(summary.variancePercentage)])
  const largestOverrun = [...summary.categories].sort((a, b) => b.variance - a.variance)[0]
  const total = { label: t("Total"), projected: summary.projected, actual: summary.actual, variance: summary.variance }

  return (
    <section className="space-y-6" aria-labelledby="cost-analysis-title">
      <div>
        <h2 id="cost-analysis-title" className="text-xl font-semibold">{t("Planned vs Actual Costs")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("Zero or blank means pending unless “Settled at zero” is checked. Pending costs remain in the plan and are excluded from actuals comparisons.")}</p>
        <p className="mt-1 text-xs text-muted-foreground">{t("Positive variance means recorded spending exceeded the plan for those same recorded entries.")}</p>
      </div>
      {costs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">{t("No costs yet. Add fixed or variable costs in the Entries tab to see the comparison.")}</div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <div className="metric-panel"><p className="metric-label">{t("Total Planned")}</p><p className="metric-value">{formatCurrency(summary.totalPlanned, currency)}</p><p className="metric-note">{t("All")}{" "}{costs.length}{" "}{t("cost entries")}</p></div>
            <div className="metric-panel"><p className="metric-label">{t("Matched Plan")}</p><p className="metric-value">{summary.recordedCount ? formatCurrency(summary.projected, currency) : t("None")}</p><p className="metric-note">{t("Plan for")}{" "}{summary.recordedCount}{" "}{t("recorded entries")}</p></div>
            <div className="metric-panel"><p className="metric-label">{t("Actual Costs")}</p><p className="metric-value">{summary.recordedCount ? formatCurrency(summary.actual, currency) : t("None")}</p><p className="metric-note">{t("Recorded spending only")}</p></div>
            <div className="metric-panel"><p className="metric-label">{t("Cost Variance")}</p><p className="metric-value">{summary.recordedCount ? <Variance item={total} currency={currency} /> : t("None")}</p><p className="metric-note">{varianceText}</p></div>
            <div className="metric-panel"><p className="metric-label">{t("Pending Costs")}</p><p className="metric-value">{summary.pendingCount}</p><p className="metric-note">{formatCurrency(summary.pendingPlanned, currency)}{" "}{t("planned")}</p></div>
          </div>

          {summary.recordedCount > 0 ? (
            <>
              <div className="grid gap-6 2xl:grid-cols-2">
                <div className="analysis-panel">
                  <div className="analysis-heading"><div><h3 className="font-semibold">{t("Cost Mix")}</h3><p className="text-sm text-muted-foreground">{t("Recorded entries only")}</p></div></div>
                  <div className="space-y-4 p-5">
                    {[summary.fixed, summary.variable].map(item => (
                      <div key={item.label} className="rounded-lg border border-border bg-muted/20 p-4">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h4 className="font-medium">{t(item.label)}</h4><Variance item={item} currency={currency} /></div>
                        <ComparisonBars item={item} scale={Math.max(1, summary.projected, summary.actual)} />
                        <div className="mt-2 flex justify-between gap-3 text-xs text-muted-foreground"><span>{t("Matched plan")}{" "}{formatCurrency(item.projected, currency)}</span><span>{t("Actual")}{" "}{formatCurrency(item.actual, currency)}</span></div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="analysis-panel">
                  <div className="analysis-heading"><div><h3 className="font-semibold">{t("Monthly Trend")}</h3><p className="text-sm text-muted-foreground">{t("Recorded entries by entered date")}</p></div><div className="flex gap-3 text-xs text-muted-foreground"><span><i className="legend-dot bg-sky-400" />{t("Matched plan")}</span><span><i className="legend-dot bg-amber-400" />{t("Actual")}</span></div></div>
                  <div className="max-h-80 space-y-4 overflow-y-auto p-5">
                    {summary.months.map(item => (
                      <div key={item.label} className="grid grid-cols-[5.5rem_minmax(0,1fr)_auto] items-center gap-3 text-sm">
                        <span className="font-medium tabular-nums">{item.label}</span><ComparisonBars item={item} scale={monthlyScale} /><Variance item={item} currency={currency} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="analysis-panel overflow-hidden">
                <div className="analysis-heading"><div><h3 className="font-semibold">{t("By Category")}</h3><p className="text-sm text-muted-foreground">{t("Recorded entries, sorted by actual cost")}</p></div><div className="flex gap-3 text-xs text-muted-foreground"><span><i className="legend-dot bg-sky-400" />{t("Matched plan")}</span><span><i className="legend-dot bg-amber-400" />{t("Actual")}</span></div></div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[680px] text-left text-sm">
                    <thead className="border-b border-border bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground"><tr><th scope="col" className="px-5 py-3">{t("Category")}</th><th scope="col" className="px-5 py-3">{t("Comparison")}</th><th scope="col" className="px-5 py-3 text-right">{t("Matched Plan")}</th><th scope="col" className="px-5 py-3 text-right">{t("Actual")}</th><th scope="col" className="px-5 py-3 text-right">{t("Variance")}</th></tr></thead>
                    <tbody className="divide-y divide-border">
                      {summary.categories.map(item => <tr key={item.label} className="hover:bg-muted/20"><th scope="row" className="px-5 py-4 font-medium">{item.label}</th><td className="min-w-32 px-5 py-4"><ComparisonBars item={item} scale={scale} /></td><td className="px-5 py-4 text-right tabular-nums text-muted-foreground">{formatCurrency(item.projected, currency)}</td><td className="px-5 py-4 text-right tabular-nums">{formatCurrency(item.actual, currency)}</td><td className="px-5 py-4 text-right"><Variance item={item} currency={currency} /></td></tr>)}
                    </tbody>
                    <tfoot className="border-t border-border bg-muted/30 font-semibold"><tr><th scope="row" className="px-5 py-4">{t("Total")}</th><td className="px-5 py-4" /><td className="px-5 py-4 text-right tabular-nums">{formatCurrency(summary.projected, currency)}</td><td className="px-5 py-4 text-right tabular-nums">{formatCurrency(summary.actual, currency)}</td><td className="px-5 py-4 text-right"><Variance item={total} currency={currency} /></td></tr></tfoot>
                  </table>
                </div>
              </div>
              <div className="metric-panel"><p className="metric-label">{t("Largest Category Overrun")}</p><p className="metric-value text-xl">{largestOverrun && largestOverrun.variance > 0 ? largestOverrun.label : t("None")}</p><p className="metric-note">{largestOverrun && largestOverrun.variance > 0 ? formatCurrency(largestOverrun.variance, currency) : t("No recorded category above its matched plan")}</p></div>
            </>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-muted-foreground">{t("No actual costs have been recorded yet. Enter an actual amount in the Entries tab to start the comparison.")}</div>
          )}

          {pending.length > 0 && (
            <div className="analysis-panel overflow-hidden">
              <div className="analysis-heading"><div><h3 className="font-semibold">{t("Pending Costs")}</h3><p className="text-sm text-muted-foreground">{t("Actual amount is None; excluded from recorded calculations")}</p></div></div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-left text-sm">
                  <thead className="border-b border-border bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground"><tr><th scope="col" className="px-5 py-3">{t("Cost")}</th><th scope="col" className="px-5 py-3">{t("Category")}</th><th scope="col" className="px-5 py-3">{t("Date")}</th><th scope="col" className="px-5 py-3 text-right">{t("Planned")}</th><th scope="col" className="px-5 py-3 text-right">{t("Actual")}</th></tr></thead>
                  <tbody className="divide-y divide-border">{pending.map(cost => <tr key={cost.id}><th scope="row" className="px-5 py-3 font-medium">{cost.name}</th><td className="px-5 py-3 text-muted-foreground">{cost.category}</td><td className="px-5 py-3 text-muted-foreground">{formatDate(cost.date)}</td><td className="px-5 py-3 text-right tabular-nums">{formatCurrency(cost.projectedAmount, currency)}</td><td className="px-5 py-3 text-right text-muted-foreground">{t("None")}</td></tr>)}</tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  )
}
