-- Party Pop: core schema
-- Hosts own events; guests never touch tables directly and go through the
-- security-definer functions at the bottom of this file.

create extension if not exists pgcrypto with schema extensions;

-- 10-character, unguessable invite slug (no look-alike characters)
create or replace function public.gen_slug()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  alphabet constant text := 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  bytes bytea := extensions.gen_random_bytes(10);
  result text := '';
begin
  for i in 0..9 loop
    result := result || substr(alphabet, (get_byte(bytes, i) % length(alphabet)) + 1, 1);
  end loop;
  return result;
end;
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create table public.events (
  id               uuid primary key default gen_random_uuid(),
  owner_id         uuid not null default auth.uid() references auth.users on delete cascade,
  slug             text not null unique default public.gen_slug() check (char_length(slug) = 10),
  party_date       date not null,
  start_time       time not null,
  end_time         time,
  timezone         text not null default 'Europe/London',
  venue_name       text not null check (char_length(venue_name) between 1 and 120),
  venue_address    text not null check (char_length(venue_address) between 1 and 200),
  venue_maps_url   text check (venue_maps_url is null or venue_maps_url ~ '^https://'),
  parking_notes    text check (char_length(parking_notes) <= 500),
  parking_location text check (char_length(parking_location) <= 200),
  directions       text check (char_length(directions) <= 500),
  message          text check (char_length(message) <= 1000),
  rsvp_by          date,
  rsvps_open       boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  check (end_time is null or end_time > start_time)
);
create index events_owner_idx on public.events (owner_id, party_date);
create trigger events_touch before update on public.events
  for each row execute function public.touch_updated_at();

-- One row per birthday child; siblings share an event (max 4)
create table public.event_children (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events on delete cascade,
  position   smallint not null check (position between 1 and 4),
  name       text not null check (char_length(name) between 1 and 60),
  age        smallint check (age between 1 and 18),
  photo_path text,
  photo_alt  text check (char_length(photo_alt) <= 200),
  unique (event_id, position)
);

create table public.rsvps (
  id             uuid primary key default gen_random_uuid(),
  event_id       uuid not null references public.events on delete cascade,
  token_hash     text,      -- device token (sha-256 hex); null once claimed or host-added
  user_id        uuid references auth.users on delete set null,
  name           text not null check (char_length(name) between 1 and 80),
  attending      boolean not null,
  children       smallint not null default 0 check (children between 0 and 15),
  adults         smallint not null default 0 check (adults between 0 and 10),
  note           text check (char_length(note) <= 500),
  last_edited_by text not null default 'guest' check (last_edited_by in ('guest', 'host')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  check (not attending or children + adults >= 1),
  unique (event_id, token_hash),
  unique (event_id, user_id)
);
create trigger rsvps_touch before update on public.rsvps
  for each row execute function public.touch_updated_at();

-- Invites a signed-in user has opened, for "Invited to" across devices
create table public.saved_invites (
  user_id  uuid not null references auth.users on delete cascade,
  event_id uuid not null references public.events on delete cascade,
  saved_at timestamptz not null default now(),
  primary key (user_id, event_id)
);

alter table public.events         enable row level security;
alter table public.event_children enable row level security;
alter table public.rsvps          enable row level security;
alter table public.saved_invites  enable row level security;

create policy "hosts manage own events" on public.events for all to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

create policy "hosts manage own children" on public.event_children for all to authenticated
  using (exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid())));

create policy "hosts manage replies to own events" on public.rsvps for all to authenticated
  using (exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid())));

create policy "users read own saved invites" on public.saved_invites for select to authenticated
  using (user_id = (select auth.uid()));
create policy "users remove own saved invites" on public.saved_invites for delete to authenticated
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Guest-facing functions
-- ---------------------------------------------------------------------------

create or replace function public.hash_token(p_token text)
returns text
language sql
immutable
set search_path = ''
as $$ select encode(extensions.digest(p_token, 'sha256'), 'hex') $$;

-- Public invite fields (never the owner's identity)
create or replace function public.invite_json(e public.events)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'slug', e.slug,
    'party_date', e.party_date,
    'start_time', to_char(e.start_time, 'HH24:MI'),
    'end_time', to_char(e.end_time, 'HH24:MI'),
    'timezone', e.timezone,
    'venue_name', e.venue_name,
    'venue_address', e.venue_address,
    'venue_maps_url', e.venue_maps_url,
    'parking_notes', e.parking_notes,
    'parking_location', e.parking_location,
    'directions', e.directions,
    'message', e.message,
    'rsvp_by', e.rsvp_by,
    'rsvps_open', e.rsvps_open,
    'updated_at', e.updated_at,
    'is_host', e.owner_id = auth.uid(),
    'children', coalesce((
      select jsonb_agg(jsonb_build_object('name', c.name, 'age', c.age, 'photo_path', c.photo_path, 'photo_alt', c.photo_alt) order by c.position)
      from public.event_children c where c.event_id = e.id
    ), '[]'::jsonb)
  )
$$;
revoke execute on function public.invite_json(public.events) from public, anon, authenticated;

create or replace function public.get_invite(p_slug text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select public.invite_json(e) from public.events e where e.slug = p_slug
$$;

-- Summaries for the device's "My invites" list
create or replace function public.get_invites(p_slugs text[])
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(public.invite_json(e) order by e.party_date), '[]'::jsonb)
  from public.events e
  where e.slug = any (p_slugs[1:50])
$$;

create or replace function public.rsvp_json(r public.rsvps)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'id', r.id, 'name', r.name, 'attending', r.attending, 'children', r.children,
    'adults', r.adults, 'note', r.note, 'updated_at', r.updated_at,
    'last_edited_by', r.last_edited_by, 'claimed', r.user_id is not null)
$$;

create or replace function public.get_my_rsvp(p_slug text, p_token text default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  ev public.events;
  r public.rsvps;
begin
  select * into ev from public.events where slug = p_slug;
  if not found then return null; end if;
  if auth.uid() is not null then
    select * into r from public.rsvps where event_id = ev.id and user_id = auth.uid();
  end if;
  if r.id is null and p_token is not null then
    select * into r from public.rsvps where event_id = ev.id and token_hash = public.hash_token(p_token);
  end if;
  if r.id is null then return null; end if;
  return public.rsvp_json(r);
end;
$$;

-- Create or update the caller's reply. Signed-in callers are keyed by account,
-- everyone else by the device token.
create or replace function public.submit_rsvp(
  p_slug text, p_token text, p_name text, p_attending boolean,
  p_children int, p_adults int, p_note text default null)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  ev public.events;
  r public.rsvps;
  uid uuid := auth.uid();
  v_hash text;
  v_name text := btrim(coalesce(p_name, ''));
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
  v_children int := case when p_attending then coalesce(p_children, 0) else 0 end;
  v_adults int := case when p_attending then coalesce(p_adults, 0) else 0 end;
begin
  select * into ev from public.events where slug = p_slug;
  if not found then raise exception 'invite_not_found' using errcode = 'P0002'; end if;
  if not ev.rsvps_open then raise exception 'rsvps_closed' using errcode = 'P0001'; end if;
  if char_length(v_name) not between 1 and 80 then raise exception 'invalid_name' using errcode = '22023'; end if;

  if p_token is not null then
    if char_length(p_token) < 32 then raise exception 'invalid_token' using errcode = '22023'; end if;
    v_hash := public.hash_token(p_token);
  end if;

  if uid is not null then
    select * into r from public.rsvps where event_id = ev.id and user_id = uid;
    if r.id is null and v_hash is not null then
      -- adopt this device's earlier reply
      select * into r from public.rsvps where event_id = ev.id and token_hash = v_hash and user_id is null;
    end if;
  elsif v_hash is not null then
    select * into r from public.rsvps where event_id = ev.id and token_hash = v_hash;
  else
    raise exception 'token_required' using errcode = '22023';
  end if;

  if r.id is null then
    if (select count(*) from public.rsvps where event_id = ev.id) >= 200 then
      raise exception 'too_many_replies' using errcode = 'P0001';
    end if;
    insert into public.rsvps (event_id, token_hash, user_id, name, attending, children, adults, note, last_edited_by)
    values (ev.id, case when uid is null then v_hash end, uid, v_name, p_attending, v_children, v_adults, v_note, 'guest')
    returning * into r;
  else
    update public.rsvps set
      name = v_name, attending = p_attending, children = v_children, adults = v_adults,
      note = v_note, last_edited_by = 'guest',
      user_id = coalesce(user_id, uid),
      token_hash = case when coalesce(user_id, uid) is null then token_hash end
    where id = r.id
    returning * into r;
  end if;

  if uid is not null then
    insert into public.saved_invites (user_id, event_id) values (uid, ev.id) on conflict do nothing;
  end if;
  return public.rsvp_json(r);
end;
$$;

-- Move this device's replies into the signed-in account. Returns how many moved.
create or replace function public.claim_rsvps(p_tokens text[])
returns int
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  moved int;
begin
  if uid is null then raise exception 'not_signed_in' using errcode = '42501'; end if;
  with claimed as (
    update public.rsvps r set user_id = uid, token_hash = null
    where r.token_hash = any (select public.hash_token(t) from unnest(p_tokens[1:50]) t)
      and r.user_id is null
      and not exists (select 1 from public.rsvps o where o.event_id = r.event_id and o.user_id = uid)
    returning r.event_id
  ), saved as (
    insert into public.saved_invites (user_id, event_id)
    select uid, event_id from claimed on conflict do nothing
  )
  select count(*) into moved from claimed;
  return moved;
end;
$$;

-- Remember an invite opened while signed in
create or replace function public.save_invite(p_slug text)
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  insert into public.saved_invites (user_id, event_id)
  select auth.uid(), e.id from public.events e
  where e.slug = p_slug and auth.uid() is not null and e.owner_id <> auth.uid()
  on conflict do nothing
$$;

-- "Invited to" for the signed-in user, with their reply if any
create or replace function public.my_invites()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(public.invite_json(e) || jsonb_build_object('my_rsvp',
           (select public.rsvp_json(r) from public.rsvps r where r.event_id = e.id and r.user_id = auth.uid()))
         order by e.party_date), '[]'::jsonb)
  from public.saved_invites s join public.events e on e.id = s.event_id
  where s.user_id = auth.uid()
$$;

-- ---------------------------------------------------------------------------
-- Host-facing: save a party and its children in one transaction.
-- Runs as the caller, so row level security decides what they may change.
-- ---------------------------------------------------------------------------
create or replace function public.save_event(p_event_id uuid, p_event jsonb, p_children jsonb)
returns jsonb
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  v public.events;
begin
  if auth.uid() is null then raise exception 'not_signed_in' using errcode = '42501'; end if;
  if jsonb_array_length(p_children) not between 1 and 4 then
    raise exception 'invalid_children' using errcode = '22023';
  end if;
  if p_event_id is null then
    insert into public.events (party_date, start_time, end_time, venue_name, venue_address, venue_maps_url,
                               parking_notes, parking_location, directions, message, rsvp_by)
    values ((p_event->>'party_date')::date, (p_event->>'start_time')::time, nullif(p_event->>'end_time', '')::time,
            p_event->>'venue_name', p_event->>'venue_address', nullif(p_event->>'venue_maps_url', ''),
            nullif(p_event->>'parking_notes', ''), nullif(p_event->>'parking_location', ''),
            nullif(p_event->>'directions', ''), nullif(p_event->>'message', ''), nullif(p_event->>'rsvp_by', '')::date)
    returning * into v;
  else
    update public.events set
      party_date = (p_event->>'party_date')::date,
      start_time = (p_event->>'start_time')::time,
      end_time = nullif(p_event->>'end_time', '')::time,
      venue_name = p_event->>'venue_name',
      venue_address = p_event->>'venue_address',
      venue_maps_url = nullif(p_event->>'venue_maps_url', ''),
      parking_notes = nullif(p_event->>'parking_notes', ''),
      parking_location = nullif(p_event->>'parking_location', ''),
      directions = nullif(p_event->>'directions', ''),
      message = nullif(p_event->>'message', ''),
      rsvp_by = nullif(p_event->>'rsvp_by', '')::date
    where id = p_event_id
    returning * into v;
    if v.id is null then raise exception 'event_not_found' using errcode = 'P0002'; end if;
  end if;

  delete from public.event_children where event_id = v.id;
  insert into public.event_children (event_id, position, name, age, photo_path, photo_alt)
  select v.id, t.ord::smallint, t.c->>'name', nullif(t.c->>'age', '')::smallint,
         nullif(t.c->>'photo_path', ''), nullif(t.c->>'photo_alt', '')
  from jsonb_array_elements(p_children) with ordinality as t(c, ord);

  return jsonb_build_object('id', v.id, 'slug', v.slug);
end;
$$;

revoke execute on function public.claim_rsvps(text[]) from public, anon;
revoke execute on function public.save_event(uuid, jsonb, jsonb) from public, anon;
revoke execute on function public.my_invites() from public, anon;
revoke execute on function public.save_invite(text) from public, anon;
grant execute on function public.get_invite(text), public.get_invites(text[]), public.get_my_rsvp(text, text),
  public.submit_rsvp(text, text, text, boolean, int, int, text) to anon, authenticated;
grant execute on function public.claim_rsvps(text[]), public.my_invites(), public.save_invite(text),
  public.save_event(uuid, jsonb, jsonb) to authenticated;
