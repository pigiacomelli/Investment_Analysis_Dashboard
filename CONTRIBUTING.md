# Contributing to CapitalScope

Thank you for your interest in contributing to CapitalScope!

## Development Setup

1. Fork and clone the repository
2. Install dependencies: `npm install`
3. Set up the database: `npm run db:migrate`
4. Seed demo data: `npm run db:seed`
5. Start the dev server: `npm run dev`

## Code Guidelines

- **Financial logic** belongs in `src/lib/finance/` — never in UI components
- **Validation** uses Zod schemas in `src/lib/validation/`
- **Database access** goes through Prisma in `src/lib/actions.ts`
- **Tests** are required for financial calculations
- Use TypeScript strictly — no `any` types unless absolutely necessary

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes
3. Run `npm run test` and `npm run build`
4. Submit a pull request with a clear description

## Reporting Issues

Please include:
- Steps to reproduce
- Expected behavior
- Actual behavior
- Browser and OS information
