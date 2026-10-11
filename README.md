# Party Pop

Comic-style party invites for kids’ birthdays. A host makes an invite, shares one link in a chat, and guests reply with how many children and adults are coming. Built with Next.js and Supabase, hosted on Vercel.

The product requirements and clickable prototype are in [`docs/party-pop-prototype.html`](docs/party-pop-prototype.html).

## What’s built

- **Hosts** sign in with an email magic link or 6-digit code, create invites for one to four children (with photos), share the link, and see and edit replies with a head count of children and adults.
- **Guests** need no account. The invite page shows the details with Google Maps links for the venue and parking, and the reply is kept on their device so the same link lets them change it.
- **Link previews**: each invite has server-rendered Open Graph tags and a generated 1200×630 preview image for WhatsApp, Messenger and iMessage.
- **Installable apps**: each invite can be added to the home screen as its own app named after the party (`/i/{slug}`), and Party Pop is a separate app for signed-in users (`/app`). A fixed bottom banner offers the right one, and helps guests leave Messenger’s or Facebook’s built-in browser.
- **Guest to host**: after replying, guests are invited to make their own invite. Signing up moves the replies saved on their device into the new account.

Not built yet: offline support (service worker), the iPhone storage hand-off between Safari and installed apps, “Add to calendar”, CSV export, live reply updates, and the 60-day automatic clean-up.

## Project layout

```
src/app/                  routes (App Router)
  i/[slug]/               guest invite page, preview image, per-invite manifest and icons
  me/                     guest’s “My invites” on this device
  app/                    signed-in area: sign-in, dashboard, events, invites, Party Pop manifest
src/components/           UI (RsvpPanel, EventForm, ReplyManager, InstallBanner…)
src/lib/                  helpers: invite text and dates, validation, browser detection, Supabase clients
src/proxy.ts              refreshes the session; keeps signed-out visitors out of /app
supabase/migrations/      database schema, row level security, database functions, storage bucket
supabase/tests/           database behaviour tests (run against plain Postgres)
```

## Set up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Apply the migrations in `supabase/migrations/` in order, either with the Supabase CLI (`supabase link` then `supabase db push`) or by pasting each file into the SQL editor.
3. **Authentication → URL Configuration**: set the Site URL to your site, and add `https://YOUR-SITE/app/auth/confirm**` (and `http://localhost:3000/app/auth/confirm**` for local work) to the Redirect URLs.
4. **Authentication → Email Templates → Magic Link** (also **Confirm signup**): the link must go to the confirm page, and the email should include the code for people using the installed app on iPhone, where email links open Safari instead:

   ```html
   <h2>Your Party Pop sign-in</h2>
   <p><a href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email">Sign in to Party Pop</a></p>
   <p>Or type this code: <strong>{{ .Token }}</strong></p>
   <p>The link and code expire in 1 hour.</p>
   ```

5. **Authentication → Emails → SMTP**: set up a custom SMTP provider (for example Resend). Supabase’s built-in sender is rate-limited and only meant for testing.

## Run locally

```bash
cp .env.example .env.local   # fill in your Supabase URL and publishable key
npm install
npm run dev
```

Open http://localhost:3000.

## Checks

```bash
npm run lint        # ESLint
npm run typecheck   # route types + TypeScript
npm test            # unit tests (Vitest)
DATABASE_URL=postgresql://… npm run test:db   # schema and access-rule tests on an empty, throwaway Postgres
npm run build
```

`test:db` loads small stand-ins for Supabase’s `auth` schema and roles, applies the core migration and checks the access rules: hosts only see their own parties, guests only reach invites through the database functions, replies move into an account on sign-up, and so on. CI runs all of the above.

## Deploy to Vercel

1. Import the GitHub repository in Vercel.
2. Add the environment variables from `.env.example` (`NEXT_PUBLIC_SITE_URL` is your production address).
3. Add your production URL to Supabase’s Redirect URLs (step 3 above).

## Design decisions worth knowing

- **Guests never read tables directly.** Every guest action goes through a `security definer` function (`get_invite`, `submit_rsvp`, `get_my_rsvp`, `get_invites`). A guest’s right to change a reply comes from a random token kept in their browser; the database stores only its SHA-256 hash.
- **Replies in an account are locked to it.** When a guest signs up, `claim_rsvps` attaches their device’s replies to the account and retires the device tokens.
- **Dates are calendar dates.** Parties store `party_date`, `start_time` and `end_time` plus a time zone (default Europe/London), so a 2pm party shows as 2pm everywhere.
- **Photos** are resized and re-encoded in the browser before upload, which removes location data. They live at `invite-photos/{user_id}/{uuid}.jpg`, readable by unguessable path (chat apps need them for previews) and writable only by their owner.
- **Invite apps and Party Pop don’t overlap**: invite apps cover `/i/{slug}`, Party Pop covers `/app`. See the PRD (§9b) for why, and for the real-device test (milestone M0) still to run.
