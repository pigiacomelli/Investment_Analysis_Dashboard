import { cookies } from 'next/headers'
import { createI18n, LANGUAGE_COOKIE, resolveLocale } from './shared'

export async function getI18n() {
  const cookieStore = await cookies()
  return createI18n(resolveLocale(cookieStore.get(LANGUAGE_COOKIE)?.value))
}
