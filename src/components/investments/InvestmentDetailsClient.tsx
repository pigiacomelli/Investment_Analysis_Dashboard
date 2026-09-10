'use client';

import { useState } from 'react';
import { InvestmentWithDetails, calculateProjectedProfit, calculateActualROI, calculateProjectedROI, calculateCashFlow } from '@/lib/finance';
import { formatCurrency } from '@/lib/utils/format';
import { createCost, deleteCost, createRevenue, deleteRevenue } from '@/lib/actions';
import { cn } from '@/lib/utils';
import { Trash2, Plus } from 'lucide-react';

interface InvestmentDetailsClientProps {
  investment: InvestmentWithDetails;
}

export function InvestmentDetailsClient({ investment }: InvestmentDetailsClientProps) {
  const [activeTab, setActiveTab] = useState<'SUMMARY' | 'COSTS' | 'REVENUE' | 'CASH_FLOW'>('SUMMARY');
  const [showCostForm, setShowCostForm] = useState(false);
  const [showRevenueForm, setShowRevenueForm] = useState(false);

  const { revenues, costs, capitalContributions, initialInvestment, currency } = investment;

  const handleCreateCost = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await createCost(investment.id, formData);
    setShowCostForm(false);
    (e.target as HTMLFormElement).reset();
  };

  const handleCreateRevenue = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await createRevenue(investment.id, formData);
    setShowRevenueForm(false);
    (e.target as HTMLFormElement).reset();
  };

  const handleDeleteCost = async (id: string) => {
    await deleteCost(id, investment.id);
  };

  const handleDeleteRevenue = async (id: string) => {
    await deleteRevenue(id, investment.id);
  };

  const renderSummary = () => {
    const projRevenue = revenues.reduce((sum, r) => sum + r.projectedAmount, 0);
    const actRevenue = revenues.reduce((sum, r) => sum + (r.actualAmount || 0), 0);
    const revVariance = actRevenue - projRevenue;

    const projCosts = costs.reduce((sum, c) => sum + c.projectedAmount, 0);
    const actCosts = costs.reduce((sum, c) => sum + (c.actualAmount || 0), 0);
    const costVariance = actCosts - projCosts;

    const projProfit = calculateProjectedProfit(revenues, costs);
    const actProfit = actRevenue - actCosts;
    const profitVariance = actProfit - projProfit;

    const addCapital = capitalContributions.reduce((sum, c) => sum + c.amount, 0);
    const totalCapital = initialInvestment + addCapital;

    const actROI = calculateActualROI(initialInvestment, capitalContributions, revenues, costs);
    const projROI = calculateProjectedROI(initialInvestment, capitalContributions, revenues, costs);
    const roiVariance = actROI - projROI;

    const KpiCard = ({ title, value, variance, reverseColor = false }: { title: string, value: string, variance?: number, reverseColor?: boolean }) => {
      const isPositive = variance !== undefined && variance > 0;
      const isNegative = variance !== undefined && variance < 0;
      const goodPositive = !reverseColor;
      
      const varianceColor = variance === undefined || variance === 0
        ? 'text-slate-500' 
        : (isPositive && goodPositive) || (isNegative && !goodPositive)
          ? 'text-emerald-500'
          : 'text-red-500';

      return (
        <div className="bg-card p-4 rounded-lg border border-border flex flex-col justify-between">
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold">{value}</span>
            {variance !== undefined && (
              <span className={cn("text-xs font-medium", varianceColor)}>
                {variance > 0 ? '+' : ''}{formatCurrency(variance, currency)}
              </span>
            )}
          </div>
        </div>
      );
    };

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Initial Investment" value={formatCurrency(initialInvestment, currency)} />
        <KpiCard title="Additional Capital" value={formatCurrency(addCapital, currency)} />
        <KpiCard title="Total Capital" value={formatCurrency(totalCapital, currency)} />
        
        <KpiCard title="Proj. Revenue" value={formatCurrency(projRevenue, currency)} />
        <KpiCard title="Act. Revenue" value={formatCurrency(actRevenue, currency)} variance={revVariance} />
        <KpiCard title="Proj. Costs" value={formatCurrency(projCosts, currency)} />
        <KpiCard title="Act. Costs" value={formatCurrency(actCosts, currency)} variance={costVariance} reverseColor={true} />
        
        <KpiCard title="Proj. Profit" value={formatCurrency(projProfit, currency)} />
        <KpiCard title="Act. Profit" value={formatCurrency(actProfit, currency)} variance={profitVariance} />
        
        <KpiCard title="Proj. ROI" value={`${projROI.toFixed(2)}%`} />
        <KpiCard title="Act. ROI" value={`${actROI.toFixed(2)}%`} />
      </div>
    );
  };

  const renderCosts = () => {
    const fixedCosts = costs.filter(c => c.costType === 'FIXED');
    const varCosts = costs.filter(c => c.costType === 'VARIABLE');

    const CostTable = ({ title, data }: { title: string, data: typeof costs }) => {
      const projTotal = data.reduce((sum, c) => sum + c.projectedAmount, 0);
      const actTotal = data.reduce((sum, c) => sum + (c.actualAmount || 0), 0);
      
      return (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">{title}</h3>
          <div className="overflow-x-auto bg-white rounded-lg border border-slate-200 shadow-sm">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-right">Projected</th>
                  <th className="px-4 py-3 text-right">Actual</th>
                  <th className="px-4 py-3 text-right">Variance</th>
                  <th className="px-4 py-3">Recurrence</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {data.map(cost => {
                  const act = cost.actualAmount || 0;
                  const variance = act - cost.projectedAmount;
                  return (
                    <tr key={cost.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-800">{cost.name}</td>
                      <td className="px-4 py-3 text-slate-600">{cost.category}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(cost.projectedAmount, currency)}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(act, currency)}</td>
                      <td className={cn("px-4 py-3 text-right font-medium", variance < 0 ? 'text-emerald-500' : variance > 0 ? 'text-red-500' : 'text-slate-500')}>
                        {variance > 0 ? '+' : ''}{formatCurrency(variance, currency)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{cost.recurrence}</td>
                      <td className="px-4 py-3 text-slate-600">{new Date(cost.date).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => handleDeleteCost(cost.id)} className="text-slate-400 hover:text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot className="bg-slate-50 border-t border-slate-200 font-semibold text-slate-800">
                <tr>
                  <td colSpan={2} className="px-4 py-3 text-right">Totals:</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(projTotal, currency)}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(actTotal, currency)}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(actTotal - projTotal, currency)}</td>
                  <td colSpan={3}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-end">
          <button 
            onClick={() => setShowCostForm(!showCostForm)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Add Cost
          </button>
        </div>
        
        {showCostForm && (
          <form onSubmit={handleCreateCost} className="bg-slate-50 p-4 rounded-lg border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div><label className="text-xs font-medium text-slate-700 mb-1 block">Name</label><input name="name" required className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" /></div>
            <div><label className="text-xs font-medium text-slate-700 mb-1 block">Category</label><input name="category" required className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" /></div>
            <div>
              <label className="text-xs font-medium text-slate-700 mb-1 block">Type</label>
              <select name="costType" required className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm">
                <option value="FIXED">Fixed</option>
                <option value="VARIABLE">Variable</option>
              </select>
            </div>
            <div><label className="text-xs font-medium text-slate-700 mb-1 block">Projected Amount</label><input type="number" step="0.01" name="projectedAmount" required className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" /></div>
            <div><label className="text-xs font-medium text-slate-700 mb-1 block">Actual Amount</label><input type="number" step="0.01" name="actualAmount" className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" /></div>
            <div>
              <label className="text-xs font-medium text-slate-700 mb-1 block">Recurrence</label>
              <select name="recurrence" required className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm">
                <option value="ONETIME">One-time</option>
                <option value="MONTHLY">Monthly</option>
                <option value="YEARLY">Yearly</option>
              </select>
            </div>
            <div><label className="text-xs font-medium text-slate-700 mb-1 block">Date</label><input type="date" name="date" required className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" defaultValue={new Date().toISOString().split('T')[0]} /></div>
            <div>
              <button type="submit" className="w-full px-4 py-2 bg-slate-800 text-white rounded-md hover:bg-slate-900 text-sm font-medium">Save</button>
            </div>
          </form>
        )}

        <CostTable title="Fixed Costs" data={fixedCosts} />
        <CostTable title="Variable Costs" data={varCosts} />
      </div>
    );
  };

  const renderRevenue = () => {
    const projTotal = revenues.reduce((sum, r) => sum + r.projectedAmount, 0);
    const actTotal = revenues.reduce((sum, r) => sum + (r.actualAmount || 0), 0);

    return (
      <div className="space-y-6">
        <div className="flex justify-end">
          <button 
            onClick={() => setShowRevenueForm(!showRevenueForm)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Add Revenue
          </button>
        </div>
        
        {showRevenueForm && (
          <form onSubmit={handleCreateRevenue} className="bg-slate-50 p-4 rounded-lg border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div><label className="text-xs font-medium text-slate-700 mb-1 block">Name</label><input name="name" required className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" /></div>
            <div><label className="text-xs font-medium text-slate-700 mb-1 block">Category</label><input name="category" required className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" /></div>
            <div><label className="text-xs font-medium text-slate-700 mb-1 block">Projected Amount</label><input type="number" step="0.01" name="projectedAmount" required className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" /></div>
            <div><label className="text-xs font-medium text-slate-700 mb-1 block">Actual Amount</label><input type="number" step="0.01" name="actualAmount" className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" /></div>
            <div><label className="text-xs font-medium text-slate-700 mb-1 block">Date</label><input type="date" name="date" required className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" defaultValue={new Date().toISOString().split('T')[0]} /></div>
            <div className="md:col-start-4">
              <button type="submit" className="w-full px-4 py-2 bg-slate-800 text-white rounded-md hover:bg-slate-900 text-sm font-medium">Save</button>
            </div>
          </form>
        )}

        <div className="overflow-x-auto bg-white rounded-lg border border-slate-200 shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-right">Projected</th>
                <th className="px-4 py-3 text-right">Actual</th>
                <th className="px-4 py-3 text-right">Variance</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {revenues.map(rev => {
                const act = rev.actualAmount || 0;
                const variance = act - rev.projectedAmount;
                return (
                  <tr key={rev.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{rev.name}</td>
                    <td className="px-4 py-3 text-slate-600">{rev.category}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(rev.projectedAmount, currency)}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(act, currency)}</td>
                    <td className={cn("px-4 py-3 text-right font-medium", variance > 0 ? 'text-emerald-500' : variance < 0 ? 'text-red-500' : 'text-slate-500')}>
                      {variance > 0 ? '+' : ''}{formatCurrency(variance, currency)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{new Date(rev.date).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleDeleteRevenue(rev.id)} className="text-slate-400 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot className="bg-slate-50 border-t border-slate-200 font-semibold text-slate-800">
              <tr>
                <td colSpan={2} className="px-4 py-3 text-right">Totals:</td>
                <td className="px-4 py-3 text-right">{formatCurrency(projTotal, currency)}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(actTotal, currency)}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(actTotal - projTotal, currency)}</td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    );
  };

  const renderCashFlow = () => {
    const cashFlow = calculateCashFlow(investment);
    
    return (
      <div className="overflow-x-auto bg-white rounded-lg border border-slate-200 shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">Month</th>
              <th className="px-4 py-3 text-right">Capital Contributions</th>
              <th className="px-4 py-3 text-right">Revenue</th>
              <th className="px-4 py-3 text-right">Fixed Costs</th>
              <th className="px-4 py-3 text-right">Variable Costs</th>
              <th className="px-4 py-3 text-right">Net Cash Flow</th>
              <th className="px-4 py-3 text-right">Cumulative Cash Flow</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
              {cashFlow.map(cf => (
              <tr key={cf.dateKey} className="hover:bg-muted/50">
                <td className="px-4 py-3 font-medium">{cf.dateKey}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(cf.capitalContributions, currency)}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(cf.revenue, currency)}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(cf.fixedCosts, currency)}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(cf.variableCosts, currency)}</td>
                <td className={cn("px-4 py-3 text-right font-medium", cf.netCashFlow >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                  {formatCurrency(cf.netCashFlow, currency)}
                </td>
                <td className={cn("px-4 py-3 text-right font-semibold", cf.cumulativeCashFlow >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                  {formatCurrency(cf.cumulativeCashFlow, currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const tabs = [
    { id: 'SUMMARY', label: 'Summary' },
    { id: 'COSTS', label: 'Costs' },
    { id: 'REVENUE', label: 'Revenue' },
    { id: 'CASH_FLOW', label: 'Cash Flow' },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex border-b border-slate-200">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-6 py-3 text-sm font-medium border-b-2 transition-colors",
              activeTab === tab.id
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div>
        {activeTab === 'SUMMARY' && renderSummary()}
        {activeTab === 'COSTS' && renderCosts()}
        {activeTab === 'REVENUE' && renderRevenue()}
        {activeTab === 'CASH_FLOW' && renderCashFlow()}
      </div>
    </div>
  );
}
