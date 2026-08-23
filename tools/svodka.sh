#!/bin/sh
# Ежедневная сводка отдела продаж ИП «ТехноХолод».
#
# Запускается по расписанию на машине, где лежит журнал сделок. В git журнала нет — там
# имена и адреса клиентов, — поэтому сводку нельзя собрать ни в облачной сессии, ни на
# чужом клоне: цифры будут по пустому файлу.
#
# Утром спрашивают про вчера, а не про сегодня: в 8:00 «за сегодня» — это пустой день,
# который выглядит как остановившийся отдел.
#
# Права выданы ровно на чтение журнала с каталогом и запись отчёта. Запуск без присмотра
# с полными правами — это когда однажды утром переписан каталог.
set -e
cd "$(dirname "$0")/.."

DEN=$(python3 -c "from datetime import datetime, timedelta, timezone
print((datetime.now(timezone(timedelta(hours=5))) - timedelta(days=1)).strftime('%Y-%m-%d'))")

claude -p "Собери сводку отдела продаж за вчера ($DEN). Вызови агента nachalnik-otdela-prodazh и положи его документ в otdel-prodazh/otchety/$DEN.md. Журнал пуст — так и напиши, файл всё равно создай: «движения не было» и «записывать было некому» — разные утверждения." \
  --permission-mode acceptEdits \
  --allowedTools "Bash(python3 tools/ledger.py:*)" "Bash(python3 tools/catalog.py:*)" \
                 "Read" "Glob" "Grep" "Write"

echo "Сводка: otdel-prodazh/otchety/$DEN.md"
