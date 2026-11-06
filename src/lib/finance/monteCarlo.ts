import {
  InvestmentWithDetails,
  isRecordedCost,
  isRecordedRevenue,
  calculateForecast,
} from './index'
import { calculateBenchmark } from './benchmark'

export interface MonteCarloAssumptions {
  revenueVolatility: number
  variableCostVolatility: number
  fixedCostVolatility: number
  iterations: number
  /** Optional hard ceiling on simulated revenue. Scenarios that would exceed this are capped. */
  maxRevenue?: number
  /** Expected time in months to sell the asset/inventory (e.g., auction property, vehicle, stock). */
  expectedMonthsToSell?: number
  /** Relative volatility (0 to 1) of the time to sell in the normal distribution. */
  holdingPeriodVolatility?: number
  /** Annual CDI / risk-free benchmark rate as a decimal (e.g., 0.1075 for 10.75% p.a.). */
  cdiAnnualRate?: number
  seed?: number
}

export interface HistogramBin {
  binStart: number
  binEnd: number
  binMidpoint: number
  count: number
}

export interface MonteCarloResult {
  p10: number; p50: number; p90: number
  roiP10: number | null; roiP50: number | null; roiP90: number | null
  baseProfit: number; baseROI: number | null
  meanProfit: number; meanROI: number | null
  meanCosts: number; meanRevenue: number
  profitStdDev: number
  probabilityOfProfit: number; probabilityOfLoss: number; probabilityOfBreakEven: number
  breakEvenRevenue: number; minProfit: number; maxProfit: number
  histogram: HistogramBin[]; iterations: number; seed: number
  profitP05: number; meanWorst5Profit: number
  expectedMonthsToSell: number; p90MonthsToSell: number
  cdiAnnualRate: number; cdiMonthlyRatePercent: number
  cdiBenchmarkProfit: number | null; cdiBenchmarkROI: number
  probabilityOfBeatingCDI: number | null
  meanExcessProfitOverCDI: number | null
  monthlyROIOnMeanCosts: number | null
  returnMultipleVsCDI: number | null
  maxMonthsToBeatCDI: number | null
  excessToRiskRatio: number | null
}

const DEFAULT_ASSUMPTIONS: MonteCarloAssumptions = {
  revenueVolatility: 0.2,
  variableCostVolatility: 0.2,
  fixedCostVolatility: 0,
  iterations: 10_000,
  expectedMonthsToSell: 6,
  holdingPeriodVolatility: 0.25,
  cdiAnnualRate: 0.1075,
}

function hashString(value: string): number {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state += 0x6d2b79f5
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296
  }
}

function randomNormal(mean: number, standardDeviation: number, random: () => number): number {
  if (standardDeviation === 0) return mean

  let first = 0
  let second = 0
  while (first === 0) first = random()
  while (second === 0) second = random()

  const standardNormal = Math.sqrt(-2 * Math.log(first)) * Math.cos(2 * Math.PI * second)
  return mean + standardNormal * standardDeviation
}

function percentile(sortedValues: number[], probability: number): number {
  const position = (sortedValues.length - 1) * probability
  const lowerIndex = Math.floor(position)
  const upperIndex = Math.ceil(position)
  const fraction = position - lowerIndex

  if (lowerIndex === upperIndex) return sortedValues[lowerIndex]
  return sortedValues[lowerIndex] + (sortedValues[upperIndex] - sortedValues[lowerIndex]) * fraction
}

function average(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function standardDeviation(values: number[], mean: number): number {
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length
  return Math.sqrt(variance)
}

function createHistogram(sortedValues: number[], binCount = 20): HistogramBin[] {
  const min = sortedValues[0]
  const max = sortedValues[sortedValues.length - 1]

  if (min === max) {
    return [{ binStart: min, binEnd: max, binMidpoint: min, count: sortedValues.length }]
  }

  const binSize = (max - min) / binCount
  const bins = Array.from({ length: binCount }, (_, index) => {
    const binStart = min + index * binSize
    const binEnd = index === binCount - 1 ? max : binStart + binSize
    return {
      binStart,
      binEnd,
      binMidpoint: binStart + binSize / 2,
      count: 0,
    }
  })

  for (const value of sortedValues) {
    const index = Math.min(binCount - 1, Math.floor((value - min) / binSize))
    bins[index].count += 1
  }

  return bins
}

function validateAssumptions(assumptions: MonteCarloAssumptions): void {
  const volatilityEntries = [
    ['Revenue volatility', assumptions.revenueVolatility],
    ['Variable cost volatility', assumptions.variableCostVolatility],
    ['Fixed cost volatility', assumptions.fixedCostVolatility],
    ['Holding period volatility', assumptions.holdingPeriodVolatility ?? 0],
  ] as const

  for (const [label, value] of volatilityEntries) {
    if (!Number.isFinite(value) || value < 0 || value > 1) {
      throw new RangeError(`${label} must be between 0 and 1`)
    }
  }

  if (!Number.isInteger(assumptions.iterations) || assumptions.iterations < 1 || assumptions.iterations > 1_000_000) {
    throw new RangeError('Iterations must be an integer between 1 and 1,000,000')
  }

  const expectedMonths = assumptions.expectedMonthsToSell ?? 6
  if (!Number.isFinite(expectedMonths) || expectedMonths <= 0) {
    throw new RangeError('Expected months to sell must be greater than 0')
  }

  const cdiRate = assumptions.cdiAnnualRate ?? 0.1075
  if (!Number.isFinite(cdiRate) || cdiRate < 0 || cdiRate > 5) {
    throw new RangeError('CDI annual rate must be between 0 and 5')
  }
}

/**
 * Simulates profit, return on total project cost, time to sell, and comparison against CDI.
 *
 * Each volatility is the standard deviation relative to its pending projected total.
 * Settled projects also have fixed duration; a cap cannot erase receipts.
 * Revenue, fixed costs and variable costs are sampled independently and cannot
 * become negative. A deterministic seed makes equal inputs reproducible.
 */
export function runMonteCarloSimulation(
  investment: InvestmentWithDetails,
  overrides: Partial<MonteCarloAssumptions> = {},
): MonteCarloResult {
  const assumptions = { ...DEFAULT_ASSUMPTIONS, ...overrides }
  validateAssumptions(assumptions)

  const expectedMonthsToSell = assumptions.expectedMonthsToSell ?? 6
  const holdingPeriodVolatility = calculateForecast(investment.revenues, investment.costs).isRealised ? 0 : assumptions.holdingPeriodVolatility ?? 0.25
  const cdiAnnualRate = assumptions.cdiAnnualRate ?? 0.1075

  // Investor logic: money already paid/received is a fact. Only the unrealised part is uncertain.
  const sumBy = <T,>(items: T[], pick: (item: T) => number) => items.reduce((total, item) => total + pick(item), 0)
  const paidFixed = sumBy(investment.costs.filter(c => c.costType === 'FIXED' && isRecordedCost(c)), c => c.actualAmount)
  const paidVariable = sumBy(investment.costs.filter(c => c.costType !== 'FIXED' && isRecordedCost(c)), c => c.actualAmount)
  const pendingFixed = sumBy(investment.costs.filter(c => c.costType === 'FIXED' && !isRecordedCost(c)), c => c.projectedAmount)
  const pendingVariable = sumBy(investment.costs.filter(c => c.costType !== 'FIXED' && !isRecordedCost(c)), c => c.projectedAmount)
  const receivedRevenue = sumBy(investment.revenues.filter(isRecordedRevenue), r => r.actualAmount)
  const pendingRevenue = sumBy(investment.revenues.filter(r => !isRecordedRevenue(r)), r => r.projectedAmount)

  if (assumptions.maxRevenue !== undefined && (!Number.isFinite(assumptions.maxRevenue) || assumptions.maxRevenue < receivedRevenue || assumptions.maxRevenue < 0)) {
    throw new RangeError('Revenue ceiling must be finite, nonnegative and not below revenue already received')
  }
  const baseRevenue = assumptions.maxRevenue === undefined ? receivedRevenue + pendingRevenue
    : Math.min(receivedRevenue + pendingRevenue, assumptions.maxRevenue)
  const baseFixedCosts = paidFixed + pendingFixed
  const baseVariableCosts = paidVariable + pendingVariable
  const baseTotalCosts = baseFixedCosts + baseVariableCosts
  const baseProfit = baseRevenue - baseTotalCosts
  const baseROI = baseTotalCosts > 0 ? (baseProfit / baseTotalCosts) * 100 : null
  const seed = assumptions.seed ?? hashString(investment.id)
  const random = createSeededRandom(seed)
  const timeRandom = createSeededRandom((seed ^ 0x9e3779b9) >>> 0)

  const profits: number[] = []
  const returns: number[] = []
  const holdingMonthsList: number[] = []
  const excessProfitsOverCDI: number[] = []
  const scenarioCosts: number[] = []
  const scenarioRevenues: number[] = []
  let profitableScenarios = 0
  let losingScenarios = 0
  let scenariosBeatingCDI = 0

  for (let index = 0; index < assumptions.iterations; index += 1) {
    const rawRevenue = receivedRevenue + Math.max(
      0,
      randomNormal(pendingRevenue, pendingRevenue * assumptions.revenueVolatility, random),
    )
    const simulatedRevenue = assumptions.maxRevenue !== undefined
      ? Math.min(rawRevenue, assumptions.maxRevenue)
      : rawRevenue
    const simulatedFixedCosts = paidFixed + Math.max(
      0,
      randomNormal(pendingFixed, pendingFixed * assumptions.fixedCostVolatility, random),
    )
    const simulatedVariableCosts = paidVariable + Math.max(
      0,
      randomNormal(pendingVariable, pendingVariable * assumptions.variableCostVolatility, random),
    )
    const simulatedMonths = Math.max(
      0.5,
      randomNormal(expectedMonthsToSell, expectedMonthsToSell * holdingPeriodVolatility, timeRandom),
    )

    const simulatedTotalCosts = simulatedFixedCosts + simulatedVariableCosts
    const simulatedProfit = simulatedRevenue - simulatedTotalCosts
    const simulatedROI = simulatedTotalCosts > 0 ? (simulatedProfit / simulatedTotalCosts) * 100 : null

    const benchmark = calculateBenchmark(simulatedTotalCosts, simulatedRevenue, simulatedMonths, cdiAnnualRate)
    profits.push(simulatedProfit)
    if (simulatedROI !== null) returns.push(simulatedROI)
    scenarioCosts.push(simulatedTotalCosts)
    scenarioRevenues.push(simulatedRevenue)
    holdingMonthsList.push(simulatedMonths)
    if (benchmark.excessProfit !== null) {
      excessProfitsOverCDI.push(benchmark.excessProfit)
      if (benchmark.excessProfit > 0.005) scenariosBeatingCDI += 1
    }
    if (simulatedProfit > 0.005) profitableScenarios += 1
    if (simulatedProfit < -0.005) losingScenarios += 1
  }

  profits.sort((first, second) => first - second)
  returns.sort((first, second) => first - second)
  holdingMonthsList.sort((first, second) => first - second)

  const meanProfit = average(profits)
  const meanCosts = average(scenarioCosts)
  const meanRevenue = average(scenarioRevenues)
  const profitStdDev = standardDeviation(profits, meanProfit)
  const benchmark = calculateBenchmark(meanCosts, meanRevenue, expectedMonthsToSell, cdiAnnualRate)
  const meanExcess = excessProfitsOverCDI.length ? average(excessProfitsOverCDI) : null
  const excessStdDev = meanExcess === null ? 0 : standardDeviation(excessProfitsOverCDI, meanExcess)
  const tailCutoffCount = Math.max(1, Math.ceil(profits.length * 0.05))

  return {
    p10: percentile(profits, 0.1), p50: percentile(profits, 0.5), p90: percentile(profits, 0.9),
    roiP10: returns.length ? percentile(returns, 0.1) : null,
    roiP50: returns.length ? percentile(returns, 0.5) : null,
    roiP90: returns.length ? percentile(returns, 0.9) : null,
    baseProfit, baseROI, meanProfit,
    // Return on mean scenario costs, consistent with the representative benchmark comparison.
    meanROI: meanCosts > 0 ? meanProfit / meanCosts * 100 : null,
    meanCosts, meanRevenue, profitStdDev,
    probabilityOfProfit: profitableScenarios / assumptions.iterations * 100,
    probabilityOfLoss: losingScenarios / assumptions.iterations * 100,
    probabilityOfBreakEven: (assumptions.iterations - profitableScenarios - losingScenarios) / assumptions.iterations * 100,
    breakEvenRevenue: baseTotalCosts,
    minProfit: profits[0], maxProfit: profits[profits.length - 1],
    histogram: createHistogram(profits), iterations: assumptions.iterations, seed,
    profitP05: percentile(profits, 0.05),
    meanWorst5Profit: average(profits.slice(0, tailCutoffCount)),
    expectedMonthsToSell,
    p90MonthsToSell: percentile(holdingMonthsList, 0.9),
    cdiAnnualRate,
    cdiMonthlyRatePercent: benchmark.monthlyBenchmarkPercent,
    cdiBenchmarkProfit: benchmark.benchmarkProfit,
    cdiBenchmarkROI: benchmark.benchmarkROIPercent,
    probabilityOfBeatingCDI: excessProfitsOverCDI.length === assumptions.iterations ? scenariosBeatingCDI / assumptions.iterations * 100 : null,
    meanExcessProfitOverCDI: meanExcess,
    monthlyROIOnMeanCosts: benchmark.monthlyROI,
    returnMultipleVsCDI: benchmark.returnMultiple,
    maxMonthsToBeatCDI: benchmark.monthsToMatch,
    // Dispersion of scenario excess profits, not a time-series Sharpe ratio.
    excessToRiskRatio: meanExcess === null || excessStdDev < 1e-8 ? null : meanExcess / excessStdDev,
  }
}
