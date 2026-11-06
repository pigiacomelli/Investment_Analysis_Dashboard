'use client'

import { useI18n } from '@/lib/i18n/client'

export function MetricsGuide() {
  const { t } = useI18n()
  return <section className="analysis-panel p-5" aria-labelledby="guide-title">
    <h2 id="guide-title" className="text-xl font-semibold">{t("How to use the metrics")}</h2>
    <div className="mt-4 space-y-4 text-sm leading-relaxed text-muted-foreground">
      <p><strong className="text-foreground">{t("1. Enter the entire operation.")}</strong>{" "}{t("Include purchase, renovation, fees, taxes, maintenance and sale. Each entry is one occurrence; selecting “monthly” does not create future payments. Split partial payments/receipts from the pending remainder.")}</p>
      <p><strong className="text-foreground">{t("2. Read the completion forecast.")}</strong>{" "}{t("The forecast uses actuals for settled entries and planned values for pending entries. Return on costs = profit ÷ total cost; margin = profit ÷ revenue. Their denominators differ. Contributions fund the operation and are not a second expense.")}</p>
      <p><strong className="text-foreground">{t("3. Compare the whole cycle with CDI.")}</strong>{" "}{t("Adjust the hypothetical annual CDI and the months from the first payment until the sale proceeds arrive. Check profit above CDI and the catch-up time. The initial rate is an example, not a live quote.")}</p>
      <p><strong className="text-foreground">{t("Example:")}</strong>{" "}{t("a cost of R$100,000 and a sale of R$120,000 give R$20,000 profit, 20% ROI and a 16.67% margin. At a hypothetical CDI of 12% p.a., CDI matches that 20% in 19.3 months. With a six-month project cycle, its equivalent monthly ROI is 3.09% and CDI would earn about R$5,830: an estimated R$14,170 advantage.")}</p>
      <p><strong className="text-foreground">{t("4. Test price and delays.")}</strong>{" "}{t("Revenue needed to match CDI is the model's economic floor. Headroom measures the revenue reduction that still fits. The duration table holds costs constant: add expenses if the sale is delayed. Annualization assumes repetition/reinvestment and does not guarantee the project can be repeated.")}</p>
      <p><strong className="text-foreground">{t("5. Use simulation to test assumptions.")}</strong>{" "}{t("It changes only pending values. P10/P50/P90 are model percentiles, not observed market probabilities. ROI percentiles are calculated separately from profit percentiles. The chance of beating CDI considers each scenario's cost and duration.")}</p>
      <p><strong className="text-foreground">{t("6. Track cash without anticipating final results.")}</strong>{" "}{t("Receipts minus payments give operating cash flow. The balance including contributions also adds recorded funding; it excludes unrecorded withdrawals or debts. Final profit and ROI appear only when all entries are settled.")}</p>
      <details>
        <summary className="cursor-pointer font-medium text-primary">{t("Assumptions, limitations and formulas")}</summary>
        <div className="mt-3 space-y-3">
          <p>{t("A positive actual amount settles the entry; zero or blank means pending, even with a zero budget. Check “Settled at zero” for a cancelled expense or a revenue closed without receipts. This recognizes both genuine savings and a total loss without inventing a pending entry.")}</p>
          <p>{t("Equivalent monthly CDI = (1 + annual rate)^(1/12) − 1. Period CDI = (1 + annual rate)^(months/12) − 1. Months to match ROI = 12 × ln(1 + ROI) ÷ ln(1 + annual CDI), using decimal rates. A loss has no positive catch-up time with nonnegative CDI; zero CDI never matches a positive profit.")}</p>
          <p>{t("The benchmark treats all costs as available at the start and revenue at the end. For staggered payments or recurring receipts, it does not replace dated NPV/IRR. The comparison is gross: enter project taxes and use a benchmark with the same tax basis and currency.")}</p>
          <p>{t("Actual CDI compounds business-day rates. This planning model uses a constant annual rate and its monthly equivalent, without a holiday calendar or daily history.")}</p>
          <p>{t("References:")}{" "}<a className="text-primary underline" href="https://www.b3.com.br/pt_br/produtos-e-servicos/negociacao/juros/s_di_train_prog/02-taxas-de-juros.htm" target="_blank" rel="noreferrer">{t("B3 — rate conversion")}</a>{" "}{t("and")}{" "}<a className="text-primary underline" href="https://www.bcb.gov.br/acessoinformacao/calculadoradocidadao" target="_blank" rel="noreferrer">{t("Central Bank — interest and future value")}</a>.</p>
        </div>
      </details>
    </div>
  </section>
}
