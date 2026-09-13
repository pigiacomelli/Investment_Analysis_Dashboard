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

    return {
      ...inv,
      capital,
      projRev,
      actRev,
      projProfit,
      actProfit,
      projROI,
      actROI,
      profitVariance
    }
  }).sort((a, b) => b.actROI - a.actROI)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Portfolio Analytics</h1>
        <p className="text-muted-foreground">Deep dive into performance metrics and variance analysis.</p>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
            <tr>
              <th className="px-4 py-3 font-medium">Investment</th>
              <th className="px-4 py-3 font-medium text-right">Capital</th>
              <th className="px-4 py-3 font-medium text-right">Proj. Revenue</th>
              <th className="px-4 py-3 font-medium text-right">Act. Revenue</th>
              <th className="px-4 py-3 font-medium text-right">Proj. Profit</th>
              <th className="px-4 py-3 font-medium text-right">Act. Profit</th>
              <th className="px-4 py-3 font-medium text-right">Profit Variance</th>
              <th className="px-4 py-3 font-medium text-right">Proj. ROI</th>
              <th className="px-4 py-3 font-medium text-right">Act. ROI</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {enrichedInvestments.map((inv) => (
              <tr key={inv.id} className="hover:bg-muted/50 transition-colors">
                <td className="px-4 py-3 font-medium">{inv.name}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(inv.capital, inv.currency)}</td>
                <td className="px-4 py-3 text-right text-muted-foreground">{formatCurrency(inv.projRev, inv.currency)}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(inv.actRev, inv.currency)}</td>
                <td className="px-4 py-3 text-right text-muted-foreground">{formatCurrency(inv.projProfit, inv.currency)}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(inv.actProfit, inv.currency)}</td>
                <td className={cn(
                  "px-4 py-3 text-right font-medium",
                  inv.profitVariance > 0 ? "text-emerald-600 dark:text-emerald-500" : 
                  inv.profitVariance < 0 ? "text-red-600 dark:text-red-500" : "text-muted-foreground"
                )}>
                  {inv.profitVariance > 0 ? '+' : ''}{formatCurrency(inv.profitVariance, inv.currency)}
                </td>
                <td className="px-4 py-3 text-right text-muted-foreground">{formatPercentage(inv.projROI)}</td>
                <td className="px-4 py-3 text-right font-medium">{formatPercentage(inv.actROI)}</td>
              </tr>
            ))}
            
            {enrichedInvestments.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                  No investments found for analysis.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
