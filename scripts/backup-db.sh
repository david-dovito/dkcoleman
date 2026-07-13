#!/usr/bin/env bash
# Nightly logical backup of the Neon database to S3-compatible storage (R2/S3).
# Requires: DATABASE_URL, and either R2 (S3_ENDPOINT + AWS creds + BACKUP_BUCKET)
# credentials. Run locally or from the backup GitHub Action.
set -euo pipefail

: "${DATABASE_URL:?set DATABASE_URL}"
: "${BACKUP_BUCKET:?set BACKUP_BUCKET (e.g. dkcoleman-backups)}"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
FILE="dkcoleman-${STAMP}.sql.gz"

echo "Dumping schema + data..."
pg_dump "$DATABASE_URL" --no-owner --no-privileges | gzip > "/tmp/${FILE}"
echo "Dump size: $(du -h "/tmp/${FILE}" | cut -f1)"

# Upload via aws-cli (works against S3 or R2 with S3_ENDPOINT set).
EXTRA=()
[ -n "${S3_ENDPOINT:-}" ] && EXTRA+=(--endpoint-url "$S3_ENDPOINT")
aws "${EXTRA[@]}" s3 cp "/tmp/${FILE}" "s3://${BACKUP_BUCKET}/db/${FILE}"
echo "Uploaded s3://${BACKUP_BUCKET}/db/${FILE}"

rm -f "/tmp/${FILE}"
