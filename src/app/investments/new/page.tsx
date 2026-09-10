import { InvestmentForm } from '@/components/investments/InvestmentForm'

export default function NewInvestmentPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 mt-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Project</h1>
        <p className="text-muted-foreground">Create a new investment or project in your portfolio.</p>
      </div>
      
      <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm p-6">
        <InvestmentForm />
      </div>
    </div>
  )
}
