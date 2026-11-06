import { getI18n } from '@/lib/i18n/server'
import Link from 'next/link'
import { type InvestmentWithDetails, summarizeProject } from '@/lib/finance'
import { calculateBenchmark } from '@/lib/finance/benchmark'
import { DeleteProjectButton } from './DeleteProjectButton'

export async function ProjectTable({ investments, allowDelete = false }: { investments: InvestmentWithDetails[]; allowDelete?: boolean }) {
  const { t, locale, formatCurrency, formatPercentage } = await getI18n()
  return <div className="overflow-x-auto rounded-xl border border-border bg-card">
    <table className="w-full min-w-[1450px] text-left text-sm">
      <thead className="border-b border-border bg-muted/50 text-xs uppercase text-muted-foreground">
        <tr>{[t("Project"), t("Forecast profit"), t("Return on costs"), t("Forecast margin"), t("Estimated total cost"), t("Operating cash flow"), t("Final profit"), t("Total cycle"), t("Profit above benchmark"), t("Months for benchmark to catch up")].map((label, i) => <th key={label} className={`px-4 py-3 font-medium ${i > 0 ? 'text-right' : ''}`}>{label}</th>)}</tr>
      </thead>
      <tbody className="divide-y divide-border">
        {investments.map(inv => {
          const summary = summarizeProject(inv)
          const { forecast } = summary
          const settings = inv.analysisSettings
          const benchmark = settings && forecast.estimatedCost > 0 && forecast.hasRevenuePlan
            ? calculateBenchmark(forecast.estimatedCost, forecast.expectedRevenue, settings.durationMonths, settings.benchmarkAnnualRatePercent / 100) : null
          const money = (value: number | null) => value === null ? '—' : formatCurrency(value, inv.currency)
          return <tr key={inv.id} className="hover:bg-muted/30">
            <th scope="row" className="max-w-64 px-4 py-4 text-left font-medium">
              <Link href={`/investments/${inv.id}`} className="text-primary hover:underline">{inv.name}</Link>
              <p className="mt-1 text-xs text-muted-foreground">{inv.currency} · {t(inv.status)} · {forecast.isRealised ? t("Settled") : t("In progress")}</p>
              {!forecast.hasRevenuePlan && <p className="mt-1 text-xs text-amber-400">{t("No revenue entries")}</p>}
              {allowDelete && <div className="mt-2"><DeleteProjectButton id={inv.id} name={inv.name} /></div>}
            </th>
            <td className="px-4 py-4 text-right tabular-nums">{money(forecast.expectedProfit)}</td>
            <td className="px-4 py-4 text-right tabular-nums">{formatPercentage(forecast.expectedROI)}</td>
            <td className="px-4 py-4 text-right tabular-nums">{formatPercentage(summary.expectedMargin)}</td>
            <td className="px-4 py-4 text-right tabular-nums">{money(forecast.estimatedCost)}</td>
            <td className="px-4 py-4 text-right tabular-nums">{money(summary.recordedCashResult)}</td>
            <td className="px-4 py-4 text-right tabular-nums">{summary.finalProfit === null ? t("Pending") : money(summary.finalProfit)}</td>
            <td className="px-4 py-4 text-right tabular-nums">{settings ? t("{0} months", [settings.durationMonths.toLocaleString(locale)]) : t("Set assumptions")}</td>
            <td className="px-4 py-4 text-right tabular-nums">{money(benchmark?.excessProfit ?? null)}{settings && <p className="mt-1 text-xs text-muted-foreground">{t("Rate:")}{" "}{formatPercentage(settings.benchmarkAnnualRatePercent)} {t("p.a.")}{inv.currency === 'BRL' ? t(" · hypothetical CDI") : t(" · currency benchmark")}</p>}</td>
            <td className="px-4 py-4 text-right tabular-nums">{benchmark?.monthsToMatch == null ? '—' : t("{0} months", [benchmark.monthsToMatch.toLocaleString(locale, { maximumFractionDigits: 1 })])}</td>
          </tr>
        })}
        {investments.length === 0 && <tr><td colSpan={10} className="p-10 text-center text-muted-foreground">{t("No projects registered.")}</td></tr>}
      </tbody>
    </table>
  </div>
}
