create extension if not exists pgcrypto;

create table if not exists public.task_tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  color text not null default '#4F46E5',
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text,
  tag_id uuid references public.task_tags(id),
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_tasks_tag_id on public.tasks(tag_id);
create index if not exists idx_tasks_status on public.tasks(status);
