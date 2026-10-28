import { prisma } from '@/lib/db'
import {
  calculateTotalInvestedCapital,
  calculateProjectedRevenue,
  calculateActualRevenue,
  calculateProjectedProfit,
  calculateActualProfit,
  calculateProjectedROI,
  calculateActualROI
} from '@/lib/finance'
import { formatCurrency, formatPercentage } from '@/lib/utils/format'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { summarizeCosts, calculateForecast } from '@/lib/finance'

export default async function AnalyticsPage() {
  const investments = await prisma.investment.findMany({
    include: {
      costs: true,
      revenues: true,
      capitalContributions: true,
    }
  })

  const enrichedInvestments = investments.map(inv => {
    const capital = calculateTotalInvestedCapital(inv.initialInvestment, inv.capitalContributions)
    const projRev = calculateProjectedRevenue(inv.revenues)
    const actRev = calculateActualRevenue(inv.revenues)
    const projProfit = calculateProjectedProfit(inv.revenues, inv.costs)
    const actProfit = calculateActualProfit(inv.revenues, inv.costs)
    const projROI = calculateProjectedROI(inv.revenues, inv.costs)
    const actROI = calculateActualROI(inv.revenues, inv.costs)
    const profitVariance = actProfit - projProfit
    const costSummary = summarizeCosts(inv.costs)
    const forecast = calculateForecast(inv.revenues, inv.costs)

    return {
      ...inv,
      capital,
      projRev,
      actRev,
      projProfit,
      actProfit,
      projROI,
      actROI,
      profitVariance,
      costSummary,
      forecast
    }
  }).sort((a, b) => (b.forecast.expectedROI ?? -Infinity) - (a.forecast.expectedROI ?? -Infinity))
  const overPlan = enrichedInvestments.filter(inv => inv.costSummary.recordedCount > 0 && inv.costSummary.variance > 0).length
  const currencies = new Set(enrichedInvestments.map(inv => inv.currency)).size
  const pendingProjects = enrichedInvestments.filter(inv => inv.costSummary.pendingCount > 0).length

  // Totals per currency (never mixed across currencies)
  const totalsByCurrency = new Map<string, { capital: number; actRev: number; actCosts: number; actProfit: number; count: number }>()
  for (const inv of enrichedInvestments) {
    const t = totalsByCurrency.get(inv.currency) ?? { capital: 0, actRev: 0, actCosts: 0, actProfit: 0, count: 0 }
    t.capital += inv.capital
    t.actRev += inv.actRev
    t.actCosts += inv.costSummary.actual
    t.actProfit += inv.actProfit
    t.count += 1
    totalsByCurrency.set(inv.currency, t)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Portfolio Analytics</h1>
        <p className="text-muted-foreground">Compare each project&apos;s recorded results with its plan. Values stay in their original currencies.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="metric-panel"><p className="metric-label">Pending Costs</p><p className="metric-value text-amber-400">{pendingProjects}</p><p className="metric-note">Projects with unrecorded costs (profit variance hidden)</p></div>
        <div className="metric-panel"><p className="metric-label">Projects</p><p className="metric-value">{enrichedInvestments.length}</p><p className="metric-note">In this workspace</p></div>
        <div className="metric-panel"><p className="metric-label">Over Planned Costs</p><p className="metric-value text-rose-400">{overPlan}</p><p className="metric-note">Projects with positive cost variance</p></div>
        <div className="metric-panel"><p className="metric-label">Currencies</p><p className="metric-value">{currencies}</p><p className="metric-note">Monetary values are not combined across currencies</p></div>
      </div>

      <div className="rounded-xl border border-border overflow-x-auto bg-card">
        <table className="w-full min-w-[1900px] text-sm text-left whitespace-nowrap">
          <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
            <tr>
              <th className="sticky left-0 z-10 bg-muted px-4 py-3 font-medium">Investment</th>
              <th className="px-4 py-3 font-medium text-right">Capital</th>
              <th className="px-4 py-3 font-medium text-right">Proj. Revenue</th>
              <th className="px-4 py-3 font-medium text-right">Act. Revenue</th>
              <th className="px-4 py-3 font-medium text-right">Planned Costs</th>
              <th className="px-4 py-3 font-medium text-right">Actual Costs</th>
              <th className="px-4 py-3 font-medium text-right">Matched Cost Variance</th>
              <th className="px-4 py-3 font-medium text-right">Proj. Profit</th>
              <th className="px-4 py-3 font-medium text-right">Act. Profit</th>
              <th className="px-4 py-3 font-medium text-right">Profit Variance</th>
              <th className="px-4 py-3 font-medium text-right">Proj. ROI</th>
              <th className="px-4 py-3 font-medium text-right">Act. ROI</th>
              <th className="px-4 py-3 font-medium text-right">Expected Profit</th>
              <th className="px-4 py-3 font-medium text-right">Expected ROI</th>
              <th className="px-4 py-3 font-medium text-right">Break-even Rev.</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {enrichedInvestments.map((inv) => (
              <tr key={inv.id} className="hover:bg-muted/50 transition-colors">
                <td className="sticky left-0 z-10 bg-card px-4 py-3 font-medium"><Link href={`/investments/${inv.id}`} className="text-primary hover:underline">{inv.name}</Link></td>
                <td className="px-4 py-3 text-right">{formatCurrency(inv.capital, inv.currency)}</td>
                <td className="px-4 py-3 text-right text-muted-foreground">{formatCurrency(inv.projRev, inv.currency)}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(inv.actRev, inv.currency)}</td>
                <td className="px-4 py-3 text-right text-muted-foreground">{formatCurrency(inv.costSummary.totalPlanned, inv.currency)}</td>
                <td className="px-4 py-3 text-right">{inv.costSummary.recordedCount ? formatCurrency(inv.costSummary.actual, inv.currency) : 'None'}</td>
                <td className={cn('px-4 py-3 text-right font-medium', inv.costSummary.variance > 0 ? 'text-red-500' : inv.costSummary.variance < 0 ? 'text-emerald-500' : 'text-muted-foreground')}>
                  {inv.costSummary.recordedCount ? `${inv.costSummary.variance > 0 ? '+' : ''}${formatCurrency(inv.costSummary.variance, inv.currency)}` : 'None'}
                </td>
                <td className="px-4 py-3 text-right text-muted-foreground">{formatCurrency(inv.projProfit, inv.currency)}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(inv.actProfit, inv.currency)}</td>
                <td className={cn(
                  "px-4 py-3 text-right font-medium",
                  inv.profitVariance > 0 ? "text-emerald-600 dark:text-emerald-500" : 
                  inv.profitVariance < 0 ? "text-red-600 dark:text-red-500" : "text-muted-foreground"
                )}>
                  {inv.costSummary.pendingCount > 0 ? '—' : `${inv.profitVariance > 0 ? '+' : ''}${formatCurrency(inv.profitVariance, inv.currency)}`}
                </td>
                <td className="px-4 py-3 text-right text-muted-foreground">{inv.costSummary.projected > 0 ? formatPercentage(inv.projROI) : '—'}</td>
                <td className="px-4 py-3 text-right font-medium">{inv.costSummary.recordedCount > 0 ? formatPercentage(inv.actROI) : '—'}</td>
                <td className={cn('px-4 py-3 text-right font-medium', inv.forecast.expectedProfit >= 0 ? 'text-emerald-500' : 'text-red-500')}>{formatCurrency(inv.forecast.expectedProfit, inv.currency)}</td>
                <td className="px-4 py-3 text-right font-medium">{inv.forecast.expectedROI === null ? '—' : formatPercentage(inv.forecast.expectedROI)}</td>
                <td className="px-4 py-3 text-right text-muted-foreground">{formatCurrency(inv.forecast.estimatedCost, inv.currency)}</td>
              </tr>
            ))}
            
            {enrichedInvestments.length === 0 && (
              <tr>
                <td colSpan={15} className="px-4 py-8 text-center text-muted-foreground">
                  No investments found for analysis.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalsByCurrency.size > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...totalsByCurrency.entries()].map(([currency, t]) => (
            <div key={currency} className="metric-panel">
              <p className="metric-label">Totals · {currency} ({t.count} {t.count === 1 ? 'project' : 'projects'})</p>
              <p className={cn('metric-value', t.actProfit < 0 ? 'text-rose-400' : 'text-emerald-400')}>{formatCurrency(t.actProfit, currency)}</p>
              <p className="metric-note">
                Capital {formatCurrency(t.capital, currency)} · Revenue {formatCurrency(t.actRev, currency)} · Costs {formatCurrency(t.actCosts, currency)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
