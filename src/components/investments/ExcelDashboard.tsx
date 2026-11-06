'use client';

import { useI18n } from '@/lib/i18n/client'

import { useState } from 'react';
import { type InvestmentWithDetails, isRecordedCost, isRecordedRevenue, summarizeProject, calculateCashFlow } from '@/lib/finance';
import { createCost, deleteCost, updateCost, createRevenue, deleteRevenue, updateRevenue, updateInvestment } from '@/lib/actions';
import { cn } from '@/lib/utils';
import { Trash2, Edit2, X, Save, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { MonteCarloSimulation } from './MonteCarloSimulation';
import { CostAnalysis } from './CostAnalysis';

import { MetricCard } from './MetricCard';
import { BenchmarkAnalysis, initialAnalysisInputs } from './BenchmarkAnalysis';
import { MetricsGuide } from './MetricsGuide';

export function ExcelDashboard({ investment }: { investment: InvestmentWithDetails }) {
  const { t, formatCurrency, formatPercentage, formatDate } = useI18n()
  const { revenues, costs, currency } = investment;
  const fixedCosts = costs.filter(c => c.costType === 'FIXED');
  const variableCosts = costs.filter(c => c.costType === 'VARIABLE');

  const summary = summarizeProject(investment);
  const { forecast, costSummary } = summary;
  const cashFlow = calculateCashFlow(investment);
  const [analysisInputs, setAnalysisInputs] = useState(() => initialAnalysisInputs(investment));
  const money = (value: number | null) => value === null ? '—' : formatCurrency(value, currency);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'costs' | 'entries' | 'risk' | 'guide'>('overview');

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
            <select name="category" required defaultValue={t(investment.category)} className="px-3 py-2 bg-background border border-input rounded-md">
              <option value="Business">{t("Business")}</option>
              <option value="Startup">{t("Startup")}</option>
              <option value="Real Estate">{t("Real Estate")}</option>
              <option value="Stock Investment">{t("Stock Investment")}</option>
              <option value="Private Investment">{t("Private Investment")}</option>
              <option value="Software Project">{t("Software Project")}</option>
              <option value="Other">{t("Other")}</option>
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
              aria-label={t("Initial capital")}
              title={t("Initial capital")}
              defaultValue={investment.initialInvestment}
              className="w-36 rounded-md border border-input bg-background px-3 py-2"
            />
            <input type="date" name="startDate" required defaultValue={new Date(investment.startDate).toISOString().split('T')[0]} className="px-3 py-2 bg-background border border-input rounded-md" />
            <div className="flex items-center gap-1 ml-2">
              <button aria-label={t("Save changes")} type="submit" className="p-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"><Save className="w-4 h-4" /></button>
              <button aria-label={t("Cancel editing")} type="button" onClick={() => setIsEditingProject(false)} className="p-2 border border-input text-muted-foreground rounded-md hover:bg-muted"><X className="w-4 h-4" /></button>
            </div>
          </form>
        ) : (
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2 group">
              {investment.name}
              <button onClick={() => setIsEditingProject(true)} aria-label={t("Edit project")} className="text-muted-foreground hover:text-primary transition-all p-1">
                <Edit2 className="w-4 h-4" />
              </button>
            </h1>
            <p className="text-muted-foreground">
              {t(investment.category)} • {investment.currency}{" "}{t("• Initial contribution")}{" "}{formatCurrency(investment.initialInvestment, currency)}{" "}{t("• Started")}{" "}{formatDate(investment.startDate)}
            </p>
          </div>
        )}
        
      </div>

      <nav aria-label={t("Project sections")} className="flex flex-wrap gap-1 rounded-xl border border-border bg-card p-1.5">
        {([
          ['overview', t("Overview")],
          ['costs', t("Costs and variances")],
          ['entries', t("Entries")],
          ['risk', t("Risk simulation")],
          ['guide', t("How to use")],
        ] as const).map(([tab, label]) => (
          <button key={tab} type="button" onClick={() => setActiveTab(tab)} aria-current={activeTab === tab ? 'page' : undefined} className={cn('rounded-lg px-4 py-2 text-sm font-medium transition-colors', activeTab === tab ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}>
            {label}
          </button>
        ))}
      </nav>

      {activeTab === 'overview' && <>
        <div>
          <h2 className="mb-3 text-xl font-semibold">{t("Completion forecast")}</h2>
          <p className="mb-4 text-sm text-muted-foreground">{forecast.isRealised ? t("All entries are settled.") : t("{0} pending costs and {1} pending revenues. The forecast combines actuals with the remaining plan.", [forecast.pendingCostCount, forecast.pendingRevenueCount])}</p>
          {!forecast.hasRevenuePlan && <p className="mb-4 text-sm text-amber-400">{t("No revenue entries: the forecast does not yet describe a complete operation.")}</p>}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard label={t("Forecast profit")} value={money(forecast.expectedProfit)} tone={forecast.expectedProfit >= 0 ? 'positive' : 'negative'} note={t("{0} revenue − {1} costs", [money(forecast.expectedRevenue), money(forecast.estimatedCost)])} help={t("Uses actuals for settled entries and forecasts for pending entries. This is the expected full-cycle result, before any expenses or taxes that have not been entered.")} />
            <MetricCard label={t("Forecast return on costs")} value={formatPercentage(forecast.expectedROI)} note={t("Forecast profit ÷ estimated total cost")} help={t("Measures the full-cycle return on costs. It is not a monthly rate, IRR or return on contributed capital. ROI is unavailable without costs.")} />
            <MetricCard label={t("Margin / headroom before a loss")} value={formatPercentage(summary.expectedMargin)} note={t("Forecast profit ÷ forecast total revenue")} help={t("With constant costs, this shows how far revenue can fall before profit reaches zero. A negative margin means revenue is already below costs. Do not confuse it with ROI.")} />
            <MetricCard label={t("Total cost / break-even revenue")} value={money(forecast.estimatedCost)} note={t("{0} still expected to be paid", [money(forecast.costsRemaining)])} help={t("Recorded costs plus planned pending costs. The minimum total revenue to avoid an accounting loss; to compensate for the time value of capital, see the CDI threshold.")} />
          </div>
        </div>
      </>}

      {(activeTab === 'overview' || activeTab === 'risk') && <BenchmarkAnalysis key={activeTab} investment={investment} inputs={analysisInputs} onChange={setAnalysisInputs} showMetrics={activeTab === 'overview'} />}

      {activeTab === 'overview' && <>
        <div>
          <h2 className="mb-3 text-xl font-semibold">{t("Execution and cash flow")}</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard label={t("Recorded payments")} value={money(forecast.costsPaid)} note={t("{0} settled entries", [costSummary.recordedCount])} />
            <MetricCard label={t("Recorded receipts")} value={money(forecast.revenueReceived)} note={t("{0} revenue still expected", [money(forecast.revenueRemaining)])} />
            <MetricCard label={t("Operating cash result")} value={money(summary.recordedCashResult)} note={t("Receipts − payments")} help={t("This can be negative before the sale. It does not mean a forecast loss; the completion forecast also considers future receipts and payments.")} />
            <MetricCard label={t("Cash balance including recorded funding")} value={money(summary.cashBalance)} note={t("{0} funding + operating cash result", [money(summary.funding)])} help={t("Estimated cash inside the project, excluding unrecorded withdrawals or loans. Funding is a financing inflow, not sales revenue or a second expense.")} />
          </div>
        </div>
        <div>
          <h2 className="mb-3 text-xl font-semibold">{t("Current forecast × recorded plan")}</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard label={t("Recorded plan ROI")} value={formatPercentage(summary.plannedROI)} note={t("Planned profit: {0}", [money(summary.plannedProfit)])} />
            <MetricCard label={t("Change in forecast profit")} value={money(summary.forecastProfitChange)} tone={summary.forecastProfitChange > 0 ? 'positive' : summary.forecastProfitChange < 0 ? 'negative' : 'neutral'} note={t("Completion forecast − recorded plan")} help={t("Replaces comparing partial cash flow with total planned profit. The recorded plan uses the projected values currently entered; editing those values changes the baseline.")} />
            <MetricCard label={t("Recorded cost variance")} value={costSummary.recordedCount ? money(costSummary.variance) : '—'} note={t("{0} against the plan for the same entries", [formatPercentage(costSummary.variancePercentage)])} help={t("Compares only settled costs with their matching forecasts. Positive means an overrun; pending costs do not create artificial savings.")} />
            <MetricCard label={t("Final profit / ROI")} value={summary.finalProfit === null ? t("Pending") : money(summary.finalProfit)} note={summary.finalROI === null ? (forecast.isRealised ? t("ROI unavailable: total cost is zero") : t("Available when every entry is settled")) : t("Final ROI: {0}", [formatPercentage(summary.finalROI)])} />
          </div>
        </div>
        <details className="analysis-panel p-5">
          <summary className="cursor-pointer font-medium">{t("Recorded monthly cash flow")}</summary>
          <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm">
            <thead className="text-muted-foreground"><tr>{[t("Month"), t("Contributions"), t("Receipts"), t("Payments"), t("Operating cash flow"), t("Cash balance including funding")].map(label => <th key={label} className="p-3">{label}</th>)}</tr></thead>
            <tbody>{cashFlow.map(row => <tr key={row.dateKey} className="border-t border-border"><td className="p-3">{row.dateKey}</td><td className="p-3">{money(row.capitalContributions)}</td><td className="p-3">{money(row.revenue)}</td><td className="p-3">{money(row.fixedCosts + row.variableCosts)}</td><td className="p-3">{money(row.netCashFlow)}</td><td className="p-3">{money(row.cashBalance)}</td></tr>)}</tbody>
          </table></div>
        </details>
        <p className="text-xs text-muted-foreground">{t("A positive actual amount settles an entry; zero or blank is pending unless “Settled at zero” is checked. Split paid/received and future portions into separate entries. See “How to use” for model limitations.")}</p>
      </>}
      {activeTab === 'guide' && <MetricsGuide />}

      {activeTab === 'costs' && <CostAnalysis costs={costs} currency={currency} />}

      {activeTab === 'entries' && <>
      {/* Data Grid Section */}
      <div className="space-y-6">
        <p className="text-sm text-muted-foreground">{t("A positive actual amount settles an entry. For partial amounts, use one settled entry and one pending entry. To settle with no payment or receipt, check “Settled at zero”.")}</p>
        {/* REVENUES GRID */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/30">
            <h3 className="font-semibold text-lg text-emerald-500 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />{" "}{t("Revenues")}{" "}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm text-left">
              <thead className="text-xs uppercase text-muted-foreground bg-muted/50">
                <tr>
                  <th className="px-4 py-3 font-medium">{t("Name")}</th>
                  <th className="px-4 py-3 font-medium">{t("Category")}</th>
                  <th className="px-4 py-3 font-medium">{t("Date")}</th>
                  <th className="px-4 py-3 font-medium text-right">{t("Projected")}</th>
                  <th className="px-4 py-3 font-medium text-right">{t("Actual")}</th>
                  <th className="px-4 py-3 font-medium text-center w-24">{t("Action")}</th>
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
                          <input type="number" min="0" step="0.01" name="projectedAmount" required defaultValue={rev.projectedAmount} className="px-4 py-3 bg-transparent border-none outline-none text-sm text-right focus:bg-background transition-colors" />
                          <div className="min-w-0"><input type="number" min="0" step="0.01" name="actualAmount" defaultValue={rev.actualAmount || ''} className="w-full min-w-0 px-4 py-3 bg-transparent border-none outline-none text-sm text-right focus:bg-background transition-colors" /><label className="flex items-center gap-1 px-2 pb-2 text-[10px] text-muted-foreground"><input type="checkbox" name="settledAtZero" defaultChecked={rev.settledAtZero} />{t("Settled at zero")}</label></div>
                        </div>
                        <div className="flex w-24 border-l border-border">
                          <button aria-label={t("Cancel editing")} type="button" onClick={() => setEditingId(null)} className="flex-1 flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"><X className="w-4 h-4" /></button>
                          <button aria-label={t("Save changes")} type="submit" className="flex-1 flex items-center justify-center text-emerald-500 hover:bg-emerald-500/10 transition-colors border-l border-border"><Save className="w-4 h-4" /></button>
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
                    <td className="px-4 py-3 text-right font-medium text-emerald-500">{isRecordedRevenue(rev) ? formatCurrency(rev.actualAmount, currency) : t("Pending")}</td>
                    <td className="px-4 py-3 text-center flex justify-center gap-1">
                      <button aria-label={t("Edit {0}", [rev.name])} onClick={() => setEditingId(rev.id)} className="text-blue-500 hover:bg-blue-500/10 p-1.5 rounded transition-all"><Edit2 className="w-4 h-4" /></button>
                      <button aria-label={t("Delete {0}", [rev.name])} onClick={() => deleteRevenue(rev.id, investment.id)} className="text-destructive hover:bg-destructive/10 p-1.5 rounded transition-all"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
                
                {/* INLINE ADD REVENUE ROW */}
                <tr className="bg-muted/10">
                  <td colSpan={6} className="p-0">
                    <form onSubmit={handleAddRevenue} className="flex w-full">
                      <div className="flex-1 grid grid-cols-5 divide-x divide-border">
                        <input name="name" required placeholder={t("New Revenue...")} className="px-4 py-3 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground/50 focus:bg-background transition-colors" />
                        <input name="category" required placeholder={t("Category")} className="px-4 py-3 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground/50 focus:bg-background transition-colors" />
                        <input type="date" name="date" required defaultValue={new Date().toISOString().split('T')[0]} className="px-4 py-3 bg-transparent border-none outline-none text-sm text-muted-foreground focus:bg-background transition-colors" />
                        <input type="number" min="0" step="0.01" name="projectedAmount" required placeholder={t("Planned amount")} className="px-4 py-3 bg-transparent border-none outline-none text-sm text-right focus:bg-background transition-colors" />
                        <div className="min-w-0"><input type="number" min="0" step="0.01" name="actualAmount" placeholder={t("Actual amount")} className="w-full min-w-0 px-4 py-3 bg-transparent border-none outline-none text-sm text-right focus:bg-background transition-colors" /><label className="flex items-center gap-1 px-2 pb-2 text-[10px] text-muted-foreground"><input type="checkbox" name="settledAtZero" />{t("Settled at zero")}</label></div>
                      </div>
                      <button aria-label={t("Save changes")} type="submit" className="px-6 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 font-medium text-sm flex items-center justify-center transition-colors border-l border-border w-24">{t("Add")}{" "}</button>
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
              <Activity className="w-5 h-5" />{" "}{t("Fixed Costs")}{" "}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{t("Each row represents one dated occurrence; frequency is an informational label.")}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm text-left">
              <thead className="text-xs uppercase text-muted-foreground bg-muted/50">
                <tr>
                  <th className="px-4 py-3 font-medium">{t("Name")}</th>
                  <th className="px-4 py-3 font-medium">{t("Category")}</th>
                  <th className="px-4 py-3 font-medium">{t("Recurrence")}</th>
                  <th className="px-4 py-3 font-medium">{t("Date")}</th>
                  <th className="px-4 py-3 font-medium text-right">{t("Projected")}</th>
                  <th className="px-4 py-3 font-medium text-right">{t("Actual")}</th>
                  <th className="px-4 py-3 font-medium text-center w-24">{t("Action")}</th>
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
                            <option value="MONTHLY">{t("Monthly")}</option>
                            <option value="YEARLY">{t("Yearly")}</option>
                            <option value="ONE_TIME">{t("One Time")}</option>
                            <option value="WEEKLY">{t("Weekly")}</option>
                            <option value="QUARTERLY">{t("Quarterly")}</option>
                          </select>
                          <input type="date" name="date" required defaultValue={new Date(cost.date).toISOString().split('T')[0]} className="px-4 py-3 bg-transparent border-none outline-none text-sm text-muted-foreground focus:bg-background transition-colors" />
                          <input type="number" min="0" step="0.01" name="projectedAmount" required defaultValue={cost.projectedAmount} className="px-4 py-3 bg-transparent border-none outline-none text-sm text-right focus:bg-background transition-colors" />
                          <div className="min-w-0"><input type="number" min="0" step="0.01" name="actualAmount" defaultValue={isRecordedCost(cost) ? cost.actualAmount : ''} placeholder={t("None")} aria-label={t("Actual amount for {0}", [cost.name])} className="w-full min-w-0 px-4 py-3 bg-transparent border-none outline-none text-sm text-right focus:bg-background transition-colors" /><label className="flex items-center gap-1 px-2 pb-2 text-[10px] text-muted-foreground"><input type="checkbox" name="settledAtZero" defaultChecked={cost.settledAtZero} />{t("Settled at zero")}</label></div>
                        </div>
                        <div className="flex w-24 border-l border-border">
                          <button aria-label={t("Cancel editing")} type="button" onClick={() => setEditingId(null)} className="flex-1 flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"><X className="w-4 h-4" /></button>
                          <button aria-label={t("Save changes")} type="submit" className="flex-1 flex items-center justify-center text-orange-500 hover:bg-orange-500/10 transition-colors border-l border-border"><Save className="w-4 h-4" /></button>
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
                    <td className="px-4 py-3 text-right font-medium text-orange-500">{isRecordedCost(cost) ? formatCurrency(cost.actualAmount, currency) : t("None")}</td>
                    <td className="px-4 py-3 text-center flex justify-center gap-1">
                      <button aria-label={t("Edit {0}", [cost.name])} onClick={() => setEditingId(cost.id)} className="text-blue-500 hover:bg-blue-500/10 p-1.5 rounded transition-all"><Edit2 className="w-4 h-4" /></button>
                      <button aria-label={t("Delete {0}", [cost.name])} onClick={() => deleteCost(cost.id, investment.id)} className="text-destructive hover:bg-destructive/10 p-1.5 rounded transition-all"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
                
                {/* INLINE ADD COST ROW */}
                <tr className="bg-muted/10">
                  <td colSpan={7} className="p-0">
                    <form onSubmit={(e) => handleAddCost(e, 'FIXED')} className="flex w-full">
                      <div className="flex-1 grid grid-cols-6 divide-x divide-border">
                        <input name="name" required placeholder={t("New Fixed Cost...")} className="px-4 py-3 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground/50 focus:bg-background transition-colors" />
                        <input name="category" required placeholder={t("Category")} className="px-4 py-3 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground/50 focus:bg-background transition-colors" />
                        <select name="recurrence" required className="px-4 py-3 bg-transparent border-none outline-none text-sm text-muted-foreground focus:bg-background transition-colors appearance-none">
                          <option value="MONTHLY">{t("Monthly")}</option>
                          <option value="YEARLY">{t("Yearly")}</option>
                          <option value="ONE_TIME">{t("One Time")}</option>
                          <option value="WEEKLY">{t("Weekly")}</option>
                          <option value="QUARTERLY">{t("Quarterly")}</option>
                        </select>
                        <input type="date" name="date" required defaultValue={new Date().toISOString().split('T')[0]} className="px-4 py-3 bg-transparent border-none outline-none text-sm text-muted-foreground focus:bg-background transition-colors" />
                        <input type="number" min="0" step="0.01" name="projectedAmount" required placeholder={t("Planned amount")} className="px-4 py-3 bg-transparent border-none outline-none text-sm text-right focus:bg-background transition-colors" />
                        <div className="min-w-0"><input type="number" min="0" step="0.01" name="actualAmount" placeholder={t("None")} aria-label={t("Actual fixed cost")} className="w-full min-w-0 px-4 py-3 bg-transparent border-none outline-none text-sm text-right focus:bg-background transition-colors" /><label className="flex items-center gap-1 px-2 pb-2 text-[10px] text-muted-foreground"><input type="checkbox" name="settledAtZero" />{t("Settled at zero")}</label></div>
                      </div>
                      <button aria-label={t("Save changes")} type="submit" className="px-6 bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 font-medium text-sm flex items-center justify-center transition-colors border-l border-border w-24">{t("Add")}{" "}</button>
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
              <TrendingDown className="w-5 h-5" />{" "}{t("Variable Costs")}{" "}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{t("Each row represents one dated occurrence; frequency is an informational label.")}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm text-left">
              <thead className="text-xs uppercase text-muted-foreground bg-muted/50">
                <tr>
                  <th className="px-4 py-3 font-medium">{t("Name")}</th>
                  <th className="px-4 py-3 font-medium">{t("Category")}</th>
                  <th className="px-4 py-3 font-medium">{t("Recurrence")}</th>
                  <th className="px-4 py-3 font-medium">{t("Date")}</th>
                  <th className="px-4 py-3 font-medium text-right">{t("Projected")}</th>
                  <th className="px-4 py-3 font-medium text-right">{t("Actual")}</th>
                  <th className="px-4 py-3 font-medium text-center w-24">{t("Action")}</th>
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
                            <option value="ONE_TIME">{t("One Time")}</option>
                            <option value="MONTHLY">{t("Monthly")}</option>
                            <option value="YEARLY">{t("Yearly")}</option>
                            <option value="WEEKLY">{t("Weekly")}</option>
                            <option value="QUARTERLY">{t("Quarterly")}</option>
                          </select>
                          <input type="date" name="date" required defaultValue={new Date(cost.date).toISOString().split('T')[0]} className="px-4 py-3 bg-transparent border-none outline-none text-sm text-muted-foreground focus:bg-background transition-colors" />
                          <input type="number" min="0" step="0.01" name="projectedAmount" required defaultValue={cost.projectedAmount} className="px-4 py-3 bg-transparent border-none outline-none text-sm text-right focus:bg-background transition-colors" />
                          <div className="min-w-0"><input type="number" min="0" step="0.01" name="actualAmount" defaultValue={isRecordedCost(cost) ? cost.actualAmount : ''} placeholder={t("None")} aria-label={t("Actual amount for {0}", [cost.name])} className="w-full min-w-0 px-4 py-3 bg-transparent border-none outline-none text-sm text-right focus:bg-background transition-colors" /><label className="flex items-center gap-1 px-2 pb-2 text-[10px] text-muted-foreground"><input type="checkbox" name="settledAtZero" defaultChecked={cost.settledAtZero} />{t("Settled at zero")}</label></div>
                        </div>
                        <div className="flex w-24 border-l border-border">
                          <button aria-label={t("Cancel editing")} type="button" onClick={() => setEditingId(null)} className="flex-1 flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"><X className="w-4 h-4" /></button>
                          <button aria-label={t("Save changes")} type="submit" className="flex-1 flex items-center justify-center text-red-500 hover:bg-red-500/10 transition-colors border-l border-border"><Save className="w-4 h-4" /></button>
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
                    <td className="px-4 py-3 text-right font-medium text-red-500">{isRecordedCost(cost) ? formatCurrency(cost.actualAmount, currency) : t("None")}</td>
                    <td className="px-4 py-3 text-center flex justify-center gap-1">
                      <button aria-label={t("Edit {0}", [cost.name])} onClick={() => setEditingId(cost.id)} className="text-blue-500 hover:bg-blue-500/10 p-1.5 rounded transition-all"><Edit2 className="w-4 h-4" /></button>
                      <button aria-label={t("Delete {0}", [cost.name])} onClick={() => deleteCost(cost.id, investment.id)} className="text-destructive hover:bg-destructive/10 p-1.5 rounded transition-all"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
                
                {/* INLINE ADD COST ROW */}
                <tr className="bg-muted/10">
                  <td colSpan={7} className="p-0">
                    <form onSubmit={(e) => handleAddCost(e, 'VARIABLE')} className="flex w-full">
                      <div className="flex-1 grid grid-cols-6 divide-x divide-border">
                        <input name="name" required placeholder={t("New Variable Cost...")} className="px-4 py-3 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground/50 focus:bg-background transition-colors" />
                        <input name="category" required placeholder={t("Category")} className="px-4 py-3 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground/50 focus:bg-background transition-colors" />
                        <select name="recurrence" required className="px-4 py-3 bg-transparent border-none outline-none text-sm text-muted-foreground focus:bg-background transition-colors appearance-none">
                          <option value="ONE_TIME">{t("One Time")}</option>
                          <option value="MONTHLY">{t("Monthly")}</option>
                          <option value="YEARLY">{t("Yearly")}</option>
                          <option value="WEEKLY">{t("Weekly")}</option>
                          <option value="QUARTERLY">{t("Quarterly")}</option>
                        </select>
                        <input type="date" name="date" required defaultValue={new Date().toISOString().split('T')[0]} className="px-4 py-3 bg-transparent border-none outline-none text-sm text-muted-foreground focus:bg-background transition-colors" />
                        <input type="number" min="0" step="0.01" name="projectedAmount" required placeholder={t("Planned amount")} className="px-4 py-3 bg-transparent border-none outline-none text-sm text-right focus:bg-background transition-colors" />
                        <div className="min-w-0"><input type="number" min="0" step="0.01" name="actualAmount" placeholder={t("None")} aria-label={t("Actual variable cost")} className="w-full min-w-0 px-4 py-3 bg-transparent border-none outline-none text-sm text-right focus:bg-background transition-colors" /><label className="flex items-center gap-1 px-2 pb-2 text-[10px] text-muted-foreground"><input type="checkbox" name="settledAtZero" />{t("Settled at zero")}</label></div>
                      </div>
                      <button aria-label={t("Save changes")} type="submit" className="px-6 bg-red-500/10 text-red-500 hover:bg-red-500/20 font-medium text-sm flex items-center justify-center transition-colors border-l border-border w-24">{t("Add")}{" "}</button>
                    </form>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      </>}

      {activeTab === 'risk' && <MonteCarloSimulation investment={investment} durationMonths={analysisInputs.durationMonths} benchmarkAnnualRatePercent={analysisInputs.benchmarkAnnualRatePercent} />}

    </div>
  );
}
