import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createI18n, resolveLocale, DEFAULT_LOCALE } from './shared'
import { LanguageProvider, useI18n } from './client'
import portuguese from './pt-BR.json'
import { formatCurrency, formatDate, formatPercentage } from '@/lib/utils/format'

function Example({ name }: { name: string }) {
  const { t, formatCurrency } = useI18n()
  return <div><h1>{t('Projects')}</h1><p>{name}</p><p>{formatCurrency(1234.5, 'BRL')}</p></div>
}

describe('Language and locale preferences', () => {
  it('defaults to English and accepts only the supported saved Portuguese preference', () => {
    expect(DEFAULT_LOCALE).toBe('en')
    expect(resolveLocale()).toBe('en')
    expect(resolveLocale('fr')).toBe('en')
    expect(resolveLocale('pt-BR')).toBe('pt-BR')
    expect(createI18n(resolveLocale()).t('Projects')).toBe('Projects')
  })
  it('translates dynamic messages without translating the supplied project name', () => {
    const name = 'Meu Imóvel'
    const en = createI18n('en')
    const pt = createI18n('pt-BR')
    expect(pt.t('Projects')).toBe('Projetos')
    expect(en.t('Delete project {0}', [name])).toBe('Delete project Meu Imóvel')
    expect(pt.t('Delete project {0}', [name])).toBe('Excluir projeto Meu Imóvel')
    expect(pt.t('Unknown custom label')).toBe('Unknown custom label')
  })
  it('preserves all interpolation placeholders in the Portuguese catalog', () => {
    for (const [en, pt] of Object.entries(portuguese)) {
      const slots = (text: string) => text.match(/\{\d+\}/g)?.sort() ?? []
      expect(slots(pt), en).toEqual(slots(en))
      expect(pt.trim(), en).not.toBe('')
    }
  })
  it('formats the same monetary and percentage values in the selected language', () => {
    expect(formatPercentage(16.73)).toBe('16.73%')
    expect(formatPercentage(16.73, 'pt-BR')).toBe('16,73%')
    expect(formatCurrency(1234.5, 'USD', 'en')).toBe('$1,234.50')
    expect(formatCurrency(1234.5, 'USD', 'pt-BR')).toContain('1.234,50')
    expect(formatDate('2026-09-09T00:00:00Z', 'en')).toBe('Sep 9, 2026')
    expect(formatDate('2026-09-09T00:00:00Z', 'pt-BR')).toContain('9 de set.')
  })
  it('updates translated content and numbers while keeping user data intact', () => {
    const view = render(<LanguageProvider locale="en"><Example name="Projeto de exemplo" /></LanguageProvider>)
    expect(screen.getByRole('heading').textContent).toBe('Projects')
    expect(screen.getByText('Projeto de exemplo')).toBeTruthy()
    view.rerender(<LanguageProvider locale="pt-BR"><Example name="Projeto de exemplo" /></LanguageProvider>)
    expect(screen.getByRole('heading').textContent).toBe('Projetos')
    expect(screen.getByText('Projeto de exemplo')).toBeTruthy()
    expect(view.container.textContent).toContain('1.234,50')
  })
})
