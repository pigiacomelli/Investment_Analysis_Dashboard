'use client'

import { useMemo, useState, useSyncExternalStore } from 'react'
import { InvestmentWithDetails, calculateProjectedRevenue } from '@/lib/finance'
import { HistogramBin, runMonteCarloSimulation } from '@/lib/finance/monteCarlo'
import { formatCurrency, formatPercentage } from '@/lib/utils/format'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts'
import { AlertTriangle, CircleDollarSign, Gauge, Settings2, TrendingDown, TrendingUp } from 'lucide-react'

const subscribeToClient = () => () => undefined
const getClientSnapshot = () => true
const getServerSnapshot = () => false

interface RiskSliderProps {
  label: string
  value: number
  onChange: (value: number) => void
}

function RiskSlider({ label, value, onChange }: RiskSliderProps) {
  return (
    <label className="space-y-2">
      <span className="flex justify-between text-sm font-medium">
        {label}
        <span className="font-bold text-primary">{formatPercentage(value * 100)}</span>
      </span>
      <input
        type="range"
        min="0"
        max="0.5"
        step="0.05"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-primary"
      />
    </label>
  )
}

interface StatisticCardProps {
  label: string
  value: string
  detail: string
  tone?: 'positive' | 'negative' | 'neutral'
}

function StatisticCard({ label, value, detail, tone = 'neutral' }: StatisticCardProps) {
  const toneClass = tone === 'positive'
    ? 'text-emerald-500'
    : tone === 'negative'
      ? 'text-red-500'
      : 'text-foreground'

  return (
    <div className="rounded-lg border border-border bg-muted/20 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-1 text-xl font-bold ${toneClass}`}>{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  )
}

export function MonteCarloSimulation({ investment }: { investment: InvestmentWithDetails }) {
  const isMounted = useSyncExternalStore(subscribeToClient, getClientSnapshot, getServerSnapshot)
  const [revenueVolatility, setRevenueVolatility] = useState(0.2)
  const [variableCostVolatility, setVariableCostVolatility] = useState(0.2)
  const [fixedCostVolatility, setFixedCostVolatility] = useState(0)

  const baseRevenue = useMemo(() => calculateProjectedRevenue(investment.revenues), [investment.revenues])
  const [maxRevenue, setMaxRevenue] = useState<number | undefined>(undefined)
  // Track the raw string so the input stays editable even mid-typing
  const [maxRevenueInput, setMaxRevenueInput] = useState('')

  const simulation = useMemo(() => {
    if (!isMounted) return null
    return runMonteCarloSimulation(investment, {
      revenueVolatility,
      variableCostVolatility,
      fixedCostVolatility,
      maxRevenue: maxRevenue !== undefined && maxRevenue > 0 ? maxRevenue : undefined,
      iterations: 10_000,
    })
  }, [fixedCostVolatility, investment, isMounted, maxRevenue, revenueVolatility, variableCostVolatility])

  if (!simulation) {
    return <div className="mt-8 h-96 animate-pulse rounded-xl border border-border bg-muted/20 shadow-sm" />
  }

  const {
    p10,
    p50,
    p90,
    roiP10,
    roiP50,
    roiP90,
    baseProfit,
    baseROI,
    meanProfit,
    meanROI,
    profitStdDev,
    probabilityOfProfit,
    probabilityOfLoss,
    breakEvenRevenue,
    minProfit,
    maxProfit,
    histogram,
    iterations,
  } = simulation

  const scenarioCards = [
    {
      label: 'P10 Pessimistic',
      description: '90% of scenarios exceed this profit',
      profit: p10,
      roi: roiP10,
      icon: AlertTriangle,
      className: 'border-red-500/20 bg-red-500/5 text-red-500',
    },
    {
      label: 'P50 Median',
      description: 'Half of scenarios are above this result',
      profit: p50,
      roi: roiP50,
      icon: Gauge,
      className: 'border-blue-500/20 bg-blue-500/5 text-blue-500',
    },
    {
      label: 'P90 Optimistic',
      description: '10% of scenarios reach or exceed this profit',
      profit: p90,
      roi: roiP90,
      icon: TrendingUp,
      className: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-500',
    },
  ]

  return (
    <section className="mt-8 overflow-hidden rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-8 flex flex-col items-start justify-between gap-6 lg:flex-row">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <Settings2 className="h-5 w-5 text-primary" />
            Monte Carlo Risk Simulation
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {iterations.toLocaleString('en-US')} reproducible scenarios. Profit and ROI are calculated from each scenario&apos;s revenue and total project cost.
          </p>
        </div>

        <div className="grid w-full gap-4 rounded-lg border border-border bg-muted/30 p-4 sm:grid-cols-3 lg:max-w-3xl">
          <RiskSlider label="Revenue risk" value={revenueVolatility} onChange={setRevenueVolatility} />
          <RiskSlider label="Variable cost risk" value={variableCostVolatility} onChange={setVariableCostVolatility} />
          <RiskSlider label="Fixed cost risk" value={fixedCostVolatility} onChange={setFixedCostVolatility} />
          <label className="space-y-2 sm:col-span-3">
            <span className="flex items-center justify-between text-sm font-medium">
              <span className="flex items-center gap-1.5">
                Maximum revenue ceiling
                <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-xs font-semibold text-amber-400">
                  cap
                </span>
              </span>
              {maxRevenue !== undefined && maxRevenue > 0 ? (
                <span className="font-bold text-amber-400">{formatCurrency(maxRevenue, investment.currency)}</span>
              ) : (
                <span className="text-xs text-muted-foreground">no cap — unlimited upside</span>
              )}
            </span>
            <input
              id="max-revenue-input"
              type="number"
              min={0}
              step={1000}
              placeholder={`e.g. ${formatCurrency(baseRevenue * 2, investment.currency)}`}
              value={maxRevenueInput}
              onChange={(e) => {
                const raw = e.target.value
                setMaxRevenueInput(raw)
                const parsed = parseFloat(raw)
                setMaxRevenue(raw === '' ? undefined : Number.isFinite(parsed) ? parsed : undefined)
              }}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
            <p className="text-xs text-muted-foreground">
              Scenarios with revenue above this value will be capped. Leave empty for unconstrained simulation.
            </p>
          </label>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {scenarioCards.map(({ label, description, profit, roi, icon: Icon, className }) => (
          <div key={label} className={`rounded-xl border p-4 ${className}`}>
            <div className="mb-2 flex items-center gap-2">
              <Icon className="h-4 w-4" />
              <h3 className="text-sm font-semibold">{label}</h3>
            </div>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(profit, investment.currency)}</p>
            <p className="text-sm font-medium text-muted-foreground">ROI: {formatPercentage(roi)}</p>
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          </div>
        ))}
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <StatisticCard
          label="Projected baseline"
          value={formatCurrency(baseProfit, investment.currency)}
          detail={`ROI ${formatPercentage(baseROI)}`}
        />
        <StatisticCard
          label="Expected profit"
          value={formatCurrency(meanProfit, investment.currency)}
          detail={`Expected ROI ${formatPercentage(meanROI)}`}
          tone={meanProfit >= 0 ? 'positive' : 'negative'}
        />
        <StatisticCard
          label="Profit probability"
          value={formatPercentage(probabilityOfProfit)}
          detail="Share of scenarios above zero"
          tone="positive"
        />
        <StatisticCard
          label="Loss probability"
          value={formatPercentage(probabilityOfLoss)}
          detail="Share of scenarios at or below zero"
          tone="negative"
        />
        <StatisticCard
          label="Profit deviation"
          value={formatCurrency(profitStdDev, investment.currency)}
          detail="Standard deviation of simulated profit"
        />
        <StatisticCard
          label="Break-even revenue"
          value={formatCurrency(breakEvenRevenue, investment.currency)}
          detail="Projected cost baseline"
        />
      </div>

      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <CircleDollarSign className="h-4 w-4 text-primary" />
          Profit distribution
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" /> Loss</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-500" /> Profit</span>
        </div>
      </div>

      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={histogram} margin={{ top: 10, right: 10, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.2)" />
            <XAxis
              dataKey="binMidpoint"
              type="number"
              domain={['dataMin', 'dataMax']}
              tickFormatter={(value) => formatCurrency(Number(value), investment.currency)}
              tick={{ fontSize: 11 }}
              tickMargin={10}
              stroke="rgba(148,163,184,0.5)"
            />
            <YAxis hide />
            <Tooltip
              formatter={(value) => [`${Number(value).toLocaleString('en-US')} scenarios`, 'Frequency']}
              labelFormatter={(_label, payload) => {
                const bin = payload?.[0]?.payload as HistogramBin | undefined
                return bin
                  ? `${formatCurrency(bin.binStart, investment.currency)} to ${formatCurrency(bin.binEnd, investment.currency)}`
                  : ''
              }}
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {histogram.map((entry) => (
                <Cell
                  key={`${entry.binStart}-${entry.binEnd}`}
                  fill={entry.binMidpoint < 0 ? '#ef4444' : '#3b82f6'}
                  fillOpacity={0.8}
                />
              ))}
            </Bar>
            {minProfit <= 0 && maxProfit >= 0 && (
              <ReferenceLine
                x={0}
                stroke="#ef4444"
                strokeDasharray="3 3"
                label={{ position: 'top', value: 'Break-even', fill: '#ef4444', fontSize: 12 }}
              />
            )}
            {maxRevenue !== undefined && maxRevenue > 0 && (() => {
              // Convert max revenue ceiling to profit space (revenue cap minus base costs approximation)
              // We display the cap on the x-axis (profit domain) by computing cap-based profit
              const capProfit = maxRevenue - simulation.breakEvenRevenue
              return (
                <ReferenceLine
                  x={capProfit}
                  stroke="#f59e0b"
                  strokeDasharray="4 2"
                  label={{ position: 'insideTopRight', value: 'Revenue cap', fill: '#f59e0b', fontSize: 12 }}
                />
              )
            })()}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <TrendingDown className="h-3.5 w-3.5" />
        Equal inputs produce equal results. Percentages represent model estimates, not guarantees.
      </p>
    </section>
  )
}
