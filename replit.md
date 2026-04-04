# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Artifacts

### P2P Dollar Tracker (mobile)
- **Type**: Expo mobile app
- **Path**: `artifacts/mobile/`
- **Preview**: `/`
- **Stack**: Expo Router, AsyncStorage, React Context
- **Features**:
  - Add USDT/BDT trades with buy rate and Binance fee
  - Sell price calculator with 1%, 2%, 3%, 5% profit targets
  - Trade detail with close trade flow (enter actual sell rate & amount)
  - Dashboard: portfolio summary, profit stats (today/month/all-time)
  - History: daily and monthly trade groupings
  - All data stored locally via AsyncStorage (no backend)

### API Server
- **Type**: Express REST API
- **Path**: `artifacts/api-server/`
- **Prefix**: `/api`

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
