#!/usr/bin/env bash
# Runs the database security rule tests against a throwaway Postgres database.
# Needs psql and a Postgres server you can create databases on (PGHOST/PGUSER etc. are respected).
set -euo pipefail
cd "$(dirname "$0")/.."
DB="${RLS_TEST_DB:-vbj_rls_test}"
psql -q -v ON_ERROR_STOP=1 -d postgres -c "drop database if exists $DB" -c "create database $DB" >/dev/null
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f tests/supabase_stub.sql >/dev/null 2>&1
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f supabase/schema.sql >/dev/null 2>&1 || psql -v ON_ERROR_STOP=1 -d "$DB" -f supabase/schema.sql
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f supabase/schema.sql >/dev/null 2>&1  # must be safe to run twice
psql -qtA -v ON_ERROR_STOP=1 -d "$DB" -f tests/rls_test.sql 2>&1 | sed -e "s/^psql:[^ ]* NOTICE:  /  /" | grep -v "^$"
