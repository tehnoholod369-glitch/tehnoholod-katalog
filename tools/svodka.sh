#!/bin/sh
# Обёртка для cron. Смысл и ограничения — в tools/svodka.py.
cd "$(dirname "$0")/.." && exec python3 tools/svodka.py "$@"
