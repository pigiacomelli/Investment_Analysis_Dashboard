'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from './db'
import {
  investmentSchema,
  costSchema,
  revenueSchema,
  capitalContributionSchema,
} from './validation'

function revalidateInvestment(id?: string) {
  revalidatePath('/')
  revalidatePath('/investments')
  if (id) {
    revalidatePath(`/investments/${id}`)
  }
}

export async function createInvestment(formData: FormData) {
  const data = Object.fromEntries(formData.entries())
  const parsed = investmentSchema.parse(data)
  
  const investment = await prisma.investment.create({
    data: parsed,
  })
  
  revalidateInvestment(investment.id)
  return investment
}

export async function updateInvestment(id: string, formData: FormData) {
  const data = Object.fromEntries(formData.entries())
  const parsed = investmentSchema.parse(data)
  
  const investment = await prisma.investment.update({
    where: { id },
    data: parsed,
  })
  
  revalidateInvestment(id)
  return investment
}

export async function deleteInvestment(id: string) {
  await prisma.investment.delete({
    where: { id },
  })
  
  revalidateInvestment(id)
}

export async function createCost(investmentId: string, formData: FormData) {
  const data = Object.fromEntries(formData.entries())
  const parsed = costSchema.parse(data)
  
  const cost = await prisma.cost.create({
    data: {
      ...parsed,
      investmentId,
    },
  })
  
  revalidateInvestment(investmentId)
  return cost
}

export async function updateCost(id: string, investmentId: string, formData: FormData) {
  const data = Object.fromEntries(formData.entries())
  const parsed = costSchema.parse(data)
  
  const cost = await prisma.cost.update({
    where: { id },
    data: parsed,
  })
  
  revalidateInvestment(investmentId)
  return cost
}

export async function deleteCost(id: string, investmentId: string) {
  await prisma.cost.delete({
    where: { id },
  })
  
  revalidateInvestment(investmentId)
}

export async function createRevenue(investmentId: string, formData: FormData) {
  const data = Object.fromEntries(formData.entries())
  const parsed = revenueSchema.parse(data)
  
  const revenue = await prisma.revenue.create({
    data: {
      ...parsed,
      investmentId,
    },
  })
  
  revalidateInvestment(investmentId)
  return revenue
}

export async function updateRevenue(id: string, investmentId: string, formData: FormData) {
  const data = Object.fromEntries(formData.entries())
  const parsed = revenueSchema.parse(data)
  
  const revenue = await prisma.revenue.update({
    where: { id },
    data: parsed,
  })
  
  revalidateInvestment(investmentId)
  return revenue
}

export async function deleteRevenue(id: string, investmentId: string) {
  await prisma.revenue.delete({
    where: { id },
  })
  
  revalidateInvestment(investmentId)
}

export async function createCapitalContribution(investmentId: string, formData: FormData) {
  const data = Object.fromEntries(formData.entries())
  const parsed = capitalContributionSchema.parse(data)
  
  const contribution = await prisma.capitalContribution.create({
    data: {
      ...parsed,
      investmentId,
    },
  })
  
  revalidateInvestment(investmentId)
  return contribution
}

export async function deleteCapitalContribution(id: string, investmentId: string) {
  await prisma.capitalContribution.delete({
    where: { id },
  })
  
  revalidateInvestment(investmentId)
}
