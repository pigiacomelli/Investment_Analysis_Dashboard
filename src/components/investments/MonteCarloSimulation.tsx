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
import {
  AlertTriangle,
  CircleDollarSign,
  Clock,
  Gauge,
  HelpCircle,
  Landmark,
  Settings2,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'

const subscribeToClient = () => () => undefined
const getClientSnapshot = () => true
const getServerSnapshot = () => false

interface MetricHelpTooltipProps {
  title: string
  description: string
  formula?: string
}

function MetricHelpTooltip({ title, description, formula }: MetricHelpTooltipProps) {
  const [open, setOpen] = useState(false)

  return (
    <span
      className="relative inline-flex items-center"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label={`Explicação sobre ${title}`}
        aria-expanded={open}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setOpen((prev) => !prev)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground/80 transition-colors hover:bg-primary/15 hover:text-primary focus:outline-none focus:ring-1 focus:ring-primary"
      >
        <HelpCircle className="h-3.5 w-3.5" />
      </button>

      {open && (
        <span
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-72 -translate-x-1/2 rounded-lg border border-border bg-slate-950 p-3 text-left text-xs text-slate-100 shadow-xl"
        >
          <span className="block font-semibold text-primary">{title}</span>
          <span className="mt-1 block leading-relaxed text-slate-300">{description}</span>
          {formula && (
            <span className="mt-2 block rounded border border-slate-800 bg-slate-900/90 px-2 py-1 font-mono text-[10px] text-amber-300">
              {formula}
            </span>
          )}
        </span>
      )}
    </span>
  )
}

interface RiskSliderProps {
  label: string
  value: number
  onChange: (value: number) => void
  helpTitle: string
  helpDescription: string
  helpFormula?: string
}

function RiskSlider({
  label,
  value,
  onChange,
  helpTitle,
  helpDescription,
  helpFormula,
}: RiskSliderProps) {
  return (
    <label className="space-y-2">
      <span className="flex justify-between text-sm font-medium">
        <span className="flex items-center gap-1.5">
          {label}
          <MetricHelpTooltip
            title={helpTitle}
            description={helpDescription}
            formula={helpFormula}
          />
        </span>
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
  helpTitle: string
  helpDescription: string
  helpFormula?: string
}

function StatisticCard({
  label,
  value,
  detail,
  tone = 'neutral',
  helpTitle,
  helpDescription,
  helpFormula,
}: StatisticCardProps) {
  const toneClass = tone === 'positive'
    ? 'text-emerald-500'
    : tone === 'negative'
      ? 'text-red-500'
      : 'text-foreground'

  return (
    <div className="rounded-lg border border-border bg-muted/20 p-4">
      <div className="flex items-center justify-between gap-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <MetricHelpTooltip
          title={helpTitle}
          description={helpDescription}
          formula={helpFormula}
        />
      </div>
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
  const [holdingPeriodVolatility, setHoldingPeriodVolatility] = useState(0.25)
  const [expectedMonthsToSell, setExpectedMonthsToSell] = useState(6)
  const [cdiAnnualRatePercent, setCdiAnnualRatePercent] = useState(10.75)

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
      holdingPeriodVolatility,
      expectedMonthsToSell: Math.max(0.5, expectedMonthsToSell || 6),
      cdiAnnualRate: Math.max(0, (cdiAnnualRatePercent || 0) / 100),
      maxRevenue: maxRevenue !== undefined && maxRevenue > 0 ? maxRevenue : undefined,
      iterations: 10_000,
    })
  }, [
    cdiAnnualRatePercent,
    expectedMonthsToSell,
    fixedCostVolatility,
    holdingPeriodVolatility,
    investment,
    isMounted,
    maxRevenue,
    revenueVolatility,
    variableCostVolatility,
  ])

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
    vaR95,
    cVaR95,
    p90MonthsToSell,
    cdiMonthlyRatePercent,
    cdiBenchmarkProfit,
    cdiBenchmarkROI,
    probabilityOfBeatingCDI,
    meanExcessProfitOverCDI,
    meanMonthlyROI,
    cdiEquivalentPercent,
    maxMonthsToBeatCDI,
    sharpeRatioVsCDI,
  } = simulation

  const scenarioCards = [
    {
      label: 'P10 Pessimistic',
      description: '90% of scenarios exceed this profit',
      profit: p10,
      roi: roiP10,
      icon: AlertTriangle,
      className: 'border-red-500/20 bg-red-500/5 text-red-500',
      helpTitle: 'Percentil 10 (Cenário Pessimista)',
      helpDescription:
        'Na distribuição normal simulada, apenas 10% dos cenários tiveram resultado pior que este valor (ex.: arrematação/venda com deságio maior ou reforma mais cara). Em 90% das vezes você ganha mais que isso.',
      helpFormula: 'P(Lucro ≤ P10) = 10% | Z ≈ -1,28σ',
    },
    {
      label: 'P50 Median',
      description: 'Half of scenarios are above this result',
      profit: p50,
      roi: roiP50,
      icon: Gauge,
      className: 'border-blue-500/20 bg-blue-500/5 text-blue-500',
      helpTitle: 'Percentil 50 (Mediana Central)',
      helpDescription:
        'O centro exato da distribuição de resultados: metade dos 10.000 cenários simulados fica acima deste valor e metade fica abaixo. Em uma curva normal sem teto, coincide com a média.',
      helpFormula: 'P(Lucro ≤ P50) = 50% | Z = 0σ',
    },
    {
      label: 'P90 Optimistic',
      description: '10% of scenarios reach or exceed this profit',
      profit: p90,
      roi: roiP90,
      icon: TrendingUp,
      className: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-500',
      helpTitle: 'Percentil 90 (Cenário Otimista)',
      helpDescription:
        'Representa a cauda superior da curva normal: os 10% melhores cenários (venda rápida pelo preço cheio e custos controlados) atingem ou superam este lucro.',
      helpFormula: 'P(Lucro ≥ P90) = 10% | Z ≈ +1,28σ',
    },
  ]

  return (
    <section className="mt-8 overflow-hidden rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-8 flex flex-col items-start justify-between gap-6 lg:flex-row">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <Settings2 className="h-5 w-5 text-primary" />
            Monte Carlo Risk Simulation (Normal Distribution)
            <MetricHelpTooltip
              title="Simulação de Monte Carlo por Distribuição Normal"
              description="Sorteia 10.000 cenários seguindo uma curva de Gauss (Distribuição Normal) para receitas, custos e tempo de venda. Permite medir a probabilidade real de lucro e se o negócio ou bem de leilão compensa frente ao CDI."
              formula="X ~ N(μ, σ²) via transformação de Box-Muller"
            />
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {iterations.toLocaleString('en-US')} reproducible scenarios. Profit, ROI, time to sell, and CDI opportunity cost are simulated together.
          </p>
        </div>

        <div className="grid w-full gap-4 rounded-lg border border-border bg-muted/30 p-4 sm:grid-cols-2 lg:max-w-3xl">
          <RiskSlider
            label="Revenue risk"
            value={revenueVolatility}
            onChange={setRevenueVolatility}
            helpTitle="Volatilidade da Receita / Preço de Venda (σ)"
            helpDescription="Define o desvio padrão (abertura da curva normal) do valor de venda. Ex.: 20% significa que em ~68% dos casos a venda ocorre entre -20% e +20% do valor esperado."
            helpFormula="Receita ~ Normal(μ = Receita Base, σ = Risco × Receita Base)"
          />
          <RiskSlider
            label="Variable cost risk"
            value={variableCostVolatility}
            onChange={setVariableCostVolatility}
            helpTitle="Volatilidade de Custos Variáveis (σ)"
            helpDescription="Incerteza sobre reformas, manutenção, comissões de leiloeiro/corretor, impostos (ITBI/IPVA) ou insumos de vendas."
            helpFormula="Custo Var ~ Normal(μ = Custo Var Base, σ = Risco × Custo Var)"
          />
          <RiskSlider
            label="Fixed cost risk"
            value={fixedCostVolatility}
            onChange={setFixedCostVolatility}
            helpTitle="Volatilidade de Custos Fixos (σ)"
            helpDescription="Incerteza sobre despesas fixas como condomínio, IPTU, armazenagem, taxas cartorárias ou estrutura fixa."
            helpFormula="Custo Fixo ~ Normal(μ = Custo Fixo Base, σ = Risco × Custo Fixo)"
          />
          <RiskSlider
            label="Sale time risk"
            value={holdingPeriodVolatility}
            onChange={setHoldingPeriodVolatility}
            helpTitle="Incerteza no Tempo de Venda / Liquidez (σ)"
            helpDescription="Variação no prazo até concluir a venda do imóvel, veículo ou estoque. Quanto mais meses demorar para vender, maior é o ganho que o dinheiro teria tido no CDI."
            helpFormula="Prazo ~ Normal(μ = Meses p/ Venda, σ = Risco × Meses)"
          />

          <label className="space-y-1.5">
            <span className="flex items-center justify-between text-sm font-medium">
              <span className="flex items-center gap-1.5">
                Expected time to sell (months)
                <MetricHelpTooltip
                  title="Prazo Esperado de Venda (Giro em Meses)"
                  description="Tempo médio estimado entre o desembolso (arrematação/compra/produção) e o recebimento da venda. Essencial para comparar a rentabilidade mensal do negócio com o CDI."
                  formula="Ex.: 6 meses para desocupar, reformar e vender"
                />
              </span>
              <span className="font-bold text-primary">{expectedMonthsToSell} mo</span>
            </span>
            <input
              id="expected-months-input"
              type="number"
              min={0.5}
              max={120}
              step={0.5}
              value={expectedMonthsToSell}
              onChange={(e) => {
                const parsed = parseFloat(e.target.value)
                setExpectedMonthsToSell(Number.isFinite(parsed) && parsed > 0 ? parsed : 1)
              }}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </label>

          <label className="space-y-1.5">
            <span className="flex items-center justify-between text-sm font-medium">
              <span className="flex items-center gap-1.5">
                Annual CDI / Benchmark (% p.a.)
                <MetricHelpTooltip
                  title="Taxa CDI / Benchmark Anual (% a.a.)"
                  description="Taxa de referência livre de risco (ex.: CDI ou Tesouro Selic). Usada para calcular o custo de oportunidade do capital empatado durante os meses até a venda."
                  formula={`Taxa mensal equiv.: ${formatPercentage(cdiMonthlyRatePercent)} a.m.`}
                />
              </span>
              <span className="font-bold text-emerald-500">{formatPercentage(cdiAnnualRatePercent)}</span>
            </span>
            <input
              id="cdi-rate-input"
              type="number"
              min={0}
              max={100}
              step={0.25}
              value={cdiAnnualRatePercent}
              onChange={(e) => {
                const parsed = parseFloat(e.target.value)
                setCdiAnnualRatePercent(Number.isFinite(parsed) && parsed >= 0 ? parsed : 0)
              }}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </label>

          <label className="space-y-2 sm:col-span-2">
            <span className="flex items-center justify-between text-sm font-medium">
              <span className="flex items-center gap-1.5">
                Maximum revenue ceiling
                <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-xs font-semibold text-amber-400">
                  cap
                </span>
                <MetricHelpTooltip
                  title="Teto Máximo de Receita (Valor de Mercado / Avaliação)"
                  description="Em leilões e vendas, um imóvel ou produto raramente é vendido acima do valor máximo de avaliação do mercado. Definir um teto corta a cauda direita da distribuição normal (distribuição normal truncada)."
                  formula="Receita Simulada = min(Receita Sorteada, Teto)"
                />
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
        {scenarioCards.map(({ label, description, profit, roi, icon: Icon, className, helpTitle, helpDescription, helpFormula }) => (
          <div key={label} className={`rounded-xl border p-4 ${className}`}>
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <h3 className="text-sm font-semibold">{label}</h3>
              </div>
              <MetricHelpTooltip
                title={helpTitle}
                description={helpDescription}
                formula={helpFormula}
              />
            </div>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(profit, investment.currency)}</p>
            <p className="text-sm font-medium text-muted-foreground">ROI: {formatPercentage(roi)}</p>
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          </div>
        ))}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <StatisticCard
          label="Projected baseline"
          value={formatCurrency(baseProfit, investment.currency)}
          detail={`ROI ${formatPercentage(baseROI)}`}
          helpTitle="Lucro Base Projetado (Determinístico)"
          helpDescription="É o lucro simples (Receita Planejada − Custos Planejados) sem considerar oscilações de mercado ou atrasos na venda."
          helpFormula="Lucro Base = Receita Projetada − Custos Totais"
        />
        <StatisticCard
          label="Expected profit"
          value={formatCurrency(meanProfit, investment.currency)}
          detail={`Expected ROI ${formatPercentage(meanROI)}`}
          tone={meanProfit >= 0 ? 'positive' : 'negative'}
          helpTitle="Lucro Esperado (Média da Distribuição μ)"
          helpDescription="Média aritmética dos 10.000 cenários simulados na distribuição normal. Se houver um teto de receita (cap), a média pode ser menor que o lucro base."
          helpFormula="μ = (Σ Lucro_i) / N"
        />
        <StatisticCard
          label="Profit probability"
          value={formatPercentage(probabilityOfProfit)}
          detail="Share of scenarios above zero"
          tone="positive"
          helpTitle="Probabilidade de Lucro (Acima do Break-even)"
          helpDescription="Percentual da área da curva normal que fica acima de R$ 0,00 (ou seja, a venda paga todos os custos de aquisição, reforma e manutenção)."
          helpFormula="P(Lucro > 0) = Cenários Positivos / 10.000"
        />
        <StatisticCard
          label="Loss probability"
          value={formatPercentage(probabilityOfLoss)}
          detail="Share of scenarios at or below zero"
          tone="negative"
          helpTitle="Probabilidade de Prejuízo (Risco de Perda)"
          helpDescription="Percentual dos cenários na cauda esquerda da distribuição normal em que o valor de venda não cobre os custos totais da operação."
          helpFormula="P(Lucro ≤ 0) = 100% − Prob. de Lucro"
        />
        <StatisticCard
          label="Profit deviation"
          value={formatCurrency(profitStdDev, investment.currency)}
          detail="Standard deviation of simulated profit"
          helpTitle="Desvio Padrão do Lucro (σ)"
          helpDescription="Mede a dispersão (grau de incerteza) do resultado. Na distribuição normal, ~68% dos resultados ficam entre (Média − 1σ) e (Média + 1σ)."
          helpFormula="σ = √[ Σ(Lucro_i − μ)² / N ]"
        />
        <StatisticCard
          label="Break-even revenue"
          value={formatCurrency(breakEvenRevenue, investment.currency)}
          detail="Projected cost baseline"
          helpTitle="Receita de Ponto de Equilíbrio (Break-even)"
          helpDescription="Valor mínimo pelo qual o bem/estoque precisa ser vendido para empatar os custos planejados (lucro zero, antes de contar o custo de oportunidade do CDI)."
          helpFormula="Break-even = Custos Fixos + Custos Variáveis"
        />
      </div>

      {/* Auction / Sales vs CDI Benchmark Section */}
      <div className="mb-8 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Landmark className="h-4 w-4 text-emerald-500" />
            <h3 className="text-sm font-semibold text-foreground">
              Análise de Giro (Leilão / Vendas) vs. Rentabilidade do CDI
            </h3>
            <MetricHelpTooltip
              title="Por que comparar Tempo de Venda com o CDI?"
              description="Em leilões (imóveis/veículos) e comércio, ganhar 20% em 3 meses é excelente, mas ganhar 20% demorando 30 meses para vender pode perder para o CDI líquido sem risco. Estas métricas cruzam a distribuição normal do lucro com a distribuição do tempo de venda."
            />
          </div>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5 text-emerald-500" />
            CDI no prazo ({expectedMonthsToSell}m):{' '}
            <strong className="text-foreground">
              {formatCurrency(cdiBenchmarkProfit, investment.currency)} ({formatPercentage(cdiBenchmarkROI)})
            </strong>
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatisticCard
            label="Prob. de Bater CDI"
            value={formatPercentage(probabilityOfBeatingCDI)}
            detail={`Acima de ${formatCurrency(cdiBenchmarkProfit, investment.currency)} no giro`}
            tone={probabilityOfBeatingCDI >= 50 ? 'positive' : 'negative'}
            helpTitle="Probabilidade de Superar o CDI"
            helpDescription="Percentual dos 10.000 cenários simulados (considerando tanto o risco de preço/custo quanto o risco de atraso na venda) em que o lucro líquido supera o que o mesmo capital renderia aplicado a 100% do CDI durante o período."
            helpFormula="P(Lucro Simulado > Capital × [(1 + CDI_m)^Meses − 1])"
          />
          <StatisticCard
            label="Retorno em % do CDI"
            value={`${cdiEquivalentPercent.toFixed(0)}% do CDI`}
            detail={`Giro: ${formatPercentage(meanMonthlyROI)} a.m. vs CDI ${formatPercentage(cdiMonthlyRatePercent)} a.m.`}
            tone={cdiEquivalentPercent >= 100 ? 'positive' : 'negative'}
            helpTitle="Rentabilidade Equivalente (% do CDI)"
            helpDescription="Mostra quantos por cento do CDI a operação entrega no prazo estimado de venda. Acima de 100% do CDI significa que o negócio remunera melhor que a renda fixa; em leilões busca-se tipicamente > 180% do CDI para compensar a iliquidez."
            helpFormula="% CDI = (ROI Médio no Período / ROI do CDI no Período) × 100"
          />
          <StatisticCard
            label="Lucro Acima do CDI"
            value={formatCurrency(meanExcessProfitOverCDI, investment.currency)}
            detail="Ganho real descontado o CDI"
            tone={meanExcessProfitOverCDI >= 0 ? 'positive' : 'negative'}
            helpTitle="Lucro Econômico (Excesso sobre o CDI)"
            helpDescription="É o dinheiro extra que você coloca no bolso além do que ganharia deixando o capital parado no CDI durante o tempo de venda simulado. Se for negativo, o capital trabalhou de graça em relação à renda fixa."
            helpFormula="Excesso = Média(Lucro_i − Rendimento_CDI_i)"
          />
          <StatisticCard
            label="Prazo Limite vs CDI"
            value={
              maxMonthsToBeatCDI === null
                ? '—'
                : maxMonthsToBeatCDI <= 0
                  ? '0 meses'
                  : `${maxMonthsToBeatCDI.toFixed(1)} meses`
            }
            detail={`Cenário lento (P90): ${p90MonthsToSell.toFixed(1)} meses`}
            tone={
              maxMonthsToBeatCDI !== null && maxMonthsToBeatCDI > p90MonthsToSell
                ? 'positive'
                : 'negative'
            }
            helpTitle="Tempo Máximo de Venda até Empatar com o CDI"
            helpDescription="Responde à pergunta: 'Em até quantos meses preciso vender esse bem/estoque antes que o CDI acumulado supere o meu lucro esperado?'. Compare com o Cenário Lento (P90) para saber se há folga de tempo."
            helpFormula="Meses Máx = ln(1 + Lucro / Capital) / ln(1 + CDI_mensal)"
          />
          <StatisticCard
            label="VaR 95% (Cauda P5)"
            value={formatCurrency(vaR95, investment.currency)}
            detail={`Média 5% piores: ${formatCurrency(cVaR95, investment.currency)}`}
            tone={vaR95 >= 0 ? 'positive' : 'negative'}
            helpTitle="Value at Risk 95% (VaR P5) e CVaR"
            helpDescription="Mede o risco extremo na cauda esquerda da distribuição normal: em 95% dos cenários o resultado será melhor que o VaR 95%. O detalhe mostra o CVaR (Expected Shortfall), que é a média caso você caia nos 5% piores cenários."
            helpFormula="P(Lucro ≤ VaR95) = 5% | Z ≈ -1,645σ"
          />
          <StatisticCard
            label="Índice Sharpe vs CDI"
            value={`${sharpeRatioVsCDI.toFixed(2)} σ`}
            detail={
              sharpeRatioVsCDI >= 1
                ? 'Forte margem de segurança'
                : sharpeRatioVsCDI >= 0
                  ? 'Margem moderada sobre CDI'
                  : 'Retorno abaixo do CDI'
            }
            tone={sharpeRatioVsCDI >= 0.5 ? 'positive' : sharpeRatioVsCDI < 0 ? 'negative' : 'neutral'}
            helpTitle="Índice de Sharpe da Operação (Retorno Excedente / Risco)"
            helpDescription="Indica quantos desvios padrão (σ) o lucro esperado está acima do rendimento do CDI. Acima de 1,0σ indica excelente relação risco-retorno na distribuição normal (mais de 84% de chance de bater o CDI)."
            helpFormula="Sharpe = (Lucro Esperado − Retorno CDI) / Desvio Padrão (σ)"
          />
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <CircleDollarSign className="h-4 w-4 text-primary" />
          Profit distribution (Normal Curve Histogram)
          <MetricHelpTooltip
            title="Histograma de Frequência da Distribuição Normal"
            description="Cada barra mostra quantos dos 10.000 cenários caíram naquela faixa de lucro. Barras vermelhas indicam prejuízo (< 0), barras azuis indicam lucro (> 0), e a linha verde tracejada marca o rendimento do CDI no período."
          />
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" /> Loss</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-500" /> Profit</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> CDI Benchmark</span>
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
            {cdiBenchmarkProfit > 0 && cdiBenchmarkProfit >= minProfit && cdiBenchmarkProfit <= maxProfit && (
              <ReferenceLine
                x={cdiBenchmarkProfit}
                stroke="#10b981"
                strokeDasharray="4 4"
                label={{ position: 'top', value: 'CDI', fill: '#10b981', fontSize: 12 }}
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
        <ShieldAlert className="h-3.5 w-3.5 text-primary" />
        <TrendingDown className="h-3.5 w-3.5" />
        Equal inputs produce equal results. Hover or click the (?) icon on any metric to see how it is calculated.
      </p>
    </section>
  )
}
