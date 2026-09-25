import {
  InvestmentWithDetails,
  calculateProjectedFixedCosts,
  calculateProjectedRevenue,
  calculateProjectedVariableCosts,
} from './index'

export interface MonteCarloAssumptions {
  revenueVolatility: number
  variableCostVolatility: number
  fixedCostVolatility: number
  iterations: number
  /** Optional hard ceiling on simulated revenue. Scenarios that would exceed this are capped. */
  maxRevenue?: number
  seed?: number
}

export interface HistogramBin {
  binStart: number
  binEnd: number
  binMidpoint: number
  count: number
}

export interface MonteCarloResult {
  p10: number
  p50: number
  p90: number
  roiP10: number
  roiP50: number
  roiP90: number
  baseProfit: number
  baseROI: number
  meanProfit: number
  meanROI: number
  profitStdDev: number
  probabilityOfProfit: number
  probabilityOfLoss: number
  breakEvenRevenue: number
  minProfit: number
  maxProfit: number
  histogram: HistogramBin[]
  iterations: number
  seed: number
}

const DEFAULT_ASSUMPTIONS: MonteCarloAssumptions = {
  revenueVolatility: 0.2,
  variableCostVolatility: 0.2,
  fixedCostVolatility: 0,
  iterations: 10_000,
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
  ] as const

  for (const [label, value] of volatilityEntries) {
    if (!Number.isFinite(value) || value < 0 || value > 1) {
      throw new RangeError(`${label} must be between 0 and 1`)
    }
  }

  if (!Number.isInteger(assumptions.iterations) || assumptions.iterations < 1 || assumptions.iterations > 1_000_000) {
    throw new RangeError('Iterations must be an integer between 1 and 1,000,000')
  }
}

/**
 * Simulates profit and return on total project cost.
 *
 * Each volatility is the standard deviation relative to its projected total.
 * Revenue, fixed costs and variable costs are sampled independently and cannot
 * become negative. A deterministic seed makes equal inputs reproducible.
 */
export function runMonteCarloSimulation(
  investment: InvestmentWithDetails,
  overrides: Partial<MonteCarloAssumptions> = {},
): MonteCarloResult {
  const assumptions = { ...DEFAULT_ASSUMPTIONS, ...overrides }
  validateAssumptions(assumptions)

  const baseRevenue = calculateProjectedRevenue(investment.revenues)
  const baseFixedCosts = calculateProjectedFixedCosts(investment.costs)
  const baseVariableCosts = calculateProjectedVariableCosts(investment.costs)
  const baseTotalCosts = baseFixedCosts + baseVariableCosts
  const baseProfit = baseRevenue - baseTotalCosts
  const baseROI = baseTotalCosts > 0 ? (baseProfit / baseTotalCosts) * 100 : 0
  const seed = assumptions.seed ?? hashString(investment.id)
  const random = createSeededRandom(seed)

  const profits: number[] = []
  const returns: number[] = []
  let profitableScenarios = 0

  for (let index = 0; index < assumptions.iterations; index += 1) {
    const rawRevenue = Math.max(
      0,
      randomNormal(baseRevenue, baseRevenue * assumptions.revenueVolatility, random),
    )
    const simulatedRevenue = assumptions.maxRevenue !== undefined
      ? Math.min(rawRevenue, assumptions.maxRevenue)
      : rawRevenue
    const simulatedFixedCosts = Math.max(
      0,
      randomNormal(baseFixedCosts, baseFixedCosts * assumptions.fixedCostVolatility, random),
    )
    const simulatedVariableCosts = Math.max(
      0,
      randomNormal(baseVariableCosts, baseVariableCosts * assumptions.variableCostVolatility, random),
    )
    const simulatedTotalCosts = simulatedFixedCosts + simulatedVariableCosts
    const simulatedProfit = simulatedRevenue - simulatedTotalCosts
    const simulatedROI = simulatedTotalCosts > 0 ? (simulatedProfit / simulatedTotalCosts) * 100 : 0

    profits.push(simulatedProfit)
    returns.push(simulatedROI)
    if (simulatedProfit > 0) profitableScenarios += 1
  }

  profits.sort((first, second) => first - second)
  returns.sort((first, second) => first - second)

  const meanProfit = average(profits)
  const probabilityOfProfit = (profitableScenarios / assumptions.iterations) * 100

  return {
    p10: percentile(profits, 0.1),
    p50: percentile(profits, 0.5),
    p90: percentile(profits, 0.9),
    roiP10: percentile(returns, 0.1),
    roiP50: percentile(returns, 0.5),
    roiP90: percentile(returns, 0.9),
    baseProfit,
    baseROI,
    meanProfit,
    meanROI: average(returns),
    profitStdDev: standardDeviation(profits, meanProfit),
    probabilityOfProfit,
    probabilityOfLoss: 100 - probabilityOfProfit,
    breakEvenRevenue: baseTotalCosts,
    minProfit: profits[0],
    maxProfit: profits[profits.length - 1],
    histogram: createHistogram(profits),
    iterations: assumptions.iterations,
    seed,
  }
}
