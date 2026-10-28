import { Investment, Cost, Revenue, CapitalContribution } from '@prisma/client'

export type InvestmentWithDetails = Investment & {
  costs: Cost[]
  revenues: Revenue[]
  capitalContributions: CapitalContribution[]
}

export type CashFlowEntry = {
  dateKey: string;
  capitalContributions: number;
  revenue: number;
  fixedCosts: number;
  variableCosts: number;
  netCashFlow: number;
  cumulativeCashFlow: number;
}

export type CostBreakdown = {
  label: string
  projected: number
  actual: number
  variance: number
}

export type CostSummary = {
  totalPlanned: number
  pendingPlanned: number
  recordedCount: number
  pendingCount: number
  projected: number
  actual: number
  variance: number
  variancePercentage: number | null
  fixed: CostBreakdown
  variable: CostBreakdown
  categories: CostBreakdown[]
  months: CostBreakdown[]
}

/** Zero actual amount means the cost has not been accounted for yet. */
export function isRecordedCost(cost: Cost): boolean {
  return cost.actualAmount > 0
}

/** Compare only accounted costs against their own planned amounts. */
export function summarizeCosts(costs: Cost[]): CostSummary {
  const fixed = { label: 'Fixed costs', projected: 0, actual: 0, variance: 0 }
  const variable = { label: 'Variable costs', projected: 0, actual: 0, variance: 0 }
  const categories = new Map<string, CostBreakdown>()
  const months = new Map<string, CostBreakdown>()
  let totalPlanned = 0
  let pendingPlanned = 0
  let pendingCount = 0

  for (const cost of costs) {
    totalPlanned += cost.projectedAmount
    if (!isRecordedCost(cost)) {
      pendingPlanned += cost.projectedAmount
      pendingCount += 1
      continue
    }
    const type = cost.costType === 'FIXED' ? fixed : variable
    const category = categories.get(cost.category) ?? { label: cost.category, projected: 0, actual: 0, variance: 0 }
    const monthKey = new Date(cost.date).toISOString().slice(0, 7)
    const month = months.get(monthKey) ?? { label: monthKey, projected: 0, actual: 0, variance: 0 }
    for (const item of [type, category, month]) {
      item.projected += cost.projectedAmount
      item.actual += cost.actualAmount
      item.variance = item.actual - item.projected
    }
    categories.set(cost.category, category)
    months.set(monthKey, month)
  }

  const projected = fixed.projected + variable.projected
  const actual = fixed.actual + variable.actual
  return {
    totalPlanned,
    pendingPlanned,
    recordedCount: costs.length - pendingCount,
    pendingCount,
    projected,
    actual,
    variance: actual - projected,
    variancePercentage: projected > 0 ? ((actual - projected) / projected) * 100 : null,
    fixed,
    variable,
    categories: [...categories.values()].sort((a, b) => b.actual - a.actual || a.label.localeCompare(b.label)),
    months: [...months.values()].sort((a, b) => a.label.localeCompare(b.label)),
  }
}

export function isRecordedRevenue(revenue: Revenue): boolean {
  return revenue.actualAmount > 0
}

export type Forecast = {
  /** Cash already spent (recorded actual costs). */
  costsPaid: number
  /** Planned costs still to be paid. */
  costsRemaining: number
  /** Estimated cost at completion = paid + remaining. Also the break-even sale price. */
  estimatedCost: number
  /** Revenue already received. */
  revenueReceived: number
  /** Planned revenue still to be received. */
  revenueRemaining: number
  expectedRevenue: number
  expectedProfit: number
  /** Expected profit / estimated cost, in %. Null when there is no cost. */
  expectedROI: number | null
  /** (expected revenue - break-even) / expected revenue, in %. How far revenue can fall before losing money. */
  safetyMargin: number | null
  /** True when every revenue and cost line has been realised. */
  isRealised: boolean
}

/**
 * Investor view: realised amounts are facts, everything not yet realised uses the plan.
 * Avoids the misleading "actual profit" of an asset that was bought but not yet sold.
 */
export function calculateForecast(revenues: Revenue[], costs: Cost[]): Forecast {
  const costsPaid = costs.filter(isRecordedCost).reduce((s, c) => s + c.actualAmount, 0)
  const costsRemaining = costs.filter(c => !isRecordedCost(c)).reduce((s, c) => s + c.projectedAmount, 0)
  const revenueReceived = revenues.filter(isRecordedRevenue).reduce((s, r) => s + r.actualAmount, 0)
  const revenueRemaining = revenues.filter(r => !isRecordedRevenue(r)).reduce((s, r) => s + r.projectedAmount, 0)
  const estimatedCost = costsPaid + costsRemaining
  const expectedRevenue = revenueReceived + revenueRemaining
  const expectedProfit = expectedRevenue - estimatedCost
  return {
    costsPaid,
    costsRemaining,
    estimatedCost,
    revenueReceived,
    revenueRemaining,
    expectedRevenue,
    expectedProfit,
    expectedROI: estimatedCost > 0 ? (expectedProfit / estimatedCost) * 100 : null,
    safetyMargin: expectedRevenue > 0 ? ((expectedRevenue - estimatedCost) / expectedRevenue) * 100 : null,
    isRealised: costsRemaining === 0 && revenueRemaining === 0 && (costsPaid > 0 || revenueReceived > 0),
  }
}

export function calculateTotalInvestedCapital(initialInvestment: number, contributions: CapitalContribution[]): number {
  return initialInvestment + contributions.reduce((sum, c) => sum + c.amount, 0);
}

export function calculateProjectedRevenue(revenues: Revenue[]): number {
  return revenues.reduce((sum, r) => sum + r.projectedAmount, 0);
}

export function calculateActualRevenue(revenues: Revenue[]): number {
  return revenues.reduce((sum, r) => sum + r.actualAmount, 0);
}

export function calculateProjectedFixedCosts(costs: Cost[]): number {
  return costs.filter(c => c.costType === 'FIXED').reduce((sum, c) => sum + c.projectedAmount, 0);
}

export function calculateActualFixedCosts(costs: Cost[]): number {
  return costs.filter(c => c.costType === 'FIXED' && isRecordedCost(c)).reduce((sum, c) => sum + c.actualAmount, 0);
}

export function calculateProjectedVariableCosts(costs: Cost[]): number {
  return costs.filter(c => c.costType === 'VARIABLE').reduce((sum, c) => sum + c.projectedAmount, 0);
}

export function calculateActualVariableCosts(costs: Cost[]): number {
  return costs.filter(c => c.costType === 'VARIABLE' && isRecordedCost(c)).reduce((sum, c) => sum + c.actualAmount, 0);
}

export function calculateProjectedCosts(costs: Cost[]): number {
  return calculateProjectedFixedCosts(costs) + calculateProjectedVariableCosts(costs);
}

export function calculateActualCosts(costs: Cost[]): number {
  return calculateActualFixedCosts(costs) + calculateActualVariableCosts(costs);
}

export function calculateProjectedProfit(revenues: Revenue[], costs: Cost[]): number {
  return calculateProjectedRevenue(revenues) - calculateProjectedCosts(costs);
}

export function calculateActualProfit(revenues: Revenue[], costs: Cost[]): number {
  return calculateActualRevenue(revenues) - calculateActualCosts(costs);
}

export function calculateProjectedROI(revenues: Revenue[], costs: Cost[]): number {
  const totalCosts = calculateProjectedCosts(costs);
  if (totalCosts === 0) return 0;
  const profit = calculateProjectedProfit(revenues, costs);
  return (profit / totalCosts) * 100;
}

export function calculateActualROI(revenues: Revenue[], costs: Cost[]): number {
  const totalCosts = calculateActualCosts(costs);
  if (totalCosts === 0) return 0;
  const profit = calculateActualProfit(revenues, costs);
  return (profit / totalCosts) * 100;
}

export function calculateVariance(projected: number, actual: number): { value: number, percentage: number } {
  const value = actual - projected;
  const percentage = projected === 0 ? 0 : ((actual - projected) / projected) * 100;
  return { value, percentage };
}

export function calculatePortfolioROI(investments: InvestmentWithDetails[]): { projectedROI: number, actualROI: number } {
  let totalActProfit = 0;
  let totalProjProfit = 0;
  let totalProjCosts = 0;
  let totalActCosts = 0;
  for (const inv of investments) {
    totalActProfit += calculateActualProfit(inv.revenues, inv.costs);
    totalProjProfit += calculateProjectedProfit(inv.revenues, inv.costs);
    totalProjCosts += calculateProjectedCosts(inv.costs);
    totalActCosts += calculateActualCosts(inv.costs);
  }
  
  return {
    projectedROI: totalProjCosts > 0 ? (totalProjProfit / totalProjCosts) * 100 : 0,
    actualROI: totalActCosts > 0 ? (totalActProfit / totalActCosts) * 100 : 0
  };
}

export function calculateCashFlow(investment: InvestmentWithDetails): CashFlowEntry[] {
  const map = new Map<string, Omit<CashFlowEntry, 'cumulativeCashFlow' | 'dateKey'>>();
  
  const getEntry = (date: Date) => {
    const key = date.toISOString().slice(0, 7); // YYYY-MM
    if (!map.has(key)) {
      map.set(key, { capitalContributions: 0, revenue: 0, fixedCosts: 0, variableCosts: 0, netCashFlow: 0 });
    }
    return map.get(key)!;
  };
  
  if (investment.startDate) {
    const entry = getEntry(new Date(investment.startDate));
    entry.capitalContributions += investment.initialInvestment;
  }
  
  for (const c of investment.capitalContributions) {
    const entry = getEntry(new Date(c.date));
    entry.capitalContributions += c.amount;
  }
  
  for (const r of investment.revenues) {
    const entry = getEntry(new Date(r.date));
    entry.revenue += r.actualAmount;
  }
  
  for (const c of investment.costs) {
    if (!isRecordedCost(c)) continue;
    const entry = getEntry(new Date(c.date));
    if (c.costType === 'FIXED') {
      entry.fixedCosts += c.actualAmount;
    } else {
      entry.variableCosts += c.actualAmount;
    }
  }
  
  const sortedKeys = Array.from(map.keys()).sort();
  const result: CashFlowEntry[] = [];
  let cumulative = 0;
  
  for (const key of sortedKeys) {
    const val = map.get(key)!;
    // Assuming outlays (capital + costs) reduce cash flow and revenues increase it.
    val.netCashFlow = val.revenue - val.fixedCosts - val.variableCosts - val.capitalContributions;
    
    cumulative += val.netCashFlow;
    
    result.push({
      dateKey: key,
      ...val,
      cumulativeCashFlow: cumulative
    });
  }
  
  return result;
}
