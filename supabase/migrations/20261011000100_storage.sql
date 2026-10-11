-- Photo storage. Paths are "{user_id}/{uuid}.jpg"; anyone can read a photo by
-- its unguessable path (chat apps need it for link previews), only the owner
-- can write.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('invite-photos', 'invite-photos', true, 2097152, array['image/jpeg'])
on conflict (id) do nothing;

create policy "owners upload invite photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'invite-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "owners replace invite photos" on storage.objects for update to authenticated
  using (bucket_id = 'invite-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "owners delete invite photos" on storage.objects for delete to authenticated
  using (bucket_id = 'invite-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
