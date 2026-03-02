-- Création du bucket public pour les avatars
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);

-- Policies pour le storage 'avatars'
create policy "Les avatars sont publics." on storage.objects
  for select using (bucket_id = 'avatars');

create policy "Les utilisateurs peuvent uploader leur avatar." on storage.objects
  for insert with check (bucket_id = 'avatars');

create policy "Les utilisateurs peuvent modifier leur avatar." on storage.objects
  for update using (bucket_id = 'avatars');

create policy "Les utilisateurs peuvent supprimer leur avatar." on storage.objects
  for delete using (bucket_id = 'avatars');
