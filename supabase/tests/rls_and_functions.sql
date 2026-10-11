-- Behaviour tests for the schema. Run by run.sh after the migration.
\set ON_ERROR_STOP on
create or replace function pg_temp.check(ok boolean, label text) returns void language plpgsql as $$
begin
  if not coalesce(ok, false) then raise exception 'FAILED: %', label; end if;
  raise notice 'ok - %', label;
end $$;
create or replace function pg_temp.act_as(uid text) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', coalesce(uid, ''), false);
  if uid is null then execute 'set role anon'; else execute 'set role authenticated'; end if;
end $$;
grant execute on all functions in schema pg_temp to anon, authenticated;

insert into auth.users values
  ('11111111-1111-1111-1111-111111111111', 'priya@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'jess@example.com');

-- Host creates a party
select pg_temp.act_as('11111111-1111-1111-1111-111111111111');
insert into events (party_date, start_time, end_time, venue_name, venue_address)
values ('2026-11-14', '14:00', '16:30', 'Jump Planet', '12 Riverside Way, London');
insert into event_children (event_id, position, name, age)
select id, 1, 'Maya', 6 from events union all select id, 2, 'Leo', 4 from events;
select pg_temp.check((select count(*) = 1 from events), 'host sees own event');
select pg_temp.check((select char_length(slug) = 10 from events), 'slug generated');
create temp table t_slug as select slug from events;
grant select on t_slug to anon, authenticated;
reset role;


-- Someone else
select pg_temp.act_as('22222222-2222-2222-2222-222222222222');
select pg_temp.check((select count(*) = 0 from events), 'other user cannot read the event');
select pg_temp.check((select count(*) = 0 from event_children), 'other user cannot read children');
reset role;

-- Anonymous guest
select pg_temp.act_as(null);
select pg_temp.check((select count(*) = 0 from events), 'anon cannot read events table');
select pg_temp.check((select get_invite((select slug from t_slug)) ->> 'venue_name') = 'Jump Planet', 'anon gets invite');
select pg_temp.check((select get_invite((select slug from t_slug)) ? 'owner_id') = false, 'invite hides owner');
select pg_temp.check((select jsonb_array_length(get_invite((select slug from t_slug)) -> 'children')) = 2, 'invite lists siblings');
select pg_temp.check((select get_invite('nope') is null), 'unknown slug returns null');

select pg_temp.check((select submit_rsvp((select slug from t_slug), repeat('a', 43), 'Jess & kids', true, 2, 1, 'nut allergy') ->> 'name') = 'Jess & kids', 'guest replies');
select pg_temp.check((select submit_rsvp((select slug from t_slug), repeat('a', 43), 'Jess & kids', true, 3, 1, null) ->> 'children')::int = 3, 'same token updates reply');
select pg_temp.check((select (get_my_rsvp((select slug from t_slug), repeat('a', 43)) ->> 'children')::int = 3), 'guest reads own reply');
select pg_temp.check((select get_my_rsvp((select slug from t_slug), repeat('b', 43)) is null), 'other token sees nothing');
select pg_temp.check((select (submit_rsvp((select slug from t_slug), repeat('c', 43), 'Okafors', false, 5, 5, null) ->> 'children')::int = 0), 'not coming zeroes counts');
do $$ begin
  perform submit_rsvp((select slug from t_slug), repeat('d', 43), 'Nobody', true, 0, 0, null);
  raise exception 'should have failed';
exception when check_violation then raise notice 'ok - coming needs at least one person';
end $$;
do $$ begin
  perform submit_rsvp((select slug from t_slug), 'short', 'X', true, 1, 0, null);
  raise exception 'should have failed';
exception when invalid_parameter_value then raise notice 'ok - short token rejected';
end $$;
select pg_temp.check((select count(*) = 0 from rsvps), 'anon cannot read rsvps table');
do $$ begin
  perform claim_rsvps(array[repeat('a', 43)]);
  raise exception 'should have failed';
exception when insufficient_privilege then raise notice 'ok - anon cannot claim';
end $$;
reset role;

-- Host sees and edits replies
select pg_temp.act_as('11111111-1111-1111-1111-111111111111');
select pg_temp.check((select count(*) = 2 from rsvps), 'host sees replies');
update rsvps set adults = 2, last_edited_by = 'host' where name = 'Jess & kids';
select pg_temp.check((select adults = 2 from rsvps where name = 'Jess & kids'), 'host edits reply');
insert into rsvps (event_id, name, attending, children, adults, last_edited_by)
select id, 'Told me at school', true, 1, 1, 'host' from events;
select pg_temp.check((select count(*) = 3 from rsvps), 'host adds reply');
reset role;

-- Guest signs up and claims the device reply
select pg_temp.act_as('22222222-2222-2222-2222-222222222222');
select pg_temp.check((select claim_rsvps(array[repeat('a', 43)]) = 1), 'guest claims reply');
select pg_temp.check((select claim_rsvps(array[repeat('a', 43)]) = 0), 'claim is one-off');
select pg_temp.check((select jsonb_array_length(my_invites()) = 1), 'claimed invite in Invited to');
select pg_temp.check((select (my_invites() -> 0 -> 'my_rsvp' ->> 'adults')::int = 2), 'account sees host edit');
select pg_temp.check((select (submit_rsvp((select slug from t_slug), null, 'Jess & kids', true, 1, 1, null) ->> 'claimed')::boolean), 'signed-in update without token');
select pg_temp.check((select count(*) = 0 from events), 'still cannot read event table');
reset role;

select pg_temp.act_as(null);
select pg_temp.check((select get_my_rsvp((select slug from t_slug), repeat('a', 43)) is null), 'retired token no longer works');
select pg_temp.check((select (submit_rsvp((select slug from t_slug), repeat('a', 43), 'Impostor', true, 1, 0, null) ->> 'name') = 'Impostor'), 'retired token makes a new reply, not an edit');
reset role;
select pg_temp.check((select name = 'Jess & kids' from rsvps where user_id = '22222222-2222-2222-2222-222222222222'), 'claimed reply untouched');

-- Closing replies
update events set rsvps_open = false;
select pg_temp.act_as(null);
do $$ begin
  perform submit_rsvp((select slug from t_slug), repeat('e', 43), 'Late', true, 1, 0, null);
  raise exception 'should have failed';
exception when raise_exception then raise notice 'ok - closed invite rejects replies';
end $$;
reset role;

-- save_event: atomic create and update with children
select pg_temp.act_as('11111111-1111-1111-1111-111111111111');
create temp table t_saved as select save_event(null,
  '{"party_date":"2026-12-05","start_time":"10:00","end_time":"","venue_name":"Rec Hall","venue_address":"1 High St"}',
  '[{"name":"Zoe","age":5,"photo_path":null,"photo_alt":"Photo of Zoe"}]') as r;
grant select on t_saved to anon, authenticated;
select pg_temp.check((select count(*) = 1 from event_children c join events e on e.id = c.event_id where e.venue_name = 'Rec Hall'), 'save_event creates party with child');
select save_event(((select r from t_saved) ->> 'id')::uuid,
  '{"party_date":"2026-12-05","start_time":"10:00","end_time":"12:00","venue_name":"Rec Hall","venue_address":"1 High St"}',
  '[{"name":"Zoe","age":5},{"name":"Max","age":""}]');
select pg_temp.check((select count(*) = 2 from event_children c join events e on e.id = c.event_id where e.venue_name = 'Rec Hall'), 'save_event replaces children');
select pg_temp.check((select end_time = '12:00' from events where venue_name = 'Rec Hall'), 'save_event updates fields');
reset role;
select pg_temp.act_as('22222222-2222-2222-2222-222222222222');
do $$ begin
  perform save_event(((select r from t_saved) ->> 'id')::uuid,
    '{"party_date":"2026-12-05","start_time":"10:00","venue_name":"Hacked","venue_address":"x"}', '[{"name":"X"}]');
  raise exception 'should have failed';
exception when no_data_found then raise notice 'ok - cannot save someone else''s party';
end $$;
reset role;
select pg_temp.check((select count(*) = 0 from events where venue_name = 'Hacked'), 'other party unchanged');
select pg_temp.act_as(null);
do $$ begin
  perform save_event(null, '{}', '[]');
  raise exception 'should have failed';
exception when insufficient_privilege then raise notice 'ok - anon cannot save events';
end $$;
reset role;
