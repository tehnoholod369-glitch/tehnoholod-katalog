#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Ежедневная сводка отдела продаж ИП «ТехноХолод» — запуск начальника отдела без человека.

Собирает документ за вчера и кладёт в otdel-prodazh/otchety/ГГГГ-ММ-ДД.md.

Почему за вчера: сводка «за сегодня», запущенная в 8 утра, показывает пустой день и
выглядит как остановившийся отдел. Утром спрашивают про вчера.

Почему это Python, а не .cmd: в командном файле Windows русский текст живёт по правилам
кодовых страниц, и промпт доезжает до Claude покорёженным через раз. Здесь UTF-8 читается
однозначно, а .cmd остаётся однострочной обёрткой из латиницы.

Работает только там, где лежит журнал сделок, — на машине владельца. В git журнала нет,
в нём имена и адреса клиентов; на чужом клоне сводка выйдет по пустому файлу.

  python3 tools/svodka.py               # собрать сводку за вчера
  python3 tools/svodka.py --den 2026-08-20
  python3 tools/svodka.py --pokazat     # показать команду и выйти, ничего не запуская
"""

import argparse
import os
import subprocess
import sys
from datetime import datetime, timedelta, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "tools"))
from ledger import OTCHETY_DIR  # noqa: E402  — единый ответ на «где лежат отчёты»

TZ = timezone(timedelta(hours=5), "Алматы")

# Права ровно на то, что нужно сводке: прочитать журнал и каталог, написать отчёт.
# Запуск без присмотра с полными правами — это когда однажды утром переписан каталог.
TOOLS = [
    "Bash(python3 tools/ledger.py:*)",
    "Bash(python tools/ledger.py:*)",
    "Bash(python3 tools/catalog.py:*)",
    "Bash(python tools/catalog.py:*)",
    "Read", "Glob", "Grep", "Write",
]

PROMPT = (
    "Собери сводку отдела продаж за {den}. Вызови агента nachalnik-otdela-prodazh и "
    "положи его документ в {otchet}. Журнал пуст — так и напиши, файл всё равно создай: "
    "«движения не было» и «записывать было некому» — разные утверждения, и путать их "
    "нельзя."
)


def main(argv=None):
    p = argparse.ArgumentParser(description="Сводка отдела продаж за вчера")
    p.add_argument("--den", help="дата в виде ГГГГ-ММ-ДД; по умолчанию вчера")
    p.add_argument("--pokazat", action="store_true",
                   help="показать команду и выйти, ничего не запуская")
    a = p.parse_args(argv)

    den = a.den or (datetime.now(TZ) - timedelta(days=1)).strftime("%Y-%m-%d")
    otchet = os.path.join(OTCHETY_DIR, den + ".md")
    cmd = ["claude", "-p", PROMPT.format(den=den, otchet=otchet),
           "--permission-mode", "acceptEdits", "--allowedTools"] + TOOLS

    if a.pokazat:
        print(" ".join('"%s"' % c if " " in c else c for c in cmd))
        return 0

    os.makedirs(OTCHETY_DIR, exist_ok=True)
    try:
        r = subprocess.run(cmd, cwd=ROOT)
    except FileNotFoundError:
        print("Не найден claude. Claude Code должен быть установлен и доступен в PATH.",
              file=sys.stderr)
        return 127
    if r.returncode != 0:
        print("Claude вернул код %d, сводка не собрана." % r.returncode, file=sys.stderr)
        return r.returncode
    # Отчёта нет — значит агент отработал вхолостую. Молчать об этом нельзя: расписание
    # выглядит работающим, а сводок не появляется.
    if not os.path.exists(otchet):
        print("Файл %s не появился — сводка не записана." % otchet, file=sys.stderr)
        return 1
    print("Сводка: %s" % otchet)
    return 0


if __name__ == "__main__":
    sys.exit(main())
