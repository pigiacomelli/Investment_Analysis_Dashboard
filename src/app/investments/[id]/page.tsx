import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { ExcelDashboard } from '@/components/investments/ExcelDashboard'
import { InvestmentWithDetails } from '@/lib/finance'

export default async function InvestmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  
  const investment = await prisma.investment.findUnique({
    where: { id: resolvedParams.id },
    include: {
      costs: { orderBy: { date: 'asc' } },
      revenues: { orderBy: { date: 'asc' } },
      capitalContributions: { orderBy: { date: 'asc' } },
    }
  })

  if (!investment) {
    notFound()
  }

  return <ExcelDashboard investment={investment as InvestmentWithDetails} />
}
