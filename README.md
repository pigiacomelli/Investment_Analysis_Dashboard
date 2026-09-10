# CapitalScope

**Local Investment Analytics Dashboard**

A local-first investment analytics platform designed to compare projected financial performance against actual results.

---

## Overview

CapitalScope allows you to create multiple investments, businesses, projects, or capital allocations and track their financial performance with full projected vs. actual analysis. All data is stored locally using SQLite — no cloud dependencies, no external APIs, no authentication required.

## Features

- **Multi-investment portfolio** — Track unlimited investments across categories
- **Projected vs Actual analysis** — Compare expected performance against reality
- **Cost management** — Fixed and variable costs with recurrence tracking
- **Revenue tracking** — Multiple revenue streams per investment
- **Capital contributions** — Track additional capital injections over time
- **Financial KPIs** — ROI, profit margins, variance analysis
- **Interactive charts** — Revenue, costs, profit comparisons, portfolio allocation
- **Cash flow view** — Monthly cash flow analysis with cumulative tracking
- **Portfolio analytics** — Cross-investment comparison and ranking
- **Data persistence** — SQLite database, data survives restarts
- **Offline-first** — Works completely without internet after installation

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  Next.js App                     │
│  ┌───────────┐  ┌───────────┐  ┌─────────────┐ │
│  │ Dashboard  │  │Investments│  │  Analytics   │ │
│  └─────┬─────┘  └─────┬─────┘  └──────┬──────┘ │
│        │               │               │        │
│  ┌─────┴───────────────┴───────────────┴──────┐ │
│  │          Financial Engine (Pure TS)         │ │
│  │  ROI · Profit · Variance · Cash Flow       │ │
│  └─────────────────┬──────────────────────────┘ │
│                    │                             │
│  ┌─────────────────┴──────────────────────────┐ │
│  │         Prisma ORM + Server Actions         │ │
│  └─────────────────┬──────────────────────────┘ │
│                    │                             │
│  ┌─────────────────┴──────────────────────────┐ │
│  │              SQLite Database                │ │
│  │         data/capitalscope.db                │ │
│  └────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React, TypeScript |
| Styling | Tailwind CSS |
| Database | SQLite |
| ORM | Prisma |
| Charts | Recharts |
| Validation | Zod |
| Testing | Vitest |
| Forms | React Hook Form |

## Database Model

```
Investment (1) ──── (N) Cost
             (1) ──── (N) Revenue
             (1) ──── (N) CapitalContribution
```

### Investment
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| name | String | Investment name |
| category | String | Business, Real Estate, etc. |
| status | Enum | PLANNED, ACTIVE, COMPLETED, CANCELLED |
| initialInvestment | Float | Starting capital |
| currency | String | EUR, USD, BRL, GBP |

### Cost
| Field | Type | Description |
|-------|------|-------------|
| costType | Enum | FIXED or VARIABLE |
| projectedAmount | Float | Expected cost |
| actualAmount | Float | Actual cost |
| recurrence | Enum | ONE_TIME, MONTHLY, etc. |

### Revenue
| Field | Type | Description |
|-------|------|-------------|
| projectedAmount | Float | Expected revenue |
| actualAmount | Float | Actual revenue |

## Financial Metrics

### Profit
```
Projected Profit = Projected Revenue - Projected Total Costs
Actual Profit = Actual Revenue - Actual Total Costs
```

### ROI (Return on Investment)
```
ROI = (Profit / Total Invested Capital) × 100
Total Invested Capital = Initial Investment + Σ Capital Contributions
```

### Variance
```
Revenue Variance = Actual Revenue - Projected Revenue   (positive = favorable)
Cost Variance = Actual Costs - Projected Costs           (positive = unfavorable)
Profit Variance = Actual Profit - Projected Profit       (positive = favorable)
```

### Portfolio ROI
```
Portfolio ROI = (Total Portfolio Profit / Total Portfolio Capital) × 100
```
> Portfolio ROI is calculated from aggregate totals, NOT averaged from individual ROIs.

### Monetary Values
SQLite does not have a native Decimal type. This application uses Float for monetary storage. All display formatting uses `Intl.NumberFormat` for proper locale-aware currency display. For production use with large monetary values, consider migrating to integer minor-currency-unit storage.

## Installation

```bash
git clone <repository-url>
cd Investment_Analysis_Dashboard
npm install
```

## Running Locally

```bash
# Initialize the database
npm run db:migrate

# (Optional) Seed with demo data
npm run db:seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Database

```bash
npm run db:migrate    # Run migrations
npm run db:seed       # Seed demo data
npm run db:studio     # Open Prisma Studio
```

Database file: `data/capitalscope.db`

## Testing

```bash
npm run test          # Run all tests
```

Tests cover:
- ROI calculations
- Zero capital edge case
- Negative profit scenarios
- Projected vs actual variance
- Fixed/variable cost aggregation
- Portfolio ROI (aggregate, not averaged)
- Capital contributions
- Cash flow monthly aggregation
- Empty investment handling

## Project Structure

```
src/
  app/                    # Next.js App Router pages
    page.tsx              # Dashboard
    investments/          # Investment CRUD pages
    analytics/            # Portfolio analytics
  components/
    dashboard/            # Dashboard charts
    investments/          # Investment forms and details
    layout/               # Sidebar, Header
    ui/                   # Reusable UI primitives
  lib/
    actions.ts            # Server Actions (CRUD)
    db.ts                 # Prisma client singleton
    finance/              # Financial calculation engine
    validation/           # Zod schemas
    utils/                # Formatting utilities
prisma/
  schema.prisma           # Database schema
  seed.ts                 # Demo data
data/
  capitalscope.db         # SQLite database
```

## Roadmap

Future features designed for but not yet implemented:

- [ ] NPV / Net Present Value
- [ ] IRR / Internal Rate of Return
- [ ] Payback Period
- [ ] Scenario Analysis (Bull/Base/Bear)
- [ ] CSV/Excel import/export
- [ ] PDF financial reports
- [ ] Multiple portfolios
- [ ] Currency conversion with historical FX rates
- [ ] Authentication
- [ ] Cloud synchronization

## License

MIT
