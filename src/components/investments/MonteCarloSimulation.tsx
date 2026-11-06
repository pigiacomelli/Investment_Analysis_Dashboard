'use client'

import { useI18n } from '@/lib/i18n/client'

import { useMemo, useState, useSyncExternalStore } from 'react'
import { type InvestmentWithDetails, calculateForecast } from '@/lib/finance'
import { runMonteCarloSimulation, type HistogramBin } from '@/lib/finance/monteCarlo'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts'
import { MetricCard } from './MetricCard'

const subscribe = () => () => undefined
const clientSnapshot = () => true
const serverSnapshot = () => false

function RiskSlider({ label, value, onChange, help }: { label: string; value: number; onChange: (value: number) => void; help: string }) {
  const { t, formatPercentage } = useI18n()
  return <div className="space-y-2">
    <label className="block text-sm">
      <span className="flex justify-between gap-2"><span>{label}</span><strong className="text-primary">{formatPercentage(value * 100)}</strong></span>
      <input type="range" min="0" max="0.5" step="0.05" value={value} onChange={event => onChange(Number(event.target.value))} className="mt-2 w-full accent-primary" />
    </label>
    <details className="text-xs text-muted-foreground"><summary className="cursor-pointer text-primary">{t("How to adjust")}</summary><p className="mt-2 leading-relaxed">{help}</p></details>
  </div>
}

export function MonteCarloSimulation({ investment, durationMonths, benchmarkAnnualRatePercent }: {
  investment: InvestmentWithDetails; durationMonths: number; benchmarkAnnualRatePercent: number
}) {
  const { t, locale, formatCurrency, formatPercentage } = useI18n()
  const mounted = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot)
  const [revenueRisk, setRevenueRisk] = useState(0.2)
  const [variableRisk, setVariableRisk] = useState(0.2)
  const [fixedRisk, setFixedRisk] = useState(0)
  const [timeRisk, setTimeRisk] = useState(0.25)
  const [capInput, setCapInput] = useState('')
  const forecast = calculateForecast(investment.revenues, investment.costs)
  const cap = capInput === '' ? undefined : Number(capInput)
  const invalidCap = cap !== undefined && (!Number.isFinite(cap) || cap < 0 || cap < forecast.revenueReceived)
  const ready = forecast.estimatedCost > 0 && forecast.hasRevenuePlan && !invalidCap
  const simulation = useMemo(() => {
    const base = calculateForecast(investment.revenues, investment.costs)
    if (!mounted || base.estimatedCost <= 0 || !base.hasRevenuePlan || (cap !== undefined && (!Number.isFinite(cap) || cap < 0 || cap < base.revenueReceived))) return null
    return runMonteCarloSimulation(investment, {
    revenueVolatility: revenueRisk, variableCostVolatility: variableRisk, fixedCostVolatility: fixedRisk,
    holdingPeriodVolatility: timeRisk, expectedMonthsToSell: durationMonths,
    cdiAnnualRate: benchmarkAnnualRatePercent / 100, maxRevenue: cap, iterations: 10_000,
    })
  }, [mounted, investment, revenueRisk, variableRisk, fixedRisk, timeRisk, durationMonths, benchmarkAnnualRatePercent, cap])
  const money = (value: number | null) => value === null ? '—' : formatCurrency(value, investment.currency)

  return <section className="space-y-5" aria-labelledby="risk-title">
    <div className="analysis-panel p-5">
      <h2 id="risk-title" className="text-xl font-semibold">{t("Risk simulation · 10,000 scenarios")}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("Only pending revenues and costs vary; settled values remain fixed. Duration is also fixed when every entry is settled. Independent normal distributions are floored at zero, with an optional revenue ceiling. Probabilities depend on these assumptions and are not a validated statistical market forecast.")}</p>
      <p className="mt-2 text-sm text-muted-foreground">{t("Total duration:")}{" "}{durationMonths}{" "}{t("months · hypothetical CDI:")}{" "}{formatPercentage(benchmarkAnnualRatePercent)}{" "}{t("p.a. Adjust and save the assumptions above.")}</p>
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <RiskSlider label={t("Pending revenue uncertainty")} value={revenueRisk} onChange={setRevenueRisk} help={t("20% is the standard deviation of outstanding revenue, not the chance of losing money. Before applying limits, about 68% of draws fall within one standard deviation of the mean.")} />
        <RiskSlider label={t("Pending variable cost uncertainty")} value={variableRisk} onChange={setVariableRisk} help={t("Only the sum of unsettled variable costs varies. A recorded cost stays fixed, even when the slider is above zero.")} />
        <RiskSlider label={t("Pending fixed cost uncertainty")} value={fixedRisk} onChange={setFixedRisk} help={t("Use this for possible changes in unsettled fixed expenses. Recorded recurrence does not generate extra payments.")} />
        <RiskSlider label={t("Total duration uncertainty")} value={timeRisk} onChange={setTimeRisk} help={t("Varies the total time until sale proceeds arrive, with a half-month minimum. A delay increases the benchmark but does not automatically add maintenance costs.")} />
      </div>
      <div className="mt-5 space-y-2">
        <label htmlFor="max-revenue-input" className="block text-sm">{t("Total revenue ceiling (optional)")}</label>
        <input id="max-revenue-input" type="number" min={forecast.revenueReceived} step="0.01" placeholder={t("No ceiling")} value={capInput} onChange={e => setCapInput(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 sm:max-w-sm" />
        <p className="text-xs text-muted-foreground">{t("The ceiling caps revenue in every scenario and the zero-uncertainty baseline. It can never reduce revenue already received.")}</p>
        {invalidCap && <p role="alert" className="text-sm text-rose-400">{t("The ceiling must be nonnegative and at least")}{" "}{money(forecast.revenueReceived)}{t(", already received.")}</p>}
      </div>
    </div>

    {!ready && <p className="rounded-xl border border-dashed border-border p-5 text-muted-foreground">{t("Enter positive costs and a revenue forecast. Correct the ceiling if one is provided.")}</p>}
    {ready && !simulation && <p className="p-5 text-muted-foreground">{t("Preparing scenarios…")}</p>}
    {simulation && <>
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: t("P10 · lower outcome"), profit: simulation.p10, roi: simulation.roiP10, note: t("10% of simulated profits are at or below this value.") },
          { label: t("P50 · median"), profit: simulation.p50, roi: simulation.roiP50, note: t("Half of simulated profits are below, half above.") },
          { label: t("P90 · upper outcome"), profit: simulation.p90, roi: simulation.roiP90, note: t("10% of simulated profits reach or exceed this value.") },
        ].map(row => <MetricCard key={row.label} label={row.label} value={money(row.profit)} note={t("{0} ROI percentile: {1}", [row.note, formatPercentage(row.roi)])} help={t("Profit and ROI are sorted separately. Their percentiles may come from different scenarios; ties are possible with limits or no uncertainty.")} />)}
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label={t("Mean simulated profit")} value={money(simulation.meanProfit)} note={t("Return on mean costs: {0}", [formatPercentage(simulation.meanROI)])} help={t("Mean profit divided by mean scenario costs. This is not a simple average of ROIs or a guaranteed return.")} />
        <MetricCard label={t("Model probability of profit")} value={formatPercentage(simulation.probabilityOfProfit)} note={t("Loss: {0} · break-even: {1}", [formatPercentage(simulation.probabilityOfLoss), formatPercentage(simulation.probabilityOfBreakEven)])} help={t("Profit and loss use a half-cent tolerance. Break-even is not counted as a loss. Percentages depend on the chosen distribution and risks.")} />
        <MetricCard label={t("Probability of beating CDI")} value={formatPercentage(simulation.probabilityOfBeatingCDI)} note={t("Hypothetical CDI: {0} p.a.", [formatPercentage(benchmarkAnnualRatePercent)])} help={t("Each scenario compares profit with CDI on that scenario's cost over its own duration. All costs are treated as capital available at the start.")} />
        <MetricCard label={t("Mean advantage over CDI")} value={money(simulation.meanExcessProfitOverCDI)} note={t("Mean excess across scenarios")} help={t("Includes the cost and duration drawn for each scenario. Due to compounding, it may differ from mean profit minus CDI over the mean duration.")} />
        <MetricCard label={t("CDI catches up with representative ROI")} value={simulation.maxMonthsToBeatCDI === null ? t("No finite time") : t("{0} months", [simulation.maxMonthsToBeatCDI.toLocaleString(locale, { maximumFractionDigits: 1 })])} note={t("Slow duration P90: {0} months", [simulation.p90MonthsToSell.toLocaleString(locale, { maximumFractionDigits: 1 })])} help={t("Uses mean profit over mean costs. This is a reference, not a safe deadline: actual profit and duration may vary together. A loss has no positive catch-up time with nonnegative CDI.")} />
        <MetricCard label={t("5th-percentile profit")} value={money(simulation.profitP05)} note={t("Mean of worst 5%: {0}", [money(simulation.meanWorst5Profit)])} help={t("A profit value that can be positive or negative. This avoids labelling positive profit as a VaR loss. The worst-scenario mean shows the severity of the simulated tail.")} />
        <MetricCard label={t("Profit dispersion")} value={money(simulation.profitStdDev)} note={t("Standard deviation of scenarios")} help={t("Shows dispersion in money. Profit is not guaranteed to remain normally distributed after floors and the revenue ceiling.")} />
        <MetricCard label={t("Mean excess / dispersion")} value={simulation.excessToRiskRatio === null ? '—' : simulation.excessToRiskRatio.toLocaleString(locale, { maximumFractionDigits: 2 })} note={t("Descriptive scenario ratio")} help={t("Mean excess over CDI divided by its standard deviation. This is neither historical Sharpe nor a probability; unavailable without dispersion.")} />
      </div>
      <div className="analysis-panel p-5">
        <h3 className="font-semibold">{t("Distribution of simulated profits")}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{t("Zero-uncertainty baseline:")}{" "}{money(simulation.baseProfit)} · ROI: {formatPercentage(simulation.baseROI)}{t(". Profit is blue and loss is red.")}</p>
        <div className="mt-4 h-80 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={simulation.histogram} margin={{ top: 12, right: 12, left: 10, bottom: 24 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
              <XAxis dataKey="binMidpoint" type="number" domain={['dataMin', 'dataMax']} tickFormatter={value => money(Number(value))} tick={{ fontSize: 10 }} />
              <YAxis hide />
              <Tooltip formatter={value => [Number(value).toLocaleString(locale), t("Scenarios")]} labelFormatter={(_label, payload) => { const bin = payload?.[0]?.payload as HistogramBin | undefined; return bin ? t("{0} to {1}", [money(bin.binStart), money(bin.binEnd)]) : '' }} contentStyle={{ backgroundColor: '#111113', borderColor: '#27272a', borderRadius: 8 }} />
              <Bar dataKey="count" radius={[4,4,0,0]}>{simulation.histogram.map(bin => <Cell key={bin.binStart} fill={bin.binMidpoint < 0 ? '#ef4444' : '#3b82f6'} />)}</Bar>
              {simulation.minProfit <= 0 && simulation.maxProfit >= 0 && <ReferenceLine x={0} stroke="#ef4444" strokeDasharray="3 3" />}
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{t("Equal inputs produce equal scenarios. The chart has no single CDI line because the benchmark varies with each scenario's cost and duration.")}</p>
      </div>
    </>}
  </section>
}
