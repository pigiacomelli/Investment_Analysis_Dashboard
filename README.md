# CapitalScope

CapitalScope is a local-first investment analytics dashboard for comparing projected financial performance against actual results.

It helps you manage multiple investments, track costs and revenue, analyze variance, and evaluate risk using Monte Carlo simulations.

## Features

- Multi-investment portfolio tracking
- Projected vs actual comparison
- Revenue, cost, and profit analysis
- Planned vs Actual Costs tab with cost variance, category mix, and monthly trends
- Revenue variance and actual profit margin metrics
- Capital contribution tracking
- ROI and variance metrics
- Cash flow monitoring
- Interactive charts and analytics
- Monte Carlo simulation for risk analysis
- Local SQLite persistence
- Offline-first workflow

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Prisma ORM
- SQLite
- Recharts
- Tailwind CSS
- Vitest

## Project Overview

CapitalScope is designed for founders, investors, and operators who want a simple way to evaluate the financial performance of one or more projects without relying on a cloud backend.

The app stores its data locally and exposes a dashboard for analyzing:

- projected revenue and cost
- actual revenue and cost
- profit and margin variance
- portfolio-level metrics
- scenario-based risk estimation

## Language

English is the default. Use the **Language** selector in the header to switch to **Português**. The preference is stored in this browser for one year and applies to all screens, metric explanations, forms, confirmations, dates, numbers and currencies. Project names and recorded financial values are preserved.

## Metrics and interpretation

The detail view, project list and portfolio share the same financial definitions. Forecasts combine recorded actuals with pending planned values. Recorded operating cash flow is shown separately from final profit; funding enters cash balance and is not counted again as an expense. ROI uses total project costs, with unavailable ratios shown as a dash rather than zero.

Each cost row is one dated occurrence; recurrence is informational. A positive actual amount settles the entire line. Blank or zero actual amounts remain pending unless **Liquidado a zero** is checked. Split partial payments or receipts into settled and pending rows. Cost variance matches only recorded rows with their own planned amounts.

The CDI planning panel offers per-project saved duration and hypothetical annual benchmark rate, compound monthly return, opportunity cost, minimum revenue to match the benchmark, price headroom and months until CDI matches total project ROI. Defaults are examples, not a live quote. It assumes total cost upfront and revenue at the end, with a constant gross benchmark rate. It is not historical CDI or dated NPV/IRR. Portfolio totals are grouped by currency and use cost-weighted aggregate ROI.

The risk simulation varies only pending amounts, locks realised lines (and duration for fully settled projects), and compares each scenario with CDI using its own cost and duration. Tail results are labelled as profit percentiles rather than falsely presenting positive profits as VaR losses.

Read [the practical metrics guide](docs/METRICS.md), or open **Como usar** in a project.

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Installation

```bash
git clone <repository-url>
cd Investment_Analysis_Dashboard
npm install
```

### Database setup

```bash
npx prisma migrate deploy
npx prisma generate
# Optional demo data for an empty workspace:
npm run db:seed
```

`npm run db:seed` replaces the existing local investment records with demo data. Skip it if you already have data you want to keep.

### Run the app locally

```bash
npm run dev
```

Then open: http://localhost:3000

## Available Scripts

```bash
npm run dev
npm run build
npm run start
npm run test
npm run lint
npx prisma migrate deploy
npx prisma generate
# Optional demo data for an empty workspace:
npm run db:seed
npm run db:studio
```

## Project Structure

```text
.
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── src/
│   ├── app/
│   ├── components/
│   └── lib/
├── data/
│   └── capitalscope.db
├── public/
├── .env.example
├── .gitignore
├── package.json
├── next.config.ts
├── tsconfig.json
├── README.md
└── LICENSE
```

## Notes

- The application uses SQLite for local persistence.
- The database file is intentionally ignored in Git to avoid committing local data.
- `.env.example` can be copied to `.env` for local environment configuration when needed.

## License

MIT
