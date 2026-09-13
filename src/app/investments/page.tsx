import { prisma } from '@/lib/db'
import Link from 'next/link'
import { formatCurrency, formatPercentage, formatDate } from '@/lib/utils/format'
import {
  calculateTotalInvestedCapital,
  calculateProjectedRevenue,
  calculateActualRevenue,
  calculateProjectedProfit,
  calculateActualProfit,
  calculateProjectedROI,
  calculateActualROI
} from '@/lib/finance'

export default async function InvestmentsPage() {
  const investments = await prisma.investment.findMany({
    include: {
      costs: true,
      revenues: true,
      capitalContributions: true,
    },
    orderBy: { startDate: 'desc' }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Investments</h1>
          <p className="text-muted-foreground">Manage and track your individual investments.</p>
        </div>
        <Link
          href="/investments/new"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
        >
          New Investment
        </Link>
      </div>

      {investments.length === 0 ? (
        <div className="rounded-md border p-8 text-center">
          <p className="text-muted-foreground">No investments found.</p>
        </div>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Capital Invested</th>
                <th className="px-4 py-3 font-medium text-right">Proj. Rev</th>
                <th className="px-4 py-3 font-medium text-right">Act. Rev</th>
                <th className="px-4 py-3 font-medium text-right">Proj. Profit</th>
                <th className="px-4 py-3 font-medium text-right">Act. Profit</th>
                <th className="px-4 py-3 font-medium text-right">Proj. ROI</th>
                <th className="px-4 py-3 font-medium text-right">Act. ROI</th>
                <th className="px-4 py-3 font-medium">Start Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {investments.map((inv) => {
                const capital = calculateTotalInvestedCapital(inv.initialInvestment, inv.capitalContributions)
                const projRev = calculateProjectedRevenue(inv.revenues)
                const actRev = calculateActualRevenue(inv.revenues)
                const projProfit = calculateProjectedProfit(inv.revenues, inv.costs)
                const actProfit = calculateActualProfit(inv.revenues, inv.costs)
                const projROI = calculateProjectedROI(inv.revenues, inv.costs)
                const actROI = calculateActualROI(inv.revenues, inv.costs)

                return (
                  <tr key={inv.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 font-medium">
                      <Link href={`/investments/${inv.id}`} className="hover:underline text-primary">
                        {inv.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 capitalize">{inv.category.toLowerCase().replace('_', ' ')}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary text-secondary-foreground">
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">{formatCurrency(capital, inv.currency)}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{formatCurrency(projRev, inv.currency)}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(actRev, inv.currency)}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{formatCurrency(projProfit, inv.currency)}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(actProfit, inv.currency)}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{formatPercentage(projROI)}</td>
                    <td className="px-4 py-3 text-right">{formatPercentage(actROI)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatDate(inv.startDate)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
