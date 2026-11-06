'use client'

import { useI18n } from '@/lib/i18n/client'

import { useState } from 'react'
import { saveAnalysisSettings } from '@/lib/actions'
import { calculateBenchmark, DEFAULT_DURATION_MONTHS, EXAMPLE_BENCHMARK_ANNUAL_PERCENT } from '@/lib/finance/benchmark'
import type { InvestmentWithDetails } from '@/lib/finance'
import { calculateForecast } from '@/lib/finance'
import { MetricCard } from './MetricCard'

export type AnalysisInputs = { durationMonths: number; benchmarkAnnualRatePercent: number }
export function initialAnalysisInputs(investment: InvestmentWithDetails): AnalysisInputs {
  return {
    durationMonths: investment.analysisSettings?.durationMonths ?? DEFAULT_DURATION_MONTHS,
    benchmarkAnnualRatePercent: investment.analysisSettings?.benchmarkAnnualRatePercent ?? EXAMPLE_BENCHMARK_ANNUAL_PERCENT,
  }
}


export function BenchmarkAnalysis({ investment, inputs, onChange, showMetrics = true }: {
  investment: InvestmentWithDetails; inputs: AnalysisInputs;
  onChange: (inputs: AnalysisInputs) => void; showMetrics?: boolean
}) {
  const { t, locale, formatCurrency, formatPercentage } = useI18n()
  const monthsText = (months: number) => t("{0} months", [months.toLocaleString(locale, { maximumFractionDigits: 1 })])
  const [duration, setDuration] = useState(String(inputs.durationMonths))
  const [rate, setRate] = useState(String(inputs.benchmarkAnnualRatePercent))
  const [saved, setSaved] = useState(investment.analysisSettings != null && investment.analysisSettings.durationMonths === inputs.durationMonths && investment.analysisSettings.benchmarkAnnualRatePercent === inputs.benchmarkAnnualRatePercent)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const forecast = calculateForecast(investment.revenues, investment.costs)
  const result = calculateBenchmark(forecast.estimatedCost, forecast.expectedRevenue, inputs.durationMonths, inputs.benchmarkAnnualRatePercent / 100)
  const valid = duration !== '' && rate !== '' && Number(duration) >= 0.5 && Number(duration) <= 120 && Number(rate) >= 0 && Number(rate) <= 100
  const ready = valid && forecast.estimatedCost > 0 && forecast.hasRevenuePlan
  const money = (value: number | null) => value === null ? '—' : formatCurrency(value, investment.currency)
  const outcome = result.excessProfit === null ? 'neutral' : result.excessProfit > 0 ? 'positive' : result.excessProfit < 0 ? 'negative' : 'neutral'

  function change(nextDuration: string, nextRate: string) {
    setSaved(false)
    setMessage('')
    if (nextDuration !== '' && nextRate !== '' && Number(nextDuration) >= 0.5 && Number(nextDuration) <= 120 && Number(nextRate) >= 0 && Number(nextRate) <= 100) {
      onChange({ durationMonths: Number(nextDuration), benchmarkAnnualRatePercent: Number(nextRate) })
    }
  }
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!valid) return
    setSaving(true)
    try {
      await saveAnalysisSettings(investment.id, new FormData(event.currentTarget))
      setSaved(true)
      setMessage("Assumptions saved for this project.")
    } catch {
      setMessage("Could not save. Please try again.")
    } finally { setSaving(false) }
  }

  return <section className="space-y-5" aria-labelledby="benchmark-title">
    <div className="analysis-panel p-5">
      <h2 id="benchmark-title" className="text-xl font-semibold">{t("Project × CDI: return and time")}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{t("Enter the full cycle duration, from the first payment until the sale proceeds are received. These assumptions also feed the risk simulation.")}</p>
      <form onSubmit={save} className="mt-4 flex flex-wrap items-end gap-4">
        <div className="space-y-2">
          <label htmlFor="analysis-duration" className="block text-sm">{t("Total project duration (months)")}</label>
          <input id="analysis-duration" name="durationMonths" type="number" required min="0.5" max="120" step="0.1" value={duration} onChange={e => { setDuration(e.target.value); change(e.target.value, rate) }} className="w-52 rounded-md border border-input bg-background px-3 py-2" />
        </div>
        <div className="space-y-2">
          <label htmlFor="analysis-rate" className="block text-sm">{t("Hypothetical annual CDI (% p.a.)")}</label>
          <input id="analysis-rate" name="benchmarkAnnualRatePercent" type="number" required min="0" max="100" step="0.01" value={rate} onChange={e => { setRate(e.target.value); change(duration, e.target.value) }} className="w-52 rounded-md border border-input bg-background px-3 py-2" />
        </div>
        <button disabled={saving || !valid} type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">{saving ? t("Saving…") : t("Save assumptions")}</button>
        <span role="status" className="text-sm text-muted-foreground">{(message ? t(message) : '') || (saved ? t("Assumptions saved") : investment.analysisSettings ? t("Changes not saved yet") : t("Example values: adjust and save"))}</span>
      </form>
      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{t("Simplified model: all estimated costs are available upfront and total revenue arrives at the end; the rate is constant, with no reinvestment in new projects. Gross CDI, before tax or fees; project taxes and expenses count only if entered as costs. This is neither historical CDI nor a dated cash-flow IRR.")}</p>
      {investment.currency !== 'BRL' && <p className="mt-2 text-xs text-amber-400">{t("Project currency:")}{" "}{investment.currency}{t(": use a benchmark in this currency. Direct comparison with Brazilian-real CDI ignores exchange-rate risk.")}</p>}
      {!valid && <p role="alert" className="mt-2 text-sm text-amber-400">{t("Enter a duration from 0.5 to 120 months and a rate from 0% to 100%.")}</p>}
    </div>

    {showMetrics && (ready ? <>
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-5" aria-live="polite">
        <h3 className="font-semibold">{t("How many months does CDI need to catch up with the project?")}</h3>
        <p className="mt-2 text-lg">
          {result.monthsToMatch === null
            ? result.profit < 0 ? t("The project forecasts a loss; a nonnegative CDI already has a higher return.") : t("At 0% CDI, there is no finite time to match a positive profit.")
            : <>{t("CDI needs")}{" "}<strong className="text-primary">{monthsText(result.monthsToMatch)}</strong>{" "}{t("to match an ROI of")}{" "}<strong>{formatPercentage(result.roiPercent)}</strong>{" "}{t("for this project.")}</>}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">{t("Selected cycle:")}{" "}{monthsText(inputs.durationMonths)}. {result.timeHeadroomMonths === null ? '' : result.timeHeadroomMonths >= 0
            ? t("{0} of headroom until that break-even point.", [monthsText(result.timeHeadroomMonths)])
            : t("The cycle exceeds the break-even time by {0}.", [monthsText(-result.timeHeadroomMonths)])}{" "}{t("Price and costs are held constant; extra costs from delays reduce this headroom.")}{" "}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label={t("Equivalent monthly ROI")} value={formatPercentage(result.monthlyROI)} note={t("Monthly CDI: {0}", [formatPercentage(result.monthlyBenchmarkPercent)])} help={t("Converts total ROI to the same time unit: (1 + ROI)^(1/months) − 1. It does not mean the project pays this income every month.")} />
        <MetricCard label={t("CDI over the same period")} value={money(result.benchmarkProfit)} note={t("{0} over {1}", [formatPercentage(result.benchmarkROIPercent), monthsText(inputs.durationMonths)])} help={t("Applies compound CDI to the estimated total cost. Compare equal periods; a total ROI of 20% cannot be directly compared with an annual rate.")} />
        <MetricCard label={t("Profit above CDI")} value={money(result.excessProfit)} tone={outcome} note={t("Project profit − CDI earnings")} help={t("Positive means an advantage in this model; negative means CDI earns more over this period. The advantage still needs to compensate for project risks and work.")} />
        <MetricCard label={t("Revenue needed to match CDI")} value={money(result.requiredRevenue)} note={result.revenueHeadroomPercent === null ? undefined : t("{0} headroom on forecast revenue", [formatPercentage(result.revenueHeadroomPercent)])} help={t("Estimated cost × (1 + annual CDI)^(months/12). The minimum total revenue needed to match the benchmark; negative headroom shows a shortfall, not an available discount.")} />
      </div>
      <details className="analysis-panel p-5">
        <summary className="cursor-pointer font-medium">{t("What if the sale takes longer? Compare durations")}</summary>
        <p className="mt-3 text-sm text-muted-foreground">{t("Revenue and costs stay at the current forecast. Add any extra property fees, maintenance and taxes to the entries.")}</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[540px] text-left text-sm">
            <thead className="border-b border-border text-muted-foreground"><tr><th className="p-3">{t("Total cycle")}</th><th className="p-3 text-right">{t("Project profit")}</th><th className="p-3 text-right">{t("CDI earnings")}</th><th className="p-3 text-right">{t("Project advantage")}</th></tr></thead>
            <tbody>{[...new Set([3, 6, 12, 18, 24, inputs.durationMonths])].sort((a,b) => a-b).map(months => {
              const row = calculateBenchmark(forecast.estimatedCost, forecast.expectedRevenue, months, inputs.benchmarkAnnualRatePercent / 100)
              return <tr key={months} className="border-b border-border/50"><td className="p-3">{monthsText(months)}{months === inputs.durationMonths ? t(" · selected") : ''}</td><td className="p-3 text-right">{money(row.profit)}</td><td className="p-3 text-right">{money(row.benchmarkProfit)}</td><td className={`p-3 text-right ${(row.excessProfit ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{money(row.excessProfit)}</td></tr>
            })}</tbody>
          </table>
        </div>
      </details>
    </> : <p className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">{t("To compare, enter a revenue forecast, a total cost above zero and valid assumptions.")}</p>)}
  </section>
}
