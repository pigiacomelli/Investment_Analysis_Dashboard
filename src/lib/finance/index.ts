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
  return costs.filter(c => c.costType === 'FIXED').reduce((sum, c) => sum + c.actualAmount, 0);
}

export function calculateProjectedVariableCosts(costs: Cost[]): number {
  return costs.filter(c => c.costType === 'VARIABLE').reduce((sum, c) => sum + c.projectedAmount, 0);
}

export function calculateActualVariableCosts(costs: Cost[]): number {
  return costs.filter(c => c.costType === 'VARIABLE').reduce((sum, c) => sum + c.actualAmount, 0);
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

export function calculateProjectedROI(initialInvestment: number, contributions: CapitalContribution[], revenues: Revenue[], costs: Cost[]): number {
  const totalCapital = calculateTotalInvestedCapital(initialInvestment, contributions);
  if (totalCapital === 0) return 0;
  const profit = calculateProjectedProfit(revenues, costs);
  return (profit / totalCapital) * 100;
}

export function calculateActualROI(initialInvestment: number, contributions: CapitalContribution[], revenues: Revenue[], costs: Cost[]): number {
  const totalCapital = calculateTotalInvestedCapital(initialInvestment, contributions);
  if (totalCapital === 0) return 0;
  const profit = calculateActualProfit(revenues, costs);
  return (profit / totalCapital) * 100;
}

export function calculateVariance(projected: number, actual: number): { value: number, percentage: number } {
  const value = actual - projected;
  const percentage = projected === 0 ? 0 : ((actual - projected) / projected) * 100;
  return { value, percentage };
}

export function calculatePortfolioROI(investments: InvestmentWithDetails[]): { projectedROI: number, actualROI: number } {
  let totalCapital = 0;
  let totalActProfit = 0;
  let totalProjProfit = 0;
  for (const inv of investments) {
    totalCapital += calculateTotalInvestedCapital(inv.initialInvestment, inv.capitalContributions);
    totalActProfit += calculateActualProfit(inv.revenues, inv.costs);
    totalProjProfit += calculateProjectedProfit(inv.revenues, inv.costs);
  }
  if (totalCapital === 0) return { projectedROI: 0, actualROI: 0 };
  return {
    projectedROI: (totalProjProfit / totalCapital) * 100,
    actualROI: (totalActProfit / totalCapital) * 100
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
