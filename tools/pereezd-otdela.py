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
  python3 tools/pereezd-otdela.py --push https://github.com/логин/tehnoholod-otdel-prodazh.git
  python3 tools/pereezd-otdela.py --arhiv otdel.zip   # упаковать данные для переноса

Сам репозиторий на GitHub скрипт не создаёт: это делает владелец учётной записи. Команду
он печатает в конце.
"""

import argparse
import os
import shutil
import subprocess
import sys
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "tools"))
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


def sdelat_arhiv(put):
    """Упаковать данные отдела. Пока приватного репозитория нет, это единственный способ
    их сохранить: журнал живёт в одном экземпляре, и вместе с диском умирает история
    всех сделок."""
    from ledger import OTDEL_DIR   # единый ответ на «где лежат данные отдела»
    if not os.path.isdir(OTDEL_DIR):
        print("Данных отдела нет: %s" % OTDEL_DIR, file=sys.stderr)
        return 2
    n = 0
    with zipfile.ZipFile(put, "w", zipfile.ZIP_DEFLATED) as z:
        for papka in PAPKI:
            src = os.path.join(OTDEL_DIR, papka)
            if not os.path.isdir(src):
                continue
            for name in sorted(os.listdir(src)):
                polnyj = os.path.join(src, name)
                if not os.path.isfile(polnyj):
                    continue
                z.write(polnyj, os.path.join(papka, name))
                n += 1
    print("Архив: %s — файлов %d, %d байт" % (put, n, os.path.getsize(put)))
    print("Внутри персональные данные клиентов. Не класть в публичные места.")
    return 0


def otpravit(url):
    """Привязать созданный владельцем приватный репозиторий и отправить туда данные."""
    if not os.path.isdir(os.path.join(CEL, ".git")):
        print("В %s нет git-репозитория. Сначала: python3 tools/pereezd-otdela.py --sdelat"
              % CEL, file=sys.stderr)
        return 2
    est = subprocess.run(["git", "remote"], cwd=CEL, capture_output=True, text=True)
    if "origin" in est.stdout.split():
        subprocess.run(["git", "remote", "set-url", "origin", url], cwd=CEL, check=True)
    else:
        subprocess.run(["git", "remote", "add", "origin", url], cwd=CEL, check=True)
    subprocess.run(["git", "branch", "-M", "main"], cwd=CEL, check=True)
    r = subprocess.run(["git", "push", "-u", "origin", "main"], cwd=CEL)
    if r.returncode != 0:
        print("Отправить не удалось. Проверьте, что репозиторий создан и он приватный.",
              file=sys.stderr)
        return r.returncode
    print("Отправлено. Проверьте на GitHub, что репозиторий помечен Private.")
    return 0


def main(argv=None):
    p = argparse.ArgumentParser(description="Переезд данных отдела в приватный репозиторий")
    p.add_argument("--sdelat", action="store_true", help="выполнить, а не показать план")
    p.add_argument("--push", metavar="URL",
                   help="привязать уже созданный на GitHub приватный репозиторий и отправить")
    p.add_argument("--arhiv", metavar="ФАЙЛ.zip",
                   help="упаковать данные отдела в архив — перенести на другую машину "
                        "или просто сохранить, пока репозитория нет")
    a = p.parse_args(argv)

    if a.arhiv:
        return sdelat_arhiv(a.arhiv)
    if a.push:
        return otpravit(a.push)

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
Осталось создать репозиторий на GitHub — **приватным** — и отправить туда данные.

Если стоит gh (GitHub CLI) — одна команда, она делает и то и другое:

  gh repo create {imya} --private --source {cel} --push

Если gh нет — руками, два шага:

  1. https://github.com/new  →  имя {imya}  →  Private  →  Create
     (без README, без .gitignore: они уже есть)

  2. python3 tools/pereezd-otdela.py --push https://github.com/<ваш-логин>/{imya}.git

Публичным этот репозиторий не делать никогда: в нём персональные данные клиентов.
""".format(imya=IMYA, cel=CEL))
    return 0


if __name__ == "__main__":
    sys.exit(main())
