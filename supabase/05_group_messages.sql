-- Création de la table des messages de groupe
create table if not exists public.group_messages (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users not null,
    content text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Activer RLS
alter table public.group_messages enable row level security;

-- Politiques RLS
create policy "Les utilisateurs authentifiés peuvent lire les messages"
    on public.group_messages for select
    to authenticated
    using (true);

create policy "Les utilisateurs authentifiés peuvent envoyer des messages"
    on public.group_messages for insert
    to authenticated
    with check (auth.uid() = user_id);

-- Activer le mode temps réel sur cette table
alter publication supabase_realtime add table public.group_messages;
