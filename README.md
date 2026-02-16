# Team Workspace App

Team collaboration app built with Next.js App Router, Supabase, and Shadcn UI.

## PR-01 Scope

- Next.js App Router scaffold configured as project base.
- Supabase client wiring added for browser, server, and middleware session refresh.
- Shadcn setup files and base UI primitives (`Button`, `Card`) added.
- Shared app shell layout added.
- Environment variable template added.

## PR-02 Scope

- Added `/login` and `/signup` routes with email/password forms.
- Added server actions for sign up, login, and logout.
- Added auth-aware app shell actions:
  - Logged out: `Login`, `Sign up`
  - Logged in: `Dashboard`, `Logout`
- Added protected routes:
  - `/dashboard`
  - `/workspace/[id]`
- Added redirects:
  - Unauthenticated users are redirected to `/login` for protected routes.
  - Authenticated users are redirected to `/dashboard` from `/login` and `/signup`.

## PR-03 Scope

- Added SQL migrations under `supabase/migrations/`:
  - `001_schema.sql`: tables, constraints, indexes.
  - `002_rls_policies.sql`: helper functions + RLS policies.
  - `003_storage.sql`: storage bucket + storage object policies.
- Implemented role-aware RLS:
  - `owner`: workspace delete, member management, full note/file delete.
  - `member`: workspace read access, note create/edit own, file upload/delete own.
- Added storage access rules for `workspace-files` bucket path format:
  - `{workspace_id}/{file_name}`

## Tech Stack

- Next.js 16 (App Router)
- React 19
- Supabase (`@supabase/supabase-js`, `@supabase/ssr`)
- Shadcn UI primitives

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment file and set values from Supabase project settings:

```bash
cp .env.example .env.local
```

Required variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. Run the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Current Structure

- `src/lib/supabase/client.ts`: Browser Supabase client.
- `src/lib/supabase/server.ts`: Server Supabase client for App Router.
- `src/lib/supabase/middleware.ts`: Session sync helper used by middleware.
- `src/components/ui/*`: Shadcn-style UI primitives.
- `src/components/layout/app-shell.tsx`: Shared top-level app shell.
- `src/app/auth/actions.ts`: Server actions for login/signup/logout.
- `src/app/login/page.tsx`: Login page.
- `src/app/signup/page.tsx`: Signup page.
- `src/app/dashboard/page.tsx`: Protected dashboard placeholder.
- `src/app/workspace/[id]/page.tsx`: Protected workspace placeholder.
- `supabase/migrations/001_schema.sql`: relational schema.
- `supabase/migrations/002_rls_policies.sql`: RLS helpers and policies.
- `supabase/migrations/003_storage.sql`: storage bucket and policies.

## Next PR

PR-04 will implement dashboard workspace CRUD + join flow.
