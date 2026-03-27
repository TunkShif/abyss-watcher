# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Abyss Watcher** is a Steam player tracking and monitoring dashboard built with React Router 7 (full-stack SSR). It monitors player online status and game activity, sending notifications via OneBot (QQ bot protocol) when players start playing games.

## Tech Stack

- **Runtime**: Bun
- **Framework**: React Router 7 (SSR mode)
- **Database**: SQLite via Drizzle ORM
- **Cache**: Redis (via `Cache` module in `app/lib/cache.ts`)
- **Styling**: TailwindCSS v4
- **Linting/Formatting**: Biome (`biome.json`)
- **Scheduling**: Croner (cron jobs)
- **Validation**: Valibot
- **Logging**: Pino with pino-roll for log rotation

## Common Commands

```bash
# Development
bun run dev                    # Start dev server with HMR
bun run build                  # Production build
bun run start                  # Start production server

# Type checking
bun run typecheck              # Run React Router typegen + TypeScript

# Database (Drizzle)
bun run db:push                # Push schema changes to database
bun run db:generate            # Generate migrations
bun run db:migrate             # Apply migrations
bun run db:studio             # Open Drizzle Studio

# Linting
npx @biomejs/biome lint ./app  # Lint app directory
npx @biomejs/biome format ./app # Format app directory
```

## Architecture

### Route Structure

Routes are defined in `app/routes.ts` using React Router's file-based routing config:

- `/` → `routes/_index.tsx` (redirects to dashboard)
- `/login` → `routes/login/route.tsx` (two-step auth: request code → verify)
- `/logout` → `routes/logout.tsx`
- `/dashboard` → `routes/dashboard/route.tsx` (protected, requires auth)

### Service Modules (`app/lib/modules/`)

The app uses a service-based architecture. Each module exports a service object with business logic:

- **auth** - Authentication via OneBot verification codes. Uses cookie-based sessions.
- **session** - Session token management stored in SQLite
- **player** - Steam player data fetching and caching
- **group** - Player group management (many-to-many with users)
- **tracker** - Background job that detects player state changes (Cron: every 10 minutes)
- **notify** - OneBot message sending (auth codes, activity notifications)
- **render** - Message rendering templates for OneBot
- **user** - User administration and permission checking

### External Integrations (`app/lib/clients/`)

- **steam** - Steam Web API client for fetching player summaries
- **onebot** - OneBot API client for sending messages to QQ

### Database Schema (`app/lib/database/schema.ts`)

Uses Drizzle ORM with SQLite. Key tables:
- `players_users` - Maps users to their Steam player IDs
- `groups_users` - Maps users to groups (for permission management)

### Cache Layer (`app/lib/cache.ts`)

Redis-based cache with Valibot schema validation support. Used for:
- Player summaries (1 hour TTL)
- Verification code hashes

### Logging (`app/lib/logging.ts`)

Pino logger with two output modes:
- **Development**: Pretty console output + file
- **Production**: JSON to stdout + pino-roll daily rotation (14 day retention)

## Environment Variables

Required in `.env`:
- `DATABASE_URL` - SQLite database path (e.g., `file:local.db`)
- `REDIS_URL` - Redis connection string
- `LOGGING_FILE` - Path for log file
- `ABYSS_SECRET` - Session cookie secret
- `STEAM_WEBAPI_TOKEN` - Steam Web API key
- `ONEBOT_BASE_URL` - OneBot bot HTTP API URL
- `ONEBOT_TOKEN` - OneBot authentication token

## Key Patterns

### Authentication Flow
1. User submits QQ号 on login page
2. Server generates verification code, sends via OneBot to user
3. User enters code to complete login
4. Server creates session, sets cookie

### Player Tracking Flow
1. `Tracker` runs every 10 minutes via Cron
2. Fetches latest Steam player summaries
3. Compares with previously stored summaries
4. Detects game start events
5. Sends OneBot notification to associated groups

### Dashboard Data Loading
The dashboard loader parallelizes independent fetches:
```typescript
const [players, allGroups] = await Promise.all([PlayerService.list(), GroupService.listGroups()]);
```
Then parallelizes dependent fetches:
```typescript
const [summaries, playerGroups] = await Promise.all([
  PlayerService.fetchLatestSummaries(playerIds),
  GroupService.listPlayerGroupIds(playerIds),
]);
```
