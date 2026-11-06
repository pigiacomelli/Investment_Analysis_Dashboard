'use client'

import { useI18n } from '@/lib/i18n/client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { deleteInvestment } from '@/lib/actions'

export function DeleteProjectButton({ id, name }: { id: string; name: string }) {
  const { t } = useI18n()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    if (!window.confirm(t("Delete “{0}” and all its data? This cannot be undone.", [name]))) return
    setPending(true)
    setError(false)
    try {
      await deleteInvestment(id)
      router.refresh()
    } catch {
      setError(true)
      setPending(false)
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button type="button" onClick={handleDelete} disabled={pending} aria-label={t("Delete project {0}", [name])} className="inline-flex items-center gap-1.5 rounded-md border border-destructive/30 px-2.5 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:cursor-wait disabled:opacity-50">
        <Trash2 className="h-3.5 w-3.5" /> {pending ? t("Deleting…") : t("Delete")}
      </button>
      {error && <span role="alert" className="text-xs text-destructive">{t("Could not delete. Try again.")}</span>}
    </div>
  )
}
