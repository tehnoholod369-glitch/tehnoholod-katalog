#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Переезд данных отдела продаж в отдельный приватный репозиторий.

Зачем. Репозиторий каталога публичный — его отдаёт jsDelivr, так витрина получает
фотографии. В журнале сделок лежат имена, телефоны и адреса клиентов, в отчётах сделки
перечислены поимённо. Публиковать это нельзя, поэтому сейчас они не коммитятся вовсе.
Отсюда две дыры: у журнала нет бэкапа, и облачная сессия с отделом работать не может —
она видит пустой файл.

Приватный репозиторий рядом закрывает обе. Инструменты найдут его сами: `ledger.py`
ищет `../tehnoholod-otdel-prodazh` до того, как взять папку в этом репозитории.

  python3 tools/pereezd-otdela.py            # показать план, ничего не трогая
  python3 tools/pereezd-otdela.py --sdelat   # выполнить

Сам репозиторий на GitHub скрипт не создаёт: это делает владелец учётной записи. Команду
он печатает в конце.
"""

import argparse
import os
import shutil
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CEL = os.path.join(os.path.dirname(ROOT), "tehnoholod-otdel-prodazh")
IMYA = "tehnoholod-otdel-prodazh"
PAPKI = ["ledger", "otchety", "keysy"]

README = """# Отдел продаж ИП «ТехноХолод» — данные

Приватный репозиторий. Здесь живёт то, что нельзя публиковать: реестр сделок с именами,
телефонами и адресами клиентов, ежедневные сводки и разборы обращений.

| Папка | Что внутри |
|---|---|
| `ledger/` | `events.jsonl` — журнал событий, только дозапись |
| `otchety/` | Сводки начальника отдела, файл в день |
| `keysy/` | Разборы реальных обращений |

Код, роли и документация отдела — в публичном репозитории каталога
`tehnoholod-katalog`. Инструменты находят эту папку сами, если она лежит рядом с ним:

```
…/tehnoholod-katalog/
…/tehnoholod-otdel-prodazh/     ← вот эта
```

Лежит не рядом — путь задаётся переменной `TEHNOHOLOD_OTDEL`. Проверить, что видят
инструменты: `python3 tools/ledger.py gde` из репозитория каталога.

**Публичным не делать никогда.** В нём персональные данные клиентов.
"""


def est_chto_perevozit():
    """Файлы данных, без служебных .gitignore, .gitkeep и заготовки журнала."""
    out = []
    for papka in PAPKI:
        src = os.path.join(ROOT, "otdel-prodazh", papka)
        if not os.path.isdir(src):
            continue
        for name in sorted(os.listdir(src)):
            if name in (".gitignore", ".gitkeep") or name.endswith(".primer"):
                continue
            out.append((papka, name, os.path.join(src, name)))
    return out


def main(argv=None):
    p = argparse.ArgumentParser(description="Переезд данных отдела в приватный репозиторий")
    p.add_argument("--sdelat", action="store_true", help="выполнить, а не показать план")
    a = p.parse_args(argv)

    fajly = est_chto_perevozit()
    print("Куда: %s" % CEL)
    print("Что переезжает:")
    if fajly:
        for papka, name, put in fajly:
            print("  %s/%s   %d байт" % (papka, name, os.path.getsize(put)))
    else:
        print("  пусто — данных ещё нет, переедет только структура")

    if os.path.exists(CEL) and os.listdir(CEL):
        print("\nПапка %s уже существует и не пуста. Ничего не делаю: разбирать чужое "
              "содержимое вслепую нельзя." % CEL, file=sys.stderr)
        return 2

    if not a.sdelat:
        print("\nЭто план. Выполнить: python3 tools/pereezd-otdela.py --sdelat")
        return 0

    for papka in PAPKI:
        os.makedirs(os.path.join(CEL, papka), exist_ok=True)
    for papka, name, put in fajly:
        shutil.move(put, os.path.join(CEL, papka, name))
    with open(os.path.join(CEL, "README.md"), "w", encoding="utf-8") as fh:
        fh.write(README)
    for papka in PAPKI:
        gk = os.path.join(CEL, papka, ".gitkeep")
        if not os.listdir(os.path.join(CEL, papka)):
            open(gk, "w").close()

    if not os.path.isdir(os.path.join(CEL, ".git")):
        subprocess.run(["git", "init", "-q"], cwd=CEL, check=True)
        subprocess.run(["git", "add", "-A"], cwd=CEL, check=True)
        subprocess.run(["git", "commit", "-q", "-m",
                        "данные отдела продаж: журнал сделок, отчёты, кейсы"],
                       cwd=CEL, check=True)

    print("\nПереехало. Проверка: python3 tools/ledger.py gde")
    print("""
Осталось создать репозиторий на GitHub — **приватным** — и отправить туда:

  1. https://github.com/new  →  имя {imya}  →  Private  →  Create
     (без README, без .gitignore: они уже есть)

  2. git -C {cel} remote add origin https://github.com/<ваш-логин>/{imya}.git
     git -C {cel} branch -M main
     git -C {cel} push -u origin main

Публичным этот репозиторий не делать никогда: в нём персональные данные клиентов.
""".format(imya=IMYA, cel=CEL))
    return 0


if __name__ == "__main__":
    sys.exit(main())
