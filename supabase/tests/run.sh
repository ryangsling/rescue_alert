#!/usr/bin/env bash
# Applies every migration to a fresh database, then runs each
# supabase/tests/*.test.sql file. A test fails by raising an exception.
# Needs PG* env vars pointing at a Postgres server with PostGIS available
# (CI uses a postgis service container).
set -euo pipefail
cd "$(dirname "$0")/../.."
db="rescue_alert_test"

psql -d postgres -qc "drop database if exists $db" -c "create database $db"
psql -d "$db" -q -v ON_ERROR_STOP=1 -f supabase/tests/setup.sql
psql -d "$db" -qc "alter database $db set search_path = public, extensions"

for f in supabase/migrations/*.sql; do
  psql -d "$db" -q -v ON_ERROR_STOP=1 -f "$f"
done

for f in supabase/tests/*.test.sql; do
  echo "== $f"
  psql -d "$db" -q -v ON_ERROR_STOP=1 -f "$f"
done
echo "all sql tests passed"
