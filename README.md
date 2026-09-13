# CapitalScope

CapitalScope is a local-first investment analytics dashboard for comparing projected financial performance against actual results.

It helps you manage multiple investments, track costs and revenue, analyze variance, and evaluate risk using Monte Carlo simulations.

## Features

- Multi-investment portfolio tracking
- Projected vs actual comparison
- Revenue, cost, and profit analysis
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
npm run db:migrate
npm run db:seed
```

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
npm run db:migrate
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
