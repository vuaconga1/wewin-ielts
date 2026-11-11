#!/usr/bin/env bash
# Copy production DB (PROD_DATABASE_URL in .env.prod) over the local DB (DATABASE_URL in .env).
# Production is only read (pg_dump). Local is backed up to backups/ before being replaced.
set -euo pipefail

cd "$(dirname "$0")/.."

read_env() {
  local file="$1" key="$2"
  [ -f "$file" ] || return 0
  grep -E "^${key}=" "$file" | tail -1 | cut -d= -f2- | sed -E 's/^"(.*)"$/\1/; s/^'"'"'(.*)'"'"'$/\1/'
}

PROD_URL="$(read_env .env.prod PROD_DATABASE_URL)"
LOCAL_URL="$(read_env .env DATABASE_URL)"

[ -n "$PROD_URL" ] || { echo "Thiếu PROD_DATABASE_URL trong .env.prod" >&2; exit 1; }
[ -n "$LOCAL_URL" ] || { echo "Thiếu DATABASE_URL trong .env" >&2; exit 1; }

# Neon pooler (pgbouncer) is unreliable for pg_dump/pg_restore; use the direct endpoint.
direct() { echo "$1" | sed -E 's/-pooler\././'; }
PROD_URL="$(direct "$PROD_URL")"
LOCAL_URL="$(direct "$LOCAL_URL")"

host_of() { echo "$1" | sed -E 's#^[a-z]+://[^@]*@([^/:?]+).*#\1#'; }
PROD_HOST="$(host_of "$PROD_URL")"
LOCAL_HOST="$(host_of "$LOCAL_URL")"

if [ "$PROD_HOST" = "$LOCAL_HOST" ]; then
  echo "PROD và LOCAL cùng host ($PROD_HOST) — dừng để tránh ghi đè production." >&2
  exit 1
fi

echo "PROD : $PROD_HOST (chỉ đọc)"
echo "LOCAL: $LOCAL_HOST (sẽ bị thay thế)"
if [ "${YES:-}" != "1" ]; then
  read -r -p "Tiếp tục? [y/N] " ans
  [ "$ans" = "y" ] || [ "$ans" = "Y" ] || exit 1
fi

mkdir -p backups
STAMP="$(date +%Y%m%d-%H%M%S)"
LOCAL_BACKUP="backups/local-before-sync-$STAMP.dump"
PROD_DUMP="backups/prod-$STAMP.dump"

echo "1/3 Backup local → $LOCAL_BACKUP"
pg_dump "$LOCAL_URL" -Fc --no-owner --no-privileges -f "$LOCAL_BACKUP"

echo "2/3 Dump production → $PROD_DUMP"
pg_dump "$PROD_URL" -Fc --no-owner --no-privileges --schema=public -f "$PROD_DUMP"

echo "3/3 Restore vào local"
psql "$LOCAL_URL" -v ON_ERROR_STOP=1 -q -c "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;"
pg_restore -d "$LOCAL_URL" --no-owner --no-privileges --exit-on-error "$PROD_DUMP"

echo "Xong. Row counts local:"
psql "$LOCAL_URL" -q -c "ANALYZE;"
psql "$LOCAL_URL" -At -c "select relname || ': ' || n_live_tup from pg_stat_user_tables order by relname;"
echo "Restart \`npm run dev\` để xoá cache catalog trong bộ nhớ."
