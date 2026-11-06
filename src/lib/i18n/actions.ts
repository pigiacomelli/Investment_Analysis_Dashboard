'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { LANGUAGE_COOKIE } from './shared'

export async function setLanguage(locale: string) {
  if (locale !== 'en' && locale !== 'pt-BR') throw new Error('Unsupported language')
  const cookieStore = await cookies()
  cookieStore.set(LANGUAGE_COOKIE, locale, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax', httpOnly: true })
  revalidatePath('/', 'layout')
}
