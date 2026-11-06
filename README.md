# Taskboard

A Kanban board for planning and moving work, built with React, TypeScript and Supabase. Each visitor gets an automatic guest account, and Row Level Security keeps every guest's tasks private.

## Features

- Four columns: To Do, In Progress, In Review and Done
- Drag and drop between and within columns, by mouse, touch or keyboard
- Create, edit and delete tasks, with description, priority and due date
- A team of named, colour-coded members, with one or more assignees per task
- Due date badges on cards for overdue, due today and due soon, by icon, wording and colour
- Comments on each task, shown oldest first with timestamps, and a comment count on the card
- An activity timeline on each task, recording moves, edits, assignments and label changes
- Custom colour-coded labels, several per task
- Search by title, plus filters for priority, assignee and label that combine
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
supabase/schema.sql    Tables, constraints, trigger and RLS policies
src/lib/               Types, Supabase client, and pure board, due date, filter, team, label, comment and activity logic (tested)
src/hooks/             Auth, data loading, optimistic writes and the ordered write queue
src/components/        Board (drag and drop), Column, TaskCard, dialogs, avatars, UI states
src/styles.css         Design tokens and component styles
```

## Security

The app talks to Supabase directly from the browser using only the public key, so the database enforces access. RLS policies restrict all reads and writes to rows where `user_id` matches the signed-in guest, and signed-out requests are denied. Assignments, labels and comments also use composite foreign keys that include `user_id`, so the database rejects any link between records owned by different guests. The activity log is read-only for clients: database triggers write every entry in the same transaction as the change, so history can't be forged or edited and never records a change that failed to save.
