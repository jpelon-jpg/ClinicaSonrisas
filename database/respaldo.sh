#!/usr/bin/env bash
# Genera el respaldo completo (estructura + datos) de la base de datos.
# Uso:  ./database/respaldo.sh            -> database/sonrisa_backup.sql
#       ./database/respaldo.sh restaurar  -> carga database/sonrisa_backup.sql en sonrisa_db
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
ARCHIVO="$DIR/sonrisa_backup.sql"
USUARIO="${DB_USER:-sonrisa_app}"

if [[ "${1:-}" == "restaurar" ]]; then
  mysql -u "$USUARIO" -p sonrisa_db < "$ARCHIVO"
  echo "Respaldo restaurado en sonrisa_db"
  exit 0
fi

mysqldump -u "$USUARIO" -p --single-transaction --routines --triggers --no-tablespaces \
  --default-character-set=utf8mb4 --databases sonrisa_db > "$ARCHIVO"
echo "Respaldo generado: $ARCHIVO ($(du -h "$ARCHIVO" | cut -f1))"
