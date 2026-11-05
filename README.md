# Taskboard

A Kanban board for planning and moving work, built with React, TypeScript and Supabase. Each visitor gets an automatic guest account, and Row Level Security keeps every guest's tasks private.

## Features

- Four columns: To Do, In Progress, In Review and Done
- Drag and drop between and within columns, by mouse, touch or keyboard
- Create, edit and delete tasks, with description, priority and due date
- Instant updates that are undone with a message if a save fails
- Loading, empty and error states, light and dark themes, and a responsive layout

## Run locally

You need Node.js 20 or newer and a free [Supabase](https://supabase.com) project.

1. In the Supabase dashboard, turn on **Allow anonymous sign-ins** under Authentication > Sign In / Providers.
2. Paste [`supabase/schema.sql`](supabase/schema.sql) into the SQL Editor and run it.
3. Install dependencies and create your environment file:

   ```bash
   npm install
   cp .env.example .env.local
   ```

4. Fill in `.env.local` with your project URL and public key from Project Settings > API. Never use the service role key here.
5. Start the app at http://localhost:5173:

   ```bash
   npm run dev
   ```

| Command | What it does |
| --- | --- |
| `npm run dev` | Starts the dev server |
| `npm run build` | Type-checks and builds for production |
| `npm test` | Runs the unit tests |

## Deploy

Import the repository into Vercel, which detects Vite automatically, and add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables.

## How it's structured

```
supabase/schema.sql    Table, constraints, trigger and RLS policies
src/lib/               Types, Supabase client, and pure board logic (tested)
src/hooks/             useGuestSession (auth) and useTasks (data and optimistic writes)
src/components/        Board (drag and drop), Column, TaskCard, TaskDialog, UI states
src/styles.css         Design tokens and component styles
```

## Security

The app talks to Supabase directly from the browser using only the public key, so the database enforces access. RLS policies restrict all reads and writes to rows where `user_id` matches the signed-in guest, and signed-out requests are denied.
