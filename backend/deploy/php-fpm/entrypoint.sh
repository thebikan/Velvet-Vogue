#!/bin/sh
set -eu
# Bind-mounted local storage needs the same ownership as image-owned storage.
mkdir -p /app/storage/logs /app/storage/temp
if [ "$(id -u)" = "0" ]; then
    chown -R www-data:www-data /app/storage/logs /app/storage/temp
fi
exec docker-php-entrypoint "$@"
