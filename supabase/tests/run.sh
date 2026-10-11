#!/usr/bin/env bash
# Applies the migrations to an empty Postgres database and runs the behaviour
# tests. DATABASE_URL must point at a throwaway database.
set -euo pipefail
shopt -s lastpipe
: "${DATABASE_URL:?Set DATABASE_URL to an empty, throwaway Postgres database}"
here="$(cd "$(dirname "$0")" && pwd)"
psql "$DATABASE_URL" -q -v ON_ERROR_STOP=1 -f "$here/supabase_stubs.sql"
# The storage migration needs Supabase's storage schema, so only the core runs here
psql "$DATABASE_URL" -q -v ON_ERROR_STOP=1 -f "$here/../migrations/20261011000000_init.sql"
psql "$DATABASE_URL" -q -v ON_ERROR_STOP=1 -o /dev/null -f "$here/rls_and_functions.sql" 2>&1 | sed -n -e "s/.*NOTICE:  //p" -e "/ERROR/p"
echo "All database tests passed"
