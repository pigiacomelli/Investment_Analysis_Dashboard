import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'

export default async function DashboardPage() {
  const firstInvestment = await prisma.investment.findFirst({
    orderBy: { createdAt: 'desc' }
  })

  if (!firstInvestment) {
    redirect('/investments/new')
  }

  redirect(`/investments/${firstInvestment.id}`)
}
