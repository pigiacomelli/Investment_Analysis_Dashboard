'use client'

import { useI18n } from '@/lib/i18n/client'

import { cn } from '@/lib/utils'

export function MetricCard({ label, value, note, help, tone = 'neutral' }: {
  label: string; value: string; note?: string; help?: string;
  tone?: 'positive' | 'negative' | 'neutral'
}) {
  const { t } = useI18n()
  return <div className="metric-panel min-w-0">
    <p className="metric-label">{label}</p>
    <p className={cn('metric-value break-words', tone === 'positive' && 'text-emerald-400', tone === 'negative' && 'text-rose-400')}>{value}</p>
    {note && <p className="metric-note leading-relaxed">{note}</p>}
    {help && <details className="mt-3 text-xs text-muted-foreground">
      <summary className="cursor-pointer text-primary">{t("How to interpret")}</summary>
      <p className="mt-2 leading-relaxed">{help}</p>
    </details>}
  </div>
}
