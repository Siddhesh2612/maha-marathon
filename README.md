# MAHA Marathon 2026

A Next.js demo for marathon registration and event operations, built as freelance work for a client. It brings public registration, an officer dashboard, and admin and volunteer tools into one application.

**Demo:** https://maha-marathon.vercel.app

## What it does

- Registers participants and assigns district-prefixed Bib numbers through a Supabase database function.
- Shows aggregate registration statistics and an interactive Maharashtra district map on a login-gated dashboard.
- Uses Supabase Auth, roles, and permissions for admin and volunteer access. Admins can manage volunteer accounts; volunteers can search participants and check them in according to their permissions.

## Stack

Next.js 16, React 19, TypeScript, Supabase Auth and PostgreSQL, Vercel.

## Run locally

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
3. Apply the SQL files in `supabase/migrations/` in order to a Supabase project.
4. Run `npm run dev` and open http://localhost:3000.

The admin volunteer-management route also needs `SUPABASE_SECRET_KEY` set **only on the server**. Never add that key to a `NEXT_PUBLIC_` variable or commit it to Git.

This repository represents a demo. The architecture choices and remaining production work, including registration abuse controls, are recorded in [DECISIONS.md](DECISIONS.md).
