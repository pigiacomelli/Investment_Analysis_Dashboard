import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding CapitalScope database...')

  // Clear existing data
  await prisma.capitalContribution.deleteMany()
  await prisma.cost.deleteMany()
  await prisma.revenue.deleteMany()
  await prisma.investment.deleteMany()

  // ─── 1. SaaS Business ─────────────────────────────────────────
  const saas = await prisma.investment.create({
    data: {
      name: 'CloudSync SaaS',
      description: 'B2B cloud synchronization platform with subscription model',
      category: 'Software Project',
      status: 'ACTIVE',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2025-12-31'),
      initialInvestment: 50000,
      currency: 'USD',
      notes: 'Series seed investment in cloud sync technology',
    },
  })

  // SaaS Fixed Costs
  const saasFixedCosts = [
    { name: 'AWS Hosting', category: 'Infrastructure', costType: 'FIXED', projectedAmount: 1200, actualAmount: 1350, recurrence: 'MONTHLY', date: new Date('2024-01-15') },
    { name: 'AWS Hosting', category: 'Infrastructure', costType: 'FIXED', projectedAmount: 1200, actualAmount: 1300, recurrence: 'MONTHLY', date: new Date('2024-02-15') },
    { name: 'AWS Hosting', category: 'Infrastructure', costType: 'FIXED', projectedAmount: 1200, actualAmount: 1400, recurrence: 'MONTHLY', date: new Date('2024-03-15') },
    { name: 'AWS Hosting', category: 'Infrastructure', costType: 'FIXED', projectedAmount: 1200, actualAmount: 1250, recurrence: 'MONTHLY', date: new Date('2024-04-15') },
    { name: 'AWS Hosting', category: 'Infrastructure', costType: 'FIXED', projectedAmount: 1200, actualAmount: 1500, recurrence: 'MONTHLY', date: new Date('2024-05-15') },
    { name: 'AWS Hosting', category: 'Infrastructure', costType: 'FIXED', projectedAmount: 1200, actualAmount: 1450, recurrence: 'MONTHLY', date: new Date('2024-06-15') },
    { name: 'Software Licenses', category: 'Software', costType: 'FIXED', projectedAmount: 500, actualAmount: 500, recurrence: 'MONTHLY', date: new Date('2024-01-01') },
    { name: 'Software Licenses', category: 'Software', costType: 'FIXED', projectedAmount: 500, actualAmount: 500, recurrence: 'MONTHLY', date: new Date('2024-02-01') },
    { name: 'Software Licenses', category: 'Software', costType: 'FIXED', projectedAmount: 500, actualAmount: 550, recurrence: 'MONTHLY', date: new Date('2024-03-01') },
    { name: 'Developer Salaries', category: 'Personnel', costType: 'FIXED', projectedAmount: 8000, actualAmount: 8000, recurrence: 'MONTHLY', date: new Date('2024-01-31') },
    { name: 'Developer Salaries', category: 'Personnel', costType: 'FIXED', projectedAmount: 8000, actualAmount: 8000, recurrence: 'MONTHLY', date: new Date('2024-02-28') },
    { name: 'Developer Salaries', category: 'Personnel', costType: 'FIXED', projectedAmount: 8000, actualAmount: 8500, recurrence: 'MONTHLY', date: new Date('2024-03-31') },
    { name: 'Developer Salaries', category: 'Personnel', costType: 'FIXED', projectedAmount: 8000, actualAmount: 8500, recurrence: 'MONTHLY', date: new Date('2024-04-30') },
    { name: 'Developer Salaries', category: 'Personnel', costType: 'FIXED', projectedAmount: 8000, actualAmount: 8500, recurrence: 'MONTHLY', date: new Date('2024-05-31') },
    { name: 'Developer Salaries', category: 'Personnel', costType: 'FIXED', projectedAmount: 8000, actualAmount: 8500, recurrence: 'MONTHLY', date: new Date('2024-06-30') },
    { name: 'Office Insurance', category: 'Insurance', costType: 'FIXED', projectedAmount: 300, actualAmount: 300, recurrence: 'MONTHLY', date: new Date('2024-01-05') },
  ]

  // SaaS Variable Costs
  const saasVariableCosts = [
    { name: 'Google Ads', category: 'Marketing', costType: 'VARIABLE', projectedAmount: 2000, actualAmount: 2500, recurrence: 'MONTHLY', date: new Date('2024-01-10') },
    { name: 'Google Ads', category: 'Marketing', costType: 'VARIABLE', projectedAmount: 2000, actualAmount: 3000, recurrence: 'MONTHLY', date: new Date('2024-02-10') },
    { name: 'Google Ads', category: 'Marketing', costType: 'VARIABLE', projectedAmount: 2500, actualAmount: 2800, recurrence: 'MONTHLY', date: new Date('2024-03-10') },
    { name: 'Google Ads', category: 'Marketing', costType: 'VARIABLE', projectedAmount: 2500, actualAmount: 2200, recurrence: 'MONTHLY', date: new Date('2024-04-10') },
    { name: 'Google Ads', category: 'Marketing', costType: 'VARIABLE', projectedAmount: 3000, actualAmount: 3500, recurrence: 'MONTHLY', date: new Date('2024-05-10') },
    { name: 'Google Ads', category: 'Marketing', costType: 'VARIABLE', projectedAmount: 3000, actualAmount: 2700, recurrence: 'MONTHLY', date: new Date('2024-06-10') },
    { name: 'Sales Commissions', category: 'Sales', costType: 'VARIABLE', projectedAmount: 1000, actualAmount: 1200, recurrence: 'MONTHLY', date: new Date('2024-03-15') },
    { name: 'Sales Commissions', category: 'Sales', costType: 'VARIABLE', projectedAmount: 1500, actualAmount: 1800, recurrence: 'MONTHLY', date: new Date('2024-04-15') },
    { name: 'Freelance Contractors', category: 'Contractors', costType: 'VARIABLE', projectedAmount: 3000, actualAmount: 4500, recurrence: 'ONE_TIME', date: new Date('2024-02-20') },
  ]

  for (const cost of [...saasFixedCosts, ...saasVariableCosts]) {
    await prisma.cost.create({ data: { ...cost, investmentId: saas.id } })
  }

  // SaaS Revenue
  const saasRevenues = [
    { name: 'Subscription Revenue', category: 'SaaS Subscriptions', projectedAmount: 5000, actualAmount: 4200, date: new Date('2024-01-31') },
    { name: 'Subscription Revenue', category: 'SaaS Subscriptions', projectedAmount: 7000, actualAmount: 7500, date: new Date('2024-02-28') },
    { name: 'Subscription Revenue', category: 'SaaS Subscriptions', projectedAmount: 10000, actualAmount: 8900, date: new Date('2024-03-31') },
    { name: 'Subscription Revenue', category: 'SaaS Subscriptions', projectedAmount: 12000, actualAmount: 13500, date: new Date('2024-04-30') },
    { name: 'Subscription Revenue', category: 'SaaS Subscriptions', projectedAmount: 15000, actualAmount: 16200, date: new Date('2024-05-31') },
    { name: 'Subscription Revenue', category: 'SaaS Subscriptions', projectedAmount: 18000, actualAmount: 17800, date: new Date('2024-06-30') },
    { name: 'Enterprise Contract', category: 'Enterprise', projectedAmount: 25000, actualAmount: 30000, date: new Date('2024-04-15') },
  ]

  for (const rev of saasRevenues) {
    await prisma.revenue.create({ data: { ...rev, investmentId: saas.id } })
  }

  // SaaS Capital Contribution
  await prisma.capitalContribution.create({
    data: { investmentId: saas.id, amount: 15000, date: new Date('2024-04-01'), description: 'Additional seed round' },
  })

  // ─── 2. Rental Property ────────────────────────────────────────
  const rental = await prisma.investment.create({
    data: {
      name: 'Downtown Apartment 4B',
      description: '2-bedroom apartment in downtown area for rental income',
      category: 'Real Estate',
      status: 'ACTIVE',
      startDate: new Date('2023-06-01'),
      initialInvestment: 180000,
      currency: 'USD',
      notes: 'Purchased with 20% down, mortgage financed',
    },
  })

  const rentalFixedCosts = [
    { name: 'Mortgage Payment', category: 'Financing', costType: 'FIXED', projectedAmount: 1200, actualAmount: 1200, recurrence: 'MONTHLY', date: new Date('2024-01-01') },
    { name: 'Mortgage Payment', category: 'Financing', costType: 'FIXED', projectedAmount: 1200, actualAmount: 1200, recurrence: 'MONTHLY', date: new Date('2024-02-01') },
    { name: 'Mortgage Payment', category: 'Financing', costType: 'FIXED', projectedAmount: 1200, actualAmount: 1200, recurrence: 'MONTHLY', date: new Date('2024-03-01') },
    { name: 'Mortgage Payment', category: 'Financing', costType: 'FIXED', projectedAmount: 1200, actualAmount: 1200, recurrence: 'MONTHLY', date: new Date('2024-04-01') },
    { name: 'Mortgage Payment', category: 'Financing', costType: 'FIXED', projectedAmount: 1200, actualAmount: 1200, recurrence: 'MONTHLY', date: new Date('2024-05-01') },
    { name: 'Mortgage Payment', category: 'Financing', costType: 'FIXED', projectedAmount: 1200, actualAmount: 1200, recurrence: 'MONTHLY', date: new Date('2024-06-01') },
    { name: 'Property Insurance', category: 'Insurance', costType: 'FIXED', projectedAmount: 150, actualAmount: 150, recurrence: 'MONTHLY', date: new Date('2024-01-05') },
    { name: 'Property Tax', category: 'Tax', costType: 'FIXED', projectedAmount: 2400, actualAmount: 2600, recurrence: 'QUARTERLY', date: new Date('2024-03-31') },
    { name: 'HOA Fees', category: 'Fees', costType: 'FIXED', projectedAmount: 350, actualAmount: 350, recurrence: 'MONTHLY', date: new Date('2024-01-01') },
  ]

  const rentalVariableCosts = [
    { name: 'Plumbing Repair', category: 'Maintenance', costType: 'VARIABLE', projectedAmount: 0, actualAmount: 800, recurrence: 'ONE_TIME', date: new Date('2024-02-15') },
    { name: 'Painting', category: 'Maintenance', costType: 'VARIABLE', projectedAmount: 500, actualAmount: 650, recurrence: 'ONE_TIME', date: new Date('2024-01-20') },
    { name: 'Property Management', category: 'Management', costType: 'VARIABLE', projectedAmount: 200, actualAmount: 200, recurrence: 'MONTHLY', date: new Date('2024-01-01') },
    { name: 'Property Management', category: 'Management', costType: 'VARIABLE', projectedAmount: 200, actualAmount: 200, recurrence: 'MONTHLY', date: new Date('2024-02-01') },
    { name: 'Property Management', category: 'Management', costType: 'VARIABLE', projectedAmount: 200, actualAmount: 200, recurrence: 'MONTHLY', date: new Date('2024-03-01') },
  ]

  for (const cost of [...rentalFixedCosts, ...rentalVariableCosts]) {
    await prisma.cost.create({ data: { ...cost, investmentId: rental.id } })
  }

  const rentalRevenues = [
    { name: 'Rental Income', category: 'Rent', projectedAmount: 2200, actualAmount: 2200, date: new Date('2024-01-01') },
    { name: 'Rental Income', category: 'Rent', projectedAmount: 2200, actualAmount: 2200, date: new Date('2024-02-01') },
    { name: 'Rental Income', category: 'Rent', projectedAmount: 2200, actualAmount: 2200, date: new Date('2024-03-01') },
    { name: 'Rental Income', category: 'Rent', projectedAmount: 2200, actualAmount: 2400, date: new Date('2024-04-01') },
    { name: 'Rental Income', category: 'Rent', projectedAmount: 2400, actualAmount: 2400, date: new Date('2024-05-01') },
    { name: 'Rental Income', category: 'Rent', projectedAmount: 2400, actualAmount: 2400, date: new Date('2024-06-01') },
  ]

  for (const rev of rentalRevenues) {
    await prisma.revenue.create({ data: { ...rev, investmentId: rental.id } })
  }

  // ─── 3. Private Investment ─────────────────────────────────────
  const privateInv = await prisma.investment.create({
    data: {
      name: 'GreenTech Equity Stake',
      description: 'Private equity stake in renewable energy startup',
      category: 'Private Investment',
      status: 'ACTIVE',
      startDate: new Date('2023-09-01'),
      initialInvestment: 75000,
      currency: 'USD',
      notes: '5% equity stake, expected exit in 3-5 years',
    },
  })

  const privateFixedCosts = [
    { name: 'Legal Fees', category: 'Legal', costType: 'FIXED', projectedAmount: 5000, actualAmount: 6200, recurrence: 'ONE_TIME', date: new Date('2023-09-15') },
    { name: 'Accounting', category: 'Professional', costType: 'FIXED', projectedAmount: 1000, actualAmount: 1000, recurrence: 'YEARLY', date: new Date('2024-01-15') },
  ]

  const privateVariableCosts = [
    { name: 'Due Diligence Consulting', category: 'Consulting', costType: 'VARIABLE', projectedAmount: 3000, actualAmount: 4500, recurrence: 'ONE_TIME', date: new Date('2023-09-01') },
  ]

  for (const cost of [...privateFixedCosts, ...privateVariableCosts]) {
    await prisma.cost.create({ data: { ...cost, investmentId: privateInv.id } })
  }

  const privateRevenues = [
    { name: 'Q1 Dividend', category: 'Dividends', projectedAmount: 2000, actualAmount: 1500, date: new Date('2024-03-31') },
    { name: 'Q2 Dividend', category: 'Dividends', projectedAmount: 2000, actualAmount: 2200, date: new Date('2024-06-30') },
  ]

  for (const rev of privateRevenues) {
    await prisma.revenue.create({ data: { ...rev, investmentId: privateInv.id } })
  }

  await prisma.capitalContribution.create({
    data: { investmentId: privateInv.id, amount: 10000, date: new Date('2024-01-15'), description: 'Follow-on investment' },
  })

  console.log('✅ Seed data created successfully!')
  console.log(`   - ${saas.name} (SaaS)`)
  console.log(`   - ${rental.name} (Real Estate)`)
  console.log(`   - ${privateInv.name} (Private Investment)`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
