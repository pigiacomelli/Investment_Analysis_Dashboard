'use client'

import { useState, useTransition } from 'react'
import { useI18n } from '@/lib/i18n/client'
import { setLanguage } from '@/lib/i18n/actions'
import { Languages } from 'lucide-react'

export function LanguageSwitcher() {
  const { locale, t } = useI18n()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState(false)
  return <div className="flex flex-col gap-1">
    <label className="flex items-center gap-2 text-xs text-muted-foreground">
      <Languages aria-hidden="true" className="h-4 w-4" />
      <span className="sr-only">{t('Language')}</span>
      <select aria-label={t('Language')} value={locale} disabled={pending} onChange={event => {
        const nextLocale = event.target.value
        setError(false)
        startTransition(async () => {
          try { await setLanguage(nextLocale) } catch { setError(true) }
        })
      }} className="rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground disabled:opacity-50">
        <option value="en">English</option>
        <option value="pt-BR">Português</option>
      </select>
    </label>
    {pending && <span role="status" className="text-xs text-muted-foreground">{t('Changing language…')}</span>}
    {error && <span role="alert" className="text-xs text-destructive">{t('Could not change language. Try again.')}</span>}
  </div>
}
