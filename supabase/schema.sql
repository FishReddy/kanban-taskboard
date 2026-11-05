-- Taskboard schema. Paste into the Supabase SQL Editor and run.
-- Safe to re-run: every statement is idempotent.

create table if not exists public.tasks (
  id          uuid primary key default gen_random_uuid(),
  title       text not null check (char_length(btrim(title)) between 1 and 200),
  description text check (char_length(description) <= 5000),
  status      text not null default 'todo'
              check (status in ('todo', 'in_progress', 'in_review', 'done')),
  priority    text not null default 'normal'
              check (priority in ('low', 'normal', 'high')),
  due_date    date,
  -- Fractional sort key within a column, so a move only rewrites one row.
  position    double precision not null default 0,
  -- Anonymous guests are real auth.users rows, so this ties a task to its guest.
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists tasks_user_status_position_idx
  on public.tasks (user_id, status, position);

-- Keep updated_at honest regardless of what the client sends.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

-- Row Level Security: a user can only ever touch their own rows.
-- Anonymous sign-ins use the `authenticated` role, so signed-out requests
-- (the `anon` role) get nothing at all.
alter table public.tasks enable row level security;

revoke all on table public.tasks from anon;
grant select, insert, update, delete on table public.tasks to authenticated;

drop policy if exists "Users can read their own tasks" on public.tasks;
create policy "Users can read their own tasks"
  on public.tasks for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own tasks" on public.tasks;
create policy "Users can create their own tasks"
  on public.tasks for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own tasks" on public.tasks;
create policy "Users can update their own tasks"
  on public.tasks for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own tasks" on public.tasks;
create policy "Users can delete their own tasks"
  on public.tasks for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- Team members and assignees
-- ---------------------------------------------------------------------------

create table if not exists public.team_members (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(btrim(name)) between 1 and 50),
  color      text not null default '#5b5bd6' check (color ~ '^#[0-9a-f]{6}$'),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (id, user_id)
);

-- Lets task_assignees reference a task and its owner together.
create unique index if not exists tasks_id_user_id_key on public.tasks (id, user_id);

-- Many-to-many, because a task can have several assignees. Both foreign keys
-- include user_id, so the database itself guarantees that an assignment can
-- only link a task and a member belonging to the same user.
create table if not exists public.task_assignees (
  task_id    uuid not null,
  member_id  uuid not null,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (task_id, member_id),
  foreign key (task_id, user_id) references public.tasks (id, user_id) on delete cascade,
  foreign key (member_id, user_id) references public.team_members (id, user_id) on delete cascade
);

create index if not exists team_members_user_idx on public.team_members (user_id, created_at);
-- Support the cascades from a deleted member or user. Deleting a task is
-- already covered by the primary key, which starts with task_id.
create index if not exists task_assignees_member_user_idx on public.task_assignees (member_id, user_id);
create index if not exists task_assignees_user_idx on public.task_assignees (user_id);

alter table public.team_members enable row level security;
alter table public.task_assignees enable row level security;

revoke all on table public.team_members from anon;
revoke all on table public.task_assignees from anon;
grant select, insert, update, delete on table public.team_members to authenticated;
grant select, insert, delete on table public.task_assignees to authenticated;

drop policy if exists "Users can read their own team" on public.team_members;
create policy "Users can read their own team"
  on public.team_members for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can add to their own team" on public.team_members;
create policy "Users can add to their own team"
  on public.team_members for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own team" on public.team_members;
create policy "Users can update their own team"
  on public.team_members for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can remove from their own team" on public.team_members;
create policy "Users can remove from their own team"
  on public.team_members for delete to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can read their own assignments" on public.task_assignees;
create policy "Users can read their own assignments"
  on public.task_assignees for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own assignments" on public.task_assignees;
create policy "Users can create their own assignments"
  on public.task_assignees for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own assignments" on public.task_assignees;
create policy "Users can delete their own assignments"
  on public.task_assignees for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- Task comments
-- ---------------------------------------------------------------------------

-- The composite foreign key means a comment can only be attached to a task
-- owned by the same user. Comments are never edited, so there is no update
-- policy or grant.
create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  task_id    uuid not null,
  body       text not null check (char_length(btrim(body)) between 1 and 2000),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  foreign key (task_id, user_id) references public.tasks (id, user_id) on delete cascade
);

create index if not exists comments_task_created_idx on public.comments (task_id, created_at);
create index if not exists comments_user_created_idx on public.comments (user_id, created_at);

alter table public.comments enable row level security;

revoke all on table public.comments from anon;
grant select, insert, delete on table public.comments to authenticated;

drop policy if exists "Users can read their own comments" on public.comments;
create policy "Users can read their own comments"
  on public.comments for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own comments" on public.comments;
create policy "Users can create their own comments"
  on public.comments for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own comments" on public.comments;
create policy "Users can delete their own comments"
  on public.comments for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- Task activity log
-- ---------------------------------------------------------------------------

-- Written only by the triggers below, in the same transaction as the change, so
-- an entry exists exactly when the change saved and clients can't forge one.
-- clock_timestamp() gives changes saved together distinct, ordered times.
-- Values are copied in, so "Assigned Ada" still reads correctly after a rename.
create table if not exists public.task_activity (
  id         uuid primary key default gen_random_uuid(),
  task_id    uuid not null,
  user_id    uuid not null,
  action     text not null check (action in (
               'created', 'status', 'title', 'description', 'priority', 'due_date',
               'assigned', 'unassigned'
             )),
  from_value text,
  to_value   text,
  created_at timestamptz not null default clock_timestamp(),
  foreign key (task_id, user_id) references public.tasks (id, user_id) on delete cascade
);

create index if not exists task_activity_task_created_idx
  on public.task_activity (task_id, created_at desc);

alter table public.task_activity enable row level security;

revoke all on table public.task_activity from anon, authenticated;
grant select on table public.task_activity to authenticated;

drop policy if exists "Users can read their own activity" on public.task_activity;
create policy "Users can read their own activity"
  on public.task_activity for select to authenticated
  using ((select auth.uid()) = user_id);

-- security definer lets these insert although clients have no insert grant.
-- Each one only copies user_id from the row that fired it.
create or replace function public.log_task_changes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.task_activity (task_id, user_id, action)
    values (new.id, new.user_id, 'created');
    return null;
  end if;

  insert into public.task_activity (task_id, user_id, action, from_value, to_value)
  select new.id, new.user_id, change.action, change.from_value, change.to_value
  from (values
    ('status', old.status, new.status),
    ('title', old.title, new.title),
    ('priority', old.priority, new.priority),
    ('due_date', old.due_date::text, new.due_date::text)
  ) as change (action, from_value, to_value)
  where change.from_value is distinct from change.to_value;

  -- Descriptions can be long, so this records only that one changed.
  if new.description is distinct from old.description then
    insert into public.task_activity (task_id, user_id, action)
    values (new.id, new.user_id, 'description');
  end if;

  return null;
end;
$$;

create or replace function public.log_assignment_changes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  member_name text;
begin
  if tg_op = 'INSERT' then
    select name into member_name from public.team_members where id = new.member_id;
    insert into public.task_activity (task_id, user_id, action, to_value)
    values (new.task_id, new.user_id, 'assigned', member_name);
    return null;
  end if;

  -- When this delete is a cascade, the task may be gone, and there is nothing
  -- to log against. If the member is gone, log_member_removal already logged it.
  select name into member_name from public.team_members where id = old.member_id;
  if member_name is not null
     and exists (select 1 from public.tasks where id = old.task_id) then
    insert into public.task_activity (task_id, user_id, action, from_value)
    values (old.task_id, old.user_id, 'unassigned', member_name);
  end if;
  return null;
end;
$$;

-- Runs before the delete, while the member's name can still be read.
create or replace function public.log_member_removal()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.task_activity (task_id, user_id, action, from_value)
  select assignment.task_id, assignment.user_id, 'unassigned', old.name
  from public.task_assignees as assignment
  join public.tasks as task on task.id = assignment.task_id
  where assignment.member_id = old.id;
  return old;
end;
$$;

revoke execute on function public.log_task_changes() from public, anon, authenticated;
revoke execute on function public.log_assignment_changes() from public, anon, authenticated;
revoke execute on function public.log_member_removal() from public, anon, authenticated;

drop trigger if exists tasks_log_changes on public.tasks;
create trigger tasks_log_changes
  after insert or update on public.tasks
  for each row execute function public.log_task_changes();

drop trigger if exists task_assignees_log_changes on public.task_assignees;
create trigger task_assignees_log_changes
  after insert or delete on public.task_assignees
  for each row execute function public.log_assignment_changes();

drop trigger if exists team_members_log_removal on public.team_members;
create trigger team_members_log_removal
  before delete on public.team_members
  for each row execute function public.log_member_removal();

-- Tasks made before the log existed still get a starting entry.
insert into public.task_activity (task_id, user_id, action, created_at)
select task.id, task.user_id, 'created', task.created_at
from public.tasks as task
where not exists (
  select 1 from public.task_activity as activity
  where activity.task_id = task.id and activity.action = 'created'
);

-- Makes the API pick up the new tables straight away.
notify pgrst, 'reload schema';
