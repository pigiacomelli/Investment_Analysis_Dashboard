'use client';

import { useState } from 'react';
import { InvestmentWithDetails, calculateProjectedProfit, calculateActualProfit, calculateActualROI, calculateProjectedROI, calculateProjectedRevenue, calculateActualRevenue, calculateProjectedCosts, calculateActualCosts, summarizeCosts, isRecordedCost, calculateForecast } from '@/lib/finance';
import { formatCurrency, formatPercentage, formatDate } from '@/lib/utils/format';
import { createCost, deleteCost, updateCost, createRevenue, deleteRevenue, updateRevenue, updateInvestment } from '@/lib/actions';
import { cn } from '@/lib/utils';
import { Trash2, Edit2, X, Save, TrendingUp, TrendingDown, DollarSign, Activity, type LucideIcon } from 'lucide-react';
import { MonteCarloSimulation } from './MonteCarloSimulation';
import { CostAnalysis } from './CostAnalysis';

type Trend = 'up' | 'down' | 'neutral';

interface KpiCardProps {
  title: string;
  value: string;
  subtext?: string;
  description?: string;
  icon: LucideIcon;
  trend?: Trend;
}

function KpiCard({ title, value, subtext, description, icon: Icon, trend = 'neutral' }: KpiCardProps) {
  return (
    <div className="bg-card border border-border p-5 rounded-xl shadow-sm flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <h3 className="text-2xl font-bold mt-2">{value}</h3>
        {subtext && (
          <p className={cn("text-xs font-medium mt-1", trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-red-500' : 'text-muted-foreground')}>
            {subtext}
          </p>
        )}
        {description && (
          <p className="text-[10px] font-mono mt-2 bg-muted/50 p-1.5 rounded-md text-muted-foreground border border-border/50">
            {description}
          </p>
        )}
      </div>
      <div className={cn("p-2 rounded-lg", trend === 'up' ? 'bg-emerald-500/10 text-emerald-500' : trend === 'down' ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary')}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
}

export function ExcelDashboard({ investment }: { investment: InvestmentWithDetails }) {
  const { revenues, costs, currency } = investment;
  const fixedCosts = costs.filter(c => c.costType === 'FIXED');
  const variableCosts = costs.filter(c => c.costType === 'VARIABLE');

  const projProfit = calculateProjectedProfit(revenues, costs);
  const actProfit = calculateActualProfit(revenues, costs);
  const variance = actProfit - projProfit;
  
  const projRev = calculateProjectedRevenue(revenues);
  const actRev = calculateActualRevenue(revenues);
  const projCosts = calculateProjectedCosts(costs);
  const actCosts = calculateActualCosts(costs);
  const costSummary = summarizeCosts(costs);
  const forecast = calculateForecast(revenues, costs);

  const projROI = calculateProjectedROI(revenues, costs);
  const actROI = calculateActualROI(revenues, costs);
  const costVariance = costSummary.variance;
  const revenueVariance = actRev - projRev;
  const actualMargin = actRev > 0 ? (actProfit / actRev) * 100 : null;

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'costs' | 'entries' | 'risk'>('overview');

  const handleUpdateProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    // Include required fields that aren't in the inline form
    formData.append('status', investment.status);
    await updateInvestment(investment.id, formData);
    setIsEditingProject(false);
  };

  // Form Handlers
  const handleAddRevenue = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await createRevenue(investment.id, formData);
    (e.target as HTMLFormElement).reset();
  };

  const handleUpdateRevenue = async (e: React.FormEvent<HTMLFormElement>, id: string) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await updateRevenue(id, investment.id, formData);
    setEditingId(null);
  };

  const handleAddCost = async (e: React.FormEvent<HTMLFormElement>, type: 'FIXED' | 'VARIABLE') => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.append('costType', type);
    await createCost(investment.id, formData);
    (e.target as HTMLFormElement).reset();
  };

  const handleUpdateCost = async (e: React.FormEvent<HTMLFormElement>, id: string, type: 'FIXED' | 'VARIABLE') => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.append('costType', type);
    await updateCost(id, investment.id, formData);
    setEditingId(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col gap-4">
        {isEditingProject ? (
          <form onSubmit={handleUpdateProject} className="flex flex-1 flex-wrap gap-2">
            <input name="name" required defaultValue={investment.name} className="flex-1 px-3 py-2 bg-background border border-input rounded-md font-bold text-xl" />
            <select name="category" required defaultValue={investment.category} className="px-3 py-2 bg-background border border-input rounded-md">
              <option value="Business">Business</option>
              <option value="Startup">Startup</option>
              <option value="Real Estate">Real Estate</option>
              <option value="Stock Investment">Stock Investment</option>
              <option value="Private Investment">Private Investment</option>
              <option value="Software Project">Software Project</option>
              <option value="Other">Other</option>
            </select>
            <select name="currency" required defaultValue={investment.currency} className="px-3 py-2 bg-background border border-input rounded-md">
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="BRL">BRL (R$)</option>
              <option value="GBP">GBP (£)</option>
            </select>
            <input
              type="number"
              min="0"
              step="0.01"
              name="initialInvestment"
              required
              aria-label="Initial capital"
              title="Initial capital"
              defaultValue={investment.initialInvestment}
              className="w-36 rounded-md border border-input bg-background px-3 py-2"
            />
            <input type="date" name="startDate" required defaultValue={new Date(investment.startDate).toISOString().split('T')[0]} className="px-3 py-2 bg-background border border-input rounded-md" />
            <div className="flex items-center gap-1 ml-2">
              <button type="submit" className="p-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"><Save className="w-4 h-4" /></button>
              <button type="button" onClick={() => setIsEditingProject(false)} className="p-2 border border-input text-muted-foreground rounded-md hover:bg-muted"><X className="w-4 h-4" /></button>
            </div>
          </form>
        ) : (
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2 group">
              {investment.name}
              <button onClick={() => setIsEditingProject(true)} aria-label="Edit project" className="text-muted-foreground hover:text-primary transition-all p-1">
                <Edit2 className="w-4 h-4" />
              </button>
            </h1>
            <p className="text-muted-foreground">
              {investment.category} • {investment.currency} • Initial capital {formatCurrency(investment.initialInvestment, currency)} • Started {formatDate(investment.startDate)}
            </p>
          </div>
        )}
        
      </div>

      <nav aria-label="Project sections" className="flex flex-wrap gap-1 rounded-xl border border-border bg-card p-1.5">
        {([
          ['overview', 'Overview'],
          ['costs', 'Planned vs Actual Costs'],
          ['entries', 'Entries'],
          ['risk', 'Risk Simulation'],
        ] as const).map(([tab, label]) => (
          <button key={tab} type="button" onClick={() => setActiveTab(tab)} aria-current={activeTab === tab ? 'page' : undefined} className={cn('rounded-lg px-4 py-2 text-sm font-medium transition-colors', activeTab === tab ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}>
            {label}
          </button>
        ))}
      </nav>

      {activeTab === 'overview' && <>
      {/* Investor view: realised amounts are facts, the rest follows the plan */}
      <div>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Investor view · forecast at completion</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Expected Profit"
            value={formatCurrency(forecast.expectedProfit, currency)}
            description={`${formatCurrency(forecast.expectedRevenue, currency)} revenue - ${formatCurrency(forecast.estimatedCost, currency)} cost`}
            subtext={forecast.revenueRemaining > 0 ? 'Sale not yet realised' : forecast.isRealised ? 'Fully realised' : undefined}
            trend={forecast.expectedProfit > 0 ? 'up' : forecast.expectedProfit < 0 ? 'down' : 'neutral'}
            icon={Activity}
          />
          <KpiCard
            title="Expected ROI"
            value={forecast.expectedROI === null ? '—' : formatPercentage(forecast.expectedROI)}
            description="Expected profit / total cost at completion"
            trend={forecast.expectedROI === null ? 'neutral' : forecast.expectedROI > 0 ? 'up' : 'down'}
            icon={TrendingUp}
          />
          <KpiCard
            title="Break-even Revenue"
            value={formatCurrency(forecast.estimatedCost, currency)}
            description="Minimum revenue to avoid a loss"
            subtext={forecast.safetyMargin === null ? undefined : `${formatPercentage(forecast.safetyMargin)} safety margin vs expected revenue`}
            trend={forecast.safetyMargin === null ? 'neutral' : forecast.safetyMargin >= 10 ? 'up' : 'down'}
            icon={DollarSign}
          />
          <KpiCard
            title="Cash Deployed"
            value={formatCurrency(forecast.costsPaid, currency)}
            description={`${formatCurrency(forecast.costsRemaining, currency)} still to pay`}
            subtext={forecast.revenueReceived > 0 ? `${formatCurrency(forecast.revenueReceived, currency)} already received` : 'No revenue received yet'}
            icon={TrendingDown}
          />
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard 
          title="Projected Profit" 
          value={formatCurrency(projProfit, currency)} 
          description={`${formatCurrency(projRev, currency)} - ${formatCurrency(projCosts, currency)}`}
          icon={Activity} 
        />
        <KpiCard 
          title="Actual Profit" 
          value={formatCurrency(actProfit, currency)} 
          subtext={costSummary.pendingCount > 0 ? `${costSummary.pendingCount} costs pending; profit comparison incomplete` : `${variance > 0 ? '+' : ''}${formatCurrency(variance, currency)} Variance`}
          description={`${formatCurrency(actRev, currency)} - ${formatCurrency(actCosts, currency)}`}
          trend={costSummary.pendingCount > 0 ? 'neutral' : variance > 0 ? 'up' : variance < 0 ? 'down' : 'neutral'}
          icon={DollarSign} 
        />
        <KpiCard 
          title="Projected ROI" 
          value={projCosts > 0 ? formatPercentage(projROI) : '—'}
          description={projCosts > 0 ? `${formatCurrency(projProfit, currency)} / ${formatCurrency(projCosts, currency)}` : 'Add planned costs to calculate'}
          icon={TrendingUp} 
        />
        <KpiCard 
          title="Actual ROI" 
          value={actCosts > 0 ? formatPercentage(actROI) : '—'}
          subtext={costSummary.pendingCount > 0 ? 'Partial costs recorded' : actCosts > 0 && projCosts > 0 ? `${(actROI - projROI).toFixed(2)} percentage points vs planned` : 'Record costs to calculate'}
          description={actCosts > 0 ? `${formatCurrency(actProfit, currency)} / ${formatCurrency(actCosts, currency)}` : undefined}
          trend={costSummary.pendingCount > 0 ? 'neutral' : actROI > projROI ? 'up' : actROI < projROI ? 'down' : 'neutral'}
          icon={actROI > projROI ? TrendingUp : TrendingDown} 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard title="Revenue Variance" value={`${revenueVariance > 0 ? '+' : ''}${formatCurrency(revenueVariance, currency)}`} subtext={`${formatCurrency(actRev, currency)} actual vs ${formatCurrency(projRev, currency)} planned`} trend={revenueVariance > 0 ? 'up' : revenueVariance < 0 ? 'down' : 'neutral'} icon={TrendingUp} />
        <KpiCard title="Cost Variance" value={costSummary.recordedCount ? `${costVariance > 0 ? '+' : ''}${formatCurrency(costVariance, currency)}` : 'None'} subtext={`${costSummary.recordedCount} recorded; ${costSummary.pendingCount} pending`} trend={costSummary.recordedCount === 0 ? 'neutral' : costVariance < 0 ? 'up' : costVariance > 0 ? 'down' : 'neutral'} icon={TrendingDown} />
        <KpiCard title="Actual Profit Margin" value={actualMargin === null ? '—' : formatPercentage(actualMargin)} subtext={actualMargin === null ? 'Record revenue to calculate' : 'Actual profit / actual revenue'} trend={actualMargin === null ? 'neutral' : actualMargin >= 0 ? 'up' : 'down'} icon={Activity} />
      </div>
      <p className="text-xs text-muted-foreground">Actual costs of zero are shown as None and excluded from recorded comparisons. The full plan still includes them.</p>
      </>}

      {activeTab === 'costs' && <CostAnalysis costs={costs} currency={currency} />}

      {activeTab === 'entries' && <>
      {/* Data Grid Section */}
      <div className="space-y-6">
        
        {/* REVENUES GRID */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/30">
            <h3 className="font-semibold text-lg text-emerald-500 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" /> Revenues
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm text-left">
              <thead className="text-xs uppercase text-muted-foreground bg-muted/50">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium text-right">Projected</th>
                  <th className="px-4 py-3 font-medium text-right">Actual</th>
                  <th className="px-4 py-3 font-medium text-center w-24">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {revenues.map(rev => editingId === rev.id ? (
                  <tr key={rev.id} className="bg-muted/30">
                    <td colSpan={6} className="p-0">
                      <form onSubmit={(e) => handleUpdateRevenue(e, rev.id)} className="flex w-full">
                        <div className="flex-1 grid grid-cols-5 divide-x divide-border">
                          <input name="name" required defaultValue={rev.name} className="px-4 py-3 bg-transparent border-none outline-none text-sm focus:bg-background transition-colors" />
                          <input name="category" required defaultValue={rev.category} className="px-4 py-3 bg-transparent border-none outline-none text-sm focus:bg-background transition-colors" />
                          <input type="date" name="date" required defaultValue={new Date(rev.date).toISOString().split('T')[0]} className="px-4 py-3 bg-transparent border-none outline-none text-sm text-muted-foreground focus:bg-background transition-colors" />
                          <input type="number" step="0.01" name="projectedAmount" required defaultValue={rev.projectedAmount} className="px-4 py-3 bg-transparent border-none outline-none text-sm text-right focus:bg-background transition-colors" />
                          <input type="number" step="0.01" name="actualAmount" defaultValue={rev.actualAmount || ''} className="px-4 py-3 bg-transparent border-none outline-none text-sm text-right focus:bg-background transition-colors" />
                        </div>
                        <div className="flex w-24 border-l border-border">
                          <button type="button" onClick={() => setEditingId(null)} className="flex-1 flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"><X className="w-4 h-4" /></button>
                          <button type="submit" className="flex-1 flex items-center justify-center text-emerald-500 hover:bg-emerald-500/10 transition-colors border-l border-border"><Save className="w-4 h-4" /></button>
                        </div>
                      </form>
                    </td>
                  </tr>
                ) : (
                  <tr key={rev.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-4 py-3 font-medium">{rev.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{rev.category}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(rev.date)}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(rev.projectedAmount, currency)}</td>
                    <td className="px-4 py-3 text-right font-medium text-emerald-500">{formatCurrency(rev.actualAmount || 0, currency)}</td>
                    <td className="px-4 py-3 text-center flex justify-center gap-1">
                      <button aria-label={`Edit ${rev.name}`} onClick={() => setEditingId(rev.id)} className="text-blue-500 hover:bg-blue-500/10 p-1.5 rounded transition-all"><Edit2 className="w-4 h-4" /></button>
                      <button aria-label={`Delete ${rev.name}`} onClick={() => deleteRevenue(rev.id, investment.id)} className="text-destructive hover:bg-destructive/10 p-1.5 rounded transition-all"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
                
                {/* INLINE ADD REVENUE ROW */}
                <tr className="bg-muted/10">
                  <td colSpan={6} className="p-0">
                    <form onSubmit={handleAddRevenue} className="flex w-full">
                      <div className="flex-1 grid grid-cols-5 divide-x divide-border">
                        <input name="name" required placeholder="New Revenue..." className="px-4 py-3 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground/50 focus:bg-background transition-colors" />
                        <input name="category" required placeholder="Category" className="px-4 py-3 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground/50 focus:bg-background transition-colors" />
                        <input type="date" name="date" required defaultValue={new Date().toISOString().split('T')[0]} className="px-4 py-3 bg-transparent border-none outline-none text-sm text-muted-foreground focus:bg-background transition-colors" />
                        <input type="number" step="0.01" name="projectedAmount" required placeholder="Proj $" className="px-4 py-3 bg-transparent border-none outline-none text-sm text-right focus:bg-background transition-colors" />
                        <input type="number" step="0.01" name="actualAmount" placeholder="Act $" className="px-4 py-3 bg-transparent border-none outline-none text-sm text-right focus:bg-background transition-colors" />
                      </div>
                      <button type="submit" className="px-6 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 font-medium text-sm flex items-center justify-center transition-colors border-l border-border w-24">
                        Add
                      </button>
                    </form>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FIXED COSTS GRID */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/30">
            <h3 className="font-semibold text-lg text-orange-500 flex items-center gap-2">
              <Activity className="w-5 h-5" /> Fixed Costs
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">Each row represents one dated occurrence; frequency is an informational label.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm text-left">
              <thead className="text-xs uppercase text-muted-foreground bg-muted/50">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Recurrence</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium text-right">Projected</th>
                  <th className="px-4 py-3 font-medium text-right">Actual</th>
                  <th className="px-4 py-3 font-medium text-center w-24">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {fixedCosts.map(cost => editingId === cost.id ? (
                  <tr key={cost.id} className="bg-muted/30">
                    <td colSpan={7} className="p-0">
                      <form onSubmit={(e) => handleUpdateCost(e, cost.id, 'FIXED')} className="flex w-full">
                        <div className="flex-1 grid grid-cols-6 divide-x divide-border">
                          <input name="name" required defaultValue={cost.name} className="px-4 py-3 bg-transparent border-none outline-none text-sm focus:bg-background transition-colors" />
                          <input name="category" required defaultValue={cost.category} className="px-4 py-3 bg-transparent border-none outline-none text-sm focus:bg-background transition-colors" />
                          <select name="recurrence" required defaultValue={cost.recurrence} className="px-4 py-3 bg-transparent border-none outline-none text-sm text-muted-foreground focus:bg-background transition-colors appearance-none">
                            <option value="MONTHLY">Monthly</option>
                            <option value="YEARLY">Yearly</option>
                            <option value="ONE_TIME">One Time</option>
                            <option value="WEEKLY">Weekly</option>
                            <option value="QUARTERLY">Quarterly</option>
                          </select>
                          <input type="date" name="date" required defaultValue={new Date(cost.date).toISOString().split('T')[0]} className="px-4 py-3 bg-transparent border-none outline-none text-sm text-muted-foreground focus:bg-background transition-colors" />
                          <input type="number" step="0.01" name="projectedAmount" required defaultValue={cost.projectedAmount} className="px-4 py-3 bg-transparent border-none outline-none text-sm text-right focus:bg-background transition-colors" />
                          <input type="number" min="0" step="0.01" name="actualAmount" defaultValue={isRecordedCost(cost) ? cost.actualAmount : ''} placeholder="None" aria-label={`Actual amount for ${cost.name}`} className="px-4 py-3 bg-transparent border-none outline-none text-sm text-right focus:bg-background transition-colors" />
                        </div>
                        <div className="flex w-24 border-l border-border">
                          <button type="button" onClick={() => setEditingId(null)} className="flex-1 flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"><X className="w-4 h-4" /></button>
                          <button type="submit" className="flex-1 flex items-center justify-center text-orange-500 hover:bg-orange-500/10 transition-colors border-l border-border"><Save className="w-4 h-4" /></button>
                        </div>
                      </form>
                    </td>
                  </tr>
                ) : (
                  <tr key={cost.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-4 py-3 font-medium">{cost.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{cost.category}</td>
                    <td className="px-4 py-3 text-muted-foreground">{cost.recurrence}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(cost.date)}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(cost.projectedAmount, currency)}</td>
                    <td className="px-4 py-3 text-right font-medium text-orange-500">{isRecordedCost(cost) ? formatCurrency(cost.actualAmount, currency) : 'None'}</td>
                    <td className="px-4 py-3 text-center flex justify-center gap-1">
                      <button aria-label={`Edit ${cost.name}`} onClick={() => setEditingId(cost.id)} className="text-blue-500 hover:bg-blue-500/10 p-1.5 rounded transition-all"><Edit2 className="w-4 h-4" /></button>
                      <button aria-label={`Delete ${cost.name}`} onClick={() => deleteCost(cost.id, investment.id)} className="text-destructive hover:bg-destructive/10 p-1.5 rounded transition-all"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
                
                {/* INLINE ADD COST ROW */}
                <tr className="bg-muted/10">
                  <td colSpan={7} className="p-0">
                    <form onSubmit={(e) => handleAddCost(e, 'FIXED')} className="flex w-full">
                      <div className="flex-1 grid grid-cols-6 divide-x divide-border">
                        <input name="name" required placeholder="New Fixed Cost..." className="px-4 py-3 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground/50 focus:bg-background transition-colors" />
                        <input name="category" required placeholder="Category" className="px-4 py-3 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground/50 focus:bg-background transition-colors" />
                        <select name="recurrence" required className="px-4 py-3 bg-transparent border-none outline-none text-sm text-muted-foreground focus:bg-background transition-colors appearance-none">
                          <option value="MONTHLY">Monthly</option>
                          <option value="YEARLY">Yearly</option>
                          <option value="ONE_TIME">One Time</option>
                          <option value="WEEKLY">Weekly</option>
                          <option value="QUARTERLY">Quarterly</option>
                        </select>
                        <input type="date" name="date" required defaultValue={new Date().toISOString().split('T')[0]} className="px-4 py-3 bg-transparent border-none outline-none text-sm text-muted-foreground focus:bg-background transition-colors" />
                        <input type="number" step="0.01" name="projectedAmount" required placeholder="Proj $" className="px-4 py-3 bg-transparent border-none outline-none text-sm text-right focus:bg-background transition-colors" />
                        <input type="number" min="0" step="0.01" name="actualAmount" placeholder="None" aria-label="Actual fixed cost" className="px-4 py-3 bg-transparent border-none outline-none text-sm text-right focus:bg-background transition-colors" />
                      </div>
                      <button type="submit" className="px-6 bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 font-medium text-sm flex items-center justify-center transition-colors border-l border-border w-24">
                        Add
                      </button>
                    </form>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* VARIABLE COSTS GRID */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/30">
            <h3 className="font-semibold text-lg text-red-500 flex items-center gap-2">
              <TrendingDown className="w-5 h-5" /> Variable Costs
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">Each row represents one dated occurrence; frequency is an informational label.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm text-left">
              <thead className="text-xs uppercase text-muted-foreground bg-muted/50">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Recurrence</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium text-right">Projected</th>
                  <th className="px-4 py-3 font-medium text-right">Actual</th>
                  <th className="px-4 py-3 font-medium text-center w-24">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {variableCosts.map(cost => editingId === cost.id ? (
                  <tr key={cost.id} className="bg-muted/30">
                    <td colSpan={7} className="p-0">
                      <form onSubmit={(e) => handleUpdateCost(e, cost.id, 'VARIABLE')} className="flex w-full">
                        <div className="flex-1 grid grid-cols-6 divide-x divide-border">
                          <input name="name" required defaultValue={cost.name} className="px-4 py-3 bg-transparent border-none outline-none text-sm focus:bg-background transition-colors" />
                          <input name="category" required defaultValue={cost.category} className="px-4 py-3 bg-transparent border-none outline-none text-sm focus:bg-background transition-colors" />
                          <select name="recurrence" required defaultValue={cost.recurrence} className="px-4 py-3 bg-transparent border-none outline-none text-sm text-muted-foreground focus:bg-background transition-colors appearance-none">
                            <option value="ONE_TIME">One Time</option>
                            <option value="MONTHLY">Monthly</option>
                            <option value="YEARLY">Yearly</option>
                            <option value="WEEKLY">Weekly</option>
                            <option value="QUARTERLY">Quarterly</option>
                          </select>
                          <input type="date" name="date" required defaultValue={new Date(cost.date).toISOString().split('T')[0]} className="px-4 py-3 bg-transparent border-none outline-none text-sm text-muted-foreground focus:bg-background transition-colors" />
                          <input type="number" step="0.01" name="projectedAmount" required defaultValue={cost.projectedAmount} className="px-4 py-3 bg-transparent border-none outline-none text-sm text-right focus:bg-background transition-colors" />
                          <input type="number" min="0" step="0.01" name="actualAmount" defaultValue={isRecordedCost(cost) ? cost.actualAmount : ''} placeholder="None" aria-label={`Actual amount for ${cost.name}`} className="px-4 py-3 bg-transparent border-none outline-none text-sm text-right focus:bg-background transition-colors" />
                        </div>
                        <div className="flex w-24 border-l border-border">
                          <button type="button" onClick={() => setEditingId(null)} className="flex-1 flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"><X className="w-4 h-4" /></button>
                          <button type="submit" className="flex-1 flex items-center justify-center text-red-500 hover:bg-red-500/10 transition-colors border-l border-border"><Save className="w-4 h-4" /></button>
                        </div>
                      </form>
                    </td>
                  </tr>
                ) : (
                  <tr key={cost.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-4 py-3 font-medium">{cost.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{cost.category}</td>
                    <td className="px-4 py-3 text-muted-foreground">{cost.recurrence}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(cost.date)}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(cost.projectedAmount, currency)}</td>
                    <td className="px-4 py-3 text-right font-medium text-red-500">{isRecordedCost(cost) ? formatCurrency(cost.actualAmount, currency) : 'None'}</td>
                    <td className="px-4 py-3 text-center flex justify-center gap-1">
                      <button aria-label={`Edit ${cost.name}`} onClick={() => setEditingId(cost.id)} className="text-blue-500 hover:bg-blue-500/10 p-1.5 rounded transition-all"><Edit2 className="w-4 h-4" /></button>
                      <button aria-label={`Delete ${cost.name}`} onClick={() => deleteCost(cost.id, investment.id)} className="text-destructive hover:bg-destructive/10 p-1.5 rounded transition-all"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
                
                {/* INLINE ADD COST ROW */}
                <tr className="bg-muted/10">
                  <td colSpan={7} className="p-0">
                    <form onSubmit={(e) => handleAddCost(e, 'VARIABLE')} className="flex w-full">
                      <div className="flex-1 grid grid-cols-6 divide-x divide-border">
                        <input name="name" required placeholder="New Variable Cost..." className="px-4 py-3 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground/50 focus:bg-background transition-colors" />
                        <input name="category" required placeholder="Category" className="px-4 py-3 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground/50 focus:bg-background transition-colors" />
                        <select name="recurrence" required className="px-4 py-3 bg-transparent border-none outline-none text-sm text-muted-foreground focus:bg-background transition-colors appearance-none">
                          <option value="ONE_TIME">One Time</option>
                          <option value="MONTHLY">Monthly</option>
                          <option value="YEARLY">Yearly</option>
                          <option value="WEEKLY">Weekly</option>
                          <option value="QUARTERLY">Quarterly</option>
                        </select>
                        <input type="date" name="date" required defaultValue={new Date().toISOString().split('T')[0]} className="px-4 py-3 bg-transparent border-none outline-none text-sm text-muted-foreground focus:bg-background transition-colors" />
                        <input type="number" step="0.01" name="projectedAmount" required placeholder="Proj $" className="px-4 py-3 bg-transparent border-none outline-none text-sm text-right focus:bg-background transition-colors" />
                        <input type="number" min="0" step="0.01" name="actualAmount" placeholder="None" aria-label="Actual variable cost" className="px-4 py-3 bg-transparent border-none outline-none text-sm text-right focus:bg-background transition-colors" />
                      </div>
                      <button type="submit" className="px-6 bg-red-500/10 text-red-500 hover:bg-red-500/20 font-medium text-sm flex items-center justify-center transition-colors border-l border-border w-24">
                        Add
                      </button>
                    </form>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      </>}

      {activeTab === 'risk' && <MonteCarloSimulation investment={investment} />}

    </div>
  );
}
