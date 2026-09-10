import { InvestmentWithDetails, calculateActualFixedCosts, calculateProjectedFixedCosts, calculateProjectedRevenue, calculateProjectedVariableCosts, calculateTotalInvestedCapital } from './index';

// Generates a random number with a Normal (Gaussian) distribution using Box-Muller transform
function randomNormal(mean: number, stdDev: number): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random(); // Converting [0,1) to (0,1)
  while (v === 0) v = Math.random();
  let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  num = num / 10.0 + 0.5; // Translate to 0 -> 1
  if (num > 1 || num < 0) return randomNormal(mean, stdDev); // resample between 0 and 1
  num *= 10; // stretch to -5 -> 5
  return mean + (num - 5) * stdDev;
}

export interface MonteCarloResult {
  p10: number; // Pessimistic (90% chance of being better than this)
  p50: number; // Median
  p90: number; // Optimistic (10% chance of being better than this)
  histogram: { bin: string; count: number }[];
  iterations: number;
}

/**
 * Runs a Monte Carlo simulation on an investment project.
 * Fixed costs are kept constant.
 * Variable costs and revenues vary based on the provided volatility.
 * 
 * @param investment The investment details
 * @param volatility Percentage volatility (e.g., 0.20 for 20%)
 * @param iterations Number of simulation runs
 */
export function runMonteCarloSimulation(
  investment: InvestmentWithDetails,
  volatility: number = 0.20,
  iterations: number = 2000
): MonteCarloResult {
  const baseRevenue = calculateProjectedRevenue(investment.revenues);
  const baseVariableCosts = calculateProjectedVariableCosts(investment.costs);
  const fixedCosts = calculateProjectedFixedCosts(investment.costs); // kept constant
  
  // Standard deviation is based on volatility
  const revStdDev = baseRevenue * volatility;
  const varCostStdDev = baseVariableCosts * volatility;

  const results: number[] = [];

  for (let i = 0; i < iterations; i++) {
    // Generate randomized values
    // In business, revenues usually don't go below 0 (but they could be very low).
    const simRevenue = Math.max(0, randomNormal(baseRevenue, revStdDev));
    const simVariableCosts = Math.max(0, randomNormal(baseVariableCosts, varCostStdDev));
    
    const simProfit = simRevenue - fixedCosts - simVariableCosts;
    results.push(simProfit);
  }

  // Sort ascending
  results.sort((a, b) => a - b);

  // Percentiles
  const p10 = results[Math.floor(iterations * 0.10)];
  const p50 = results[Math.floor(iterations * 0.50)];
  const p90 = results[Math.floor(iterations * 0.90)];

  // Generate Histogram (20 bins)
  const min = results[0];
  const max = results[results.length - 1];
  const binSize = max > min ? (max - min) / 20 : 1;
  
  const histogramArray = Array.from({ length: 20 }, (_, i) => {
    const binStart = min + i * binSize;
    return {
      bin: binStart,
      count: 0
    };
  });

  for (const res of results) {
    let binIndex = Math.floor((res - min) / binSize);
    if (binIndex >= 20 || Number.isNaN(binIndex)) binIndex = 19; // Cap max value into last bin
    if (binIndex < 0) binIndex = 0;
    histogramArray[binIndex].count += 1;
  }

  const histogram = histogramArray.map(b => ({
    bin: b.bin.toFixed(0), // formatted as string for charts
    count: b.count
  }));

  return {
    p10,
    p50,
    p90,
    histogram,
    iterations
  };
}
