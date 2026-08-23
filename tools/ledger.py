#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Реестр сделок отдела продаж ИП «ТехноХолод» — общая память ИИ-экспертов.

Смысл: без общего реестра «отдел продаж» из ИИ-агентов не получается — получается
набор одноразовых чатов. Здесь лежит то, что переживает конец сессии.

Устройство — журнал событий, только дозапись (append-only):
  otdel-prodazh/ledger/events.jsonl   одна строка = одно событие
Состояние сделки не хранится, а вычисляется проигрыванием событий. Значит его
нельзя рассинхронизировать, а любую цифру в отчёте можно проследить до события.
Правка задним числом — не редактирование строки, а новое событие-исправление.

Пишут эксперты и диспетчер. Читает и сводит — начальник отдела продаж.

Команды:
  lead        завести обращение
  podbor      записать подбор оборудования (SKU из каталога)
  kp          записать выставленное КП
  kp-json     собрать вход для навыка kp-generator из подбора по сделке
  stage       перевести сделку на другой этап
  vopros      вопрос/просьба владельцу по сделке (или без сделки)
  probel      пробел ассортимента: клиент просил — в каталоге нет
  zametka     свободная заметка в историю сделки
  list        список сделок с текущим этапом
  show        полная история сделки
  report      сводка для начальника отдела продаж (день/неделя/всё)

Примеры:
  python3 tools/ledger.py lead --client "Айгуль" --contact "+7 701 000 00 00" \\
      --source whatsapp --city Алматы --need "кондиционер в спальню 18 м², тихий"
  python3 tools/ledger.py podbor --deal D-20260822-001 --by ekspert-split \\
      --sku bytovye:DTXS-09K3XA41A --text "9000 BTU, запас 15 %"
  python3 tools/ledger.py report --period week
"""

import argparse
import json
import os
import sys
from datetime import datetime, timedelta, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LEDGER_DIR = os.path.join(ROOT, "otdel-prodazh", "ledger")
EVENTS_PATH = os.path.join(LEDGER_DIR, "events.jsonl")
PRIMER_PATH = EVENTS_PATH + ".primer"

# Казахстан с 01.03.2024 живёт в одном часовом поясе UTC+5
TZ = timezone(timedelta(hours=5), "Алматы")

STAGES = [
    "новый",          # обращение принято, не разобрано
    "квалификация",   # выясняем задачу, объект, бюджет, сроки
    "подбор",         # эксперт подбирает оборудование
    "кп",             # КП выставлено
    "торг",           # обсуждение цены и условий
    "выигран",
    "проигран",
    "отложен",
]
FINAL_STAGES = {"выигран", "проигран"}

EVENT_TYPES = ["lead", "podbor", "kp", "stage", "vopros", "probel", "zametka",
               "otvet", "otpravleno"]


# --------------------------------------------------------------------------- #
# Журнал
# --------------------------------------------------------------------------- #

def now_iso():
    return datetime.now(TZ).replace(microsecond=0).isoformat()


def read_events():
    if not os.path.exists(EVENTS_PATH):
        return []
    out = []
    with open(EVENTS_PATH, encoding="utf-8") as fh:
        for lineno, line in enumerate(fh, 1):
            line = line.strip()
            if not line or line.startswith("//"):
                continue
            try:
                out.append(json.loads(line))
            except ValueError:
                print("! строка %d журнала повреждена, пропущена" % lineno, file=sys.stderr)
    return out


def append_event(ev):
    os.makedirs(LEDGER_DIR, exist_ok=True)
    # Журнала нет — значит клон свежий: он в git не хранится, там имена и адреса клиентов,
    # а репозиторий публичный. Заводим его из заготовки, чтобы шапка не потерялась.
    if not os.path.exists(EVENTS_PATH) and os.path.exists(PRIMER_PATH):
        with open(PRIMER_PATH, encoding="utf-8") as src, \
             open(EVENTS_PATH, "w", encoding="utf-8") as dst:
            dst.write(src.read())
    ev.setdefault("ts", now_iso())
    with open(EVENTS_PATH, "a", encoding="utf-8") as fh:
        fh.write(json.dumps(ev, ensure_ascii=False, sort_keys=True) + "\n")
    return ev


def next_deal_id(events, day=None):
    day = day or datetime.now(TZ).strftime("%Y%m%d")
    prefix = "D-%s-" % day
    used = {e.get("deal", "") for e in events}
    n = 1
    while "%s%03d" % (prefix, n) in used:
        n += 1
    return "%s%03d" % (prefix, n)


def deals_state(events):
    """Проигрывает журнал и возвращает состояние каждой сделки."""
    deals = {}
    for ev in events:
        did = ev.get("deal")
        if not did:
            continue
        d = deals.setdefault(did, {
            "deal": did, "stage": "новый", "created": ev["ts"], "updated": ev["ts"],
            "client": None, "contact": None, "source": None, "city": None,
            "need": None, "budget": None, "skus": [], "kp_summa": None,
            "voprosy": [], "probely": [], "sobytij": 0, "itog_prichina": None,
            "otpravleno": 0, "s_pravkami": 0,
        })
        d["updated"] = ev["ts"]
        d["sobytij"] += 1
        t = ev.get("type")
        if t == "lead":
            for k in ("client", "contact", "source", "city", "need", "budget"):
                if ev.get(k):
                    d[k] = ev[k]
        elif t == "podbor":
            for s in ev.get("skus", []):
                if s not in d["skus"]:
                    d["skus"].append(s)
            if d["stage"] in ("новый", "квалификация"):
                d["stage"] = "подбор"
        elif t == "kp":
            d["kp_summa"] = ev.get("summa", d["kp_summa"])
            if d["stage"] not in FINAL_STAGES:
                d["stage"] = "кп"
        elif t == "stage":
            d["stage"] = ev.get("to", d["stage"])
            if ev.get("why"):
                d["itog_prichina"] = ev["why"]
        elif t == "vopros":
            d["voprosy"].append(ev)
        elif t == "otvet":
            for q in d["voprosy"]:
                if q.get("id") and q["id"] == ev.get("vopros"):
                    q["otvet"] = ev.get("text")
        elif t == "probel":
            d["probely"].append(ev)
        elif t == "otpravleno":
            d["otpravleno"] += 1
            if ev.get("pravki"):
                d["s_pravkami"] += 1
    return deals


def parse_ts(s):
    try:
        return datetime.fromisoformat(s)
    except ValueError:
        return datetime.now(TZ)


def within(ts, since):
    return since is None or parse_ts(ts) >= since


def period_start(period):
    now = datetime.now(TZ)
    if period == "day":
        return now.replace(hour=0, minute=0, second=0, microsecond=0)
    if period == "week":
        start = now - timedelta(days=now.weekday())
        return start.replace(hour=0, minute=0, second=0, microsecond=0)
    if period == "month":
        return now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    return None


def money(v):
    if v is None:
        return "нет данных"
    return "{:,.0f} ₸".format(float(v)).replace(",", " ")


# --------------------------------------------------------------------------- #
# Команды записи
# --------------------------------------------------------------------------- #

def cmd_lead(a):
    events = read_events()
    did = a.deal or next_deal_id(events)
    ev = append_event({
        "type": "lead", "deal": did, "by": a.by,
        "client": a.client, "contact": a.contact, "source": a.source,
        "city": a.city, "need": a.need, "budget": a.budget,
    })
    print("Заведена сделка %s" % did)
    print(json.dumps(ev, ensure_ascii=False, indent=1))
    return 0


def cmd_podbor(a):
    if not a.sku:
        print("Подбор без единого SKU не записывается: нечего продавать. "
              "Если в каталоге нет подходящего — это `probel`, а не `podbor`.",
              file=sys.stderr)
        return 2
    unknown = _unknown_skus(a.sku)
    if unknown and not a.force:
        print("Нет в каталоге: %s\nПроверьте `catalog.py find`, или --force, "
              "если позиция заводится под заказ." % ", ".join(unknown), file=sys.stderr)
        return 2
    append_event({"type": "podbor", "deal": a.deal, "by": a.by,
                  "skus": a.sku, "text": a.text, "vne_kataloga": unknown or None})
    print("Подбор записан в %s: %s" % (a.deal, ", ".join(a.sku)))
    return 0


def _catalog():
    """Каталог через catalog.py, а не чтением файла индекса.

    Индекс в git не хранится, и на свежем клоне его нет. Читая файл напрямую, проверка
    молча пропускала любой SKU — то есть охраняла ровно до первого нового клона.
    catalog.load() индекс соберёт, если его нет или он старше витрины.
    """
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    import catalog
    return catalog.load()


def _unknown_skus(skus):
    ids = {r["id"] for r in _catalog()}
    return [s for s in skus if s not in ids]


def cmd_kp(a):
    append_event({"type": "kp", "deal": a.deal, "by": a.by,
                  "summa": a.summa, "nds": a.nds, "montazh": a.montazh,
                  "fajl": a.fajl, "text": a.text})
    print("КП записано в %s на %s" % (a.deal, money(a.summa)))
    return 0


def _parse_pair(raw, what):
    if "=" not in raw:
        print("%s пишется как «значение=число», получено: %s" % (what, raw), file=sys.stderr)
        raise SystemExit(2)
    left, right = raw.rsplit("=", 1)
    # Справа либо цена, либо «цена*количество»: монтаж считается на блок, а блоков в
    # заявке обычно несколько — без количества КП занижает работы во столько же раз.
    right = right.replace(" ", "").replace(",", ".").replace("×", "*").replace("х", "*")
    qty = 1
    if "*" in right:
        right, raw_qty = right.split("*", 1)
        try:
            qty = int(raw_qty)
        except ValueError:
            print("Количество после «*» не число: %s" % raw, file=sys.stderr)
            raise SystemExit(2)
    try:
        return left.strip(), int(float(right)), qty
    except ValueError:
        print("Не число справа от «=»: %s" % raw, file=sys.stderr)
        raise SystemExit(2)


def cmd_kp_json(a):
    """Собрать вход для навыка kp-generator из подбора по сделке.

    Своего генератора КП у отдела нет и не будет: он есть в навыке `kp-generator`, и
    второй считал бы НДС по-своему. Здесь только сборка контракта — названия и цены
    берутся из каталога, заказчик и объект из события `lead`. Руками в КП не попадает
    ни одна цифра, кроме стоимости работ, которой в каталоге нет.
    """
    events = [e for e in read_events() if e.get("deal") == a.deal]
    if not events:
        print("Сделки %s в журнале нет." % a.deal, file=sys.stderr)
        return 2
    lead = next((e for e in events if e["type"] == "lead"), {})
    podbory = [e for e in events if e["type"] == "podbor"]

    # У позиции количество пишется справа от «=», как «SKU=4», поэтому цена там же и есть
    # количество: разбираем как «значение=число» и берём число за штуки.
    pairs = [(sku, qty) for sku, qty, _ in (_parse_pair(x, "Позиция") for x in (a.pos or []))]
    if not pairs:
        if not podbory:
            print("По сделке нет ни подбора, ни явных --pos: собирать КП не из чего.",
                  file=sys.stderr)
            return 2
        # Без --pos берётся последний подбор по одной штуке: подбор — это варианты на
        # выбор, а не спецификация. Количество всё равно называет человек.
        pairs = [(sku, 1) for sku in podbory[-1]["skus"]]

    by_id = {r["id"]: r for r in _catalog()}
    equipment, bez_ceny = [], []
    for sku, qty in pairs:
        rec = by_id.get(sku)
        if rec is None:
            print("Нет в каталоге: %s" % sku, file=sys.stderr)
            return 2
        if not rec["price_kzt"]:
            bez_ceny.append(sku)
            continue
        equipment.append({"name": rec["name"], "qty": qty, "price": rec["price_kzt"]})
    if bez_ceny:
        # Правило 4П: цену не достраиваем. Позиция без цены в КП не идёт вообще.
        print("Без цены в каталоге, в КП не включены: %s" % ", ".join(bez_ceny),
              file=sys.stderr)
    if not equipment and not a.rabota:
        print("В КП не осталось ни одной строки.", file=sys.stderr)
        return 2

    out = {
        "customer": lead.get("client"),
        "object": lead.get("city") or lead.get("need"),
        "price_includes_vat": True,   # решение владельца 23.08.2026: прайсы уже с НДС
        "vat_rate": 0.16,
        "equipment": equipment,
        "install": [{"name": n, "qty": q, "price": p}
                    for n, p, q in (_parse_pair(x, "Работа") for x in (a.rabota or []))],
        "_sdelka": a.deal,
    }
    text = json.dumps(out, ensure_ascii=False, indent=2)
    if a.out:
        with open(a.out, "w", encoding="utf-8") as fh:
            fh.write(text + "\n")
        print("Вход для kp-generator: %s" % a.out)
        print("Дальше: python3 ~/.claude/skills/synced/kp-generator/scripts/kp_calc.py "
              "--in %s" % a.out)
    else:
        print(text)
    if not out["install"]:
        print("\nМонтажа в КП нет. Клиент просил «с установкой» — добавьте "
              "--rabota \"Монтаж …=цена\", иначе КП отвечает не на тот вопрос.",
              file=sys.stderr)
    return 0


def cmd_stage(a):
    if a.to not in STAGES:
        print("Этап «%s» неизвестен. Допустимые: %s" % (a.to, ", ".join(STAGES)),
              file=sys.stderr)
        return 2
    if a.to in FINAL_STAGES and not a.why:
        print("Закрытие сделки без причины не принимается: --why обязателен. "
              "Причины проигрышей — половина пользы отчёта.", file=sys.stderr)
        return 2
    append_event({"type": "stage", "deal": a.deal, "by": a.by, "to": a.to, "why": a.why})
    print("%s → %s" % (a.deal, a.to))
    return 0


def cmd_vopros(a):
    events = read_events()
    qid = "Q-%03d" % (sum(1 for e in events if e.get("type") == "vopros") + 1)
    append_event({"type": "vopros", "id": qid, "deal": a.deal, "by": a.by,
                  "text": a.text, "srochno": bool(a.srochno)})
    print("Вопрос %s записан%s" % (qid, (" по сделке " + a.deal) if a.deal else ""))
    return 0


def cmd_otvet(a):
    append_event({"type": "otvet", "vopros": a.vopros, "deal": a.deal,
                  "by": a.by or "владелец", "text": a.text})
    print("Ответ на %s записан" % a.vopros)
    return 0


def cmd_probel(a):
    append_event({"type": "probel", "deal": a.deal, "by": a.by,
                  "chto": a.chto, "gruppa": a.gruppa, "text": a.text})
    print("Пробел ассортимента записан: %s" % a.chto)
    return 0


def cmd_otpravleno(a):
    """Ответ ушёл клиенту. Правки — единственный честный материал для улучшения ролей."""
    append_event({"type": "otpravleno", "deal": a.deal, "by": a.by,
                  "kanal": a.kanal, "pravki": a.pravki, "chto": a.chto})
    if a.pravki:
        print("Записано: ответ отправлен с правкой — %s" % a.pravki)
    else:
        print("Записано: ответ отправлен без правок")
    return 0


def cmd_zametka(a):
    append_event({"type": "zametka", "deal": a.deal, "by": a.by, "text": a.text})
    print("Заметка записана в %s" % a.deal)
    return 0


# --------------------------------------------------------------------------- #
# Команды чтения
# --------------------------------------------------------------------------- #

def cmd_list(a):
    deals = deals_state(read_events())
    rows = list(deals.values())
    if a.stage:
        rows = [d for d in rows if d["stage"] in a.stage]
    if a.open:
        rows = [d for d in rows if d["stage"] not in FINAL_STAGES]
    since = period_start(a.period) if a.period else None
    if since:
        rows = [d for d in rows if within(d["updated"], since)]
    rows.sort(key=lambda d: d["updated"], reverse=True)
    if a.json:
        print(json.dumps(rows, ensure_ascii=False, indent=1))
        return 0
    if not rows:
        print("Сделок по фильтру нет.")
        return 0
    print("%-16s %-13s %-22s %-14s %s" % ("сделка", "этап", "клиент", "сумма КП", "обновлена"))
    for d in rows:
        print("%-16s %-13s %-22s %-14s %s"
              % (d["deal"], d["stage"], (d["client"] or "нет данных")[:22],
                 money(d["kp_summa"]) if d["kp_summa"] else "—", d["updated"][:16]))
    return 0


def cmd_show(a):
    events = [e for e in read_events() if e.get("deal") == a.deal]
    if not events:
        print("Сделка %s в реестре не найдена." % a.deal)
        return 1
    if a.json:
        print(json.dumps({"sostoyanie": deals_state(events).get(a.deal), "sobytiya": events},
                         ensure_ascii=False, indent=1))
        return 0
    d = deals_state(events)[a.deal]
    print("Сделка %s · этап: %s" % (d["deal"], d["stage"]))
    print("Клиент: %s · %s · %s · источник: %s"
          % (d["client"] or "нет данных", d["contact"] or "нет данных",
             d["city"] or "нет данных", d["source"] or "нет данных"))
    print("Задача: %s" % (d["need"] or "нет данных"))
    if d["budget"]:
        print("Бюджет: %s" % money(d["budget"]))
    if d["skus"]:
        print("Подобрано: %s" % ", ".join(d["skus"]))
    if d["kp_summa"]:
        print("КП: %s" % money(d["kp_summa"]))
    print("\nИстория:")
    for e in events:
        line = "  %s  %-9s %-22s" % (e["ts"][:16], e.get("type", ""), (e.get("by") or "")[:22])
        extra = e.get("text") or e.get("to") or e.get("chto") or ""
        if e.get("skus"):
            extra = ", ".join(e["skus"]) + ((" — " + extra) if extra else "")
        print(line + " " + str(extra))
    return 0


def cmd_report(a):
    events = read_events()
    deals = deals_state(events)
    since = period_start(a.period)
    label = {"day": "за сегодня", "week": "за неделю",
             "month": "за месяц", "all": "за всё время"}[a.period]

    period_events = [e for e in events if within(e["ts"], since)]
    novye = [e for e in period_events if e.get("type") == "lead"]
    kp_events = [e for e in period_events if e.get("type") == "kp"]
    zakryto = [e for e in period_events if e.get("type") == "stage" and e.get("to") in FINAL_STAGES]
    vyigrano = [e for e in zakryto if e.get("to") == "выигран"]
    proigrano = [e for e in zakryto if e.get("to") == "проигран"]

    otkrytye = [d for d in deals.values() if d["stage"] not in FINAL_STAGES]
    po_etapam = {}
    for d in otkrytye:
        po_etapam[d["stage"]] = po_etapam.get(d["stage"], 0) + 1

    otpravleno = [e for e in period_events if e.get("type") == "otpravleno"]
    bez_pravok = [e for e in otpravleno if not e.get("pravki")]
    pravki = [e for e in otpravleno if e.get("pravki")]

    otvechennye = {e.get("vopros") for e in events if e.get("type") == "otvet"}
    voprosy = [e for e in events
               if e.get("type") == "vopros" and e.get("id") not in otvechennye]
    probely = [e for e in events if e.get("type") == "probel"]

    now = datetime.now(TZ)
    zavisshie = sorted(
        [d for d in otkrytye if (now - parse_ts(d["updated"])).days >= a.stale],
        key=lambda d: d["updated"])

    summa_kp = sum(float(e["summa"]) for e in kp_events if e.get("summa"))
    summa_win = sum(float(deals[e["deal"]]["kp_summa"] or 0) for e in vyigrano
                    if e.get("deal") in deals)

    data = {
        "period": a.period, "sformirovan": now_iso(),
        "novyh_obrascheniy": len(novye),
        "vystavleno_kp": len(kp_events), "summa_kp": summa_kp,
        "vyigrano": len(vyigrano), "summa_vyigrannyh": summa_win,
        "proigrano": len(proigrano),
        "otkrytyh_sdelok": len(otkrytye), "po_etapam": po_etapam,
        "otvetov_otpravleno": len(otpravleno),
        "bez_pravok": len(bez_pravok),
        "dolya_bez_pravok": (round(100.0 * len(bez_pravok) / len(otpravleno))
                             if otpravleno else None),
        "voprosov_bez_otveta": len(voprosy),
        "zavisshih_sdelok": len(zavisshie), "porog_zavisaniya_dney": a.stale,
        "probelov_assortimenta": len(probely),
    }
    if a.json:
        data["voprosy"] = voprosy
        data["zavisshie"] = zavisshie
        data["probely"] = probely
        data["prichiny_proigryshey"] = [e.get("why") for e in proigrano]
        data["pravki"] = [{"deal": e.get("deal"), "by": e.get("by"),
                           "pravka": e.get("pravki")} for e in pravki]
        print(json.dumps(data, ensure_ascii=False, indent=1))
        return 0

    print("СВОДКА ОТДЕЛА ПРОДАЖ %s · сформирована %s" % (label.upper(), now_iso()[:16]))
    print("Источник цифр: otdel-prodazh/ledger/events.jsonl, событий всего %d" % len(events))
    print()
    print("Движение %s:" % label)
    print("  новых обращений      %d" % len(novye))
    print("  выставлено КП        %d на %s" % (len(kp_events), money(summa_kp)))
    print("  выиграно             %d на %s" % (len(vyigrano), money(summa_win)))
    print("  проиграно            %d" % len(proigrano))
    if kp_events:
        print("  конверсия КП→сделка  %.0f %%" % (100.0 * len(vyigrano) / len(kp_events)))
    print()
    if otpravleno:
        print("Качество ответов %s:" % label)
        print("  отправлено          %d" % len(otpravleno))
        print("  ушло без правок     %d (%d %%)"
              % (len(bez_pravok), round(100.0 * len(bez_pravok) / len(otpravleno))))
        print("  главная метрика — эта доля. Растёт — роли обучаются, падает — что-то сломали")
        print()
    print("Воронка на сейчас — открытых сделок %d:" % len(otkrytye))
    for st in STAGES:
        if po_etapam.get(st):
            print("  %-13s %d" % (st, po_etapam[st]))
    if not otkrytye:
        print("  пусто")
    print()
    if voprosy:
        print("Требуют решения владельца — %d:" % len(voprosy))
        for q in voprosy:
            mark = "СРОЧНО " if q.get("srochno") else ""
            print("  %s %s%s%s" % (q.get("id", "Q-?"), mark,
                                   ("[%s] " % q["deal"]) if q.get("deal") else "", q.get("text")))
        print()
    if zavisshie:
        print("Без движения %d+ дней — %d:" % (a.stale, len(zavisshie)))
        for d in zavisshie:
            print("  %s  %-20s этап %-12s с %s"
                  % (d["deal"], (d["client"] or "нет данных")[:20], d["stage"], d["updated"][:10]))
        print()
    if pravki:
        print("Что правили перед отправкой — %d:" % len(pravki))
        for e in pravki:
            print("  %s  %s" % (e.get("deal"), e.get("pravki")))
        print("  Повторяется одно и то же → это строчка в регламент, а не случайность.")
        print()
    if probely:
        svod = {}
        for p in probely:
            key = p.get("chto") or "нет данных"
            svod[key] = svod.get(key, 0) + 1
        print("Просили, а в каталоге нет — %d обращений:" % len(probely))
        for k, v in sorted(svod.items(), key=lambda kv: -kv[1]):
            print("  %dx  %s" % (v, k))
        print()
    if proigrano:
        print("Причины проигрышей %s:" % label)
        for e in proigrano:
            print("  %s — %s" % (e.get("deal"), e.get("why") or "нет данных"))
        print()
    if not events:
        print("Журнал пуст. Ни одного события ещё не записано — цифры выше нулевые "
              "не потому, что продаж нет, а потому, что их некому было записать.")
    return 0


# --------------------------------------------------------------------------- #

def main(argv=None):
    p = argparse.ArgumentParser(description="Реестр сделок отдела продаж ИП «ТехноХолод»")
    sub = p.add_subparsers(dest="cmd", required=True)

    def with_by(sp):
        sp.add_argument("--by", default="—", help="кто записал: роль агента или имя")
        return sp

    l = with_by(sub.add_parser("lead", help="завести обращение"))
    l.add_argument("--client")
    l.add_argument("--contact")
    l.add_argument("--source", help="whatsapp | сайт | omarket | почта | звонок | рекомендация")
    l.add_argument("--city")
    l.add_argument("--need", required=True, help="что нужно клиенту, его словами")
    l.add_argument("--budget", type=float)
    l.add_argument("--deal", help="задать ID вручную (по умолчанию присваивается)")

    pb = with_by(sub.add_parser("podbor", help="записать подбор"))
    pb.add_argument("--deal", required=True)
    pb.add_argument("--sku", action="append", required=True, help="ID из catalog.py, можно несколько")
    pb.add_argument("--text", help="обоснование подбора")
    pb.add_argument("--force", action="store_true", help="принять SKU, которого нет в каталоге")

    k = with_by(sub.add_parser("kp", help="записать выставленное КП"))
    k.add_argument("--deal", required=True)
    k.add_argument("--summa", type=float, required=True, help="итог КП с НДС, ₸")
    k.add_argument("--nds", type=float, help="сумма НДС, ₸")
    k.add_argument("--montazh", type=float, help="монтаж в составе КП, ₸")
    k.add_argument("--fajl", help="путь или ссылка на файл КП")
    k.add_argument("--text")

    kj = sub.add_parser("kp-json", help="вход для навыка kp-generator из подбора")
    kj.add_argument("--deal", required=True)
    kj.add_argument("--pos", action="append", metavar="SKU=ШТ",
                    help="позиция и количество; без этого берётся последний подбор по 1 шт")
    kj.add_argument("--rabota", action="append", metavar="НАЗВАНИЕ=ЦЕНА[*ШТ]",
                    help="монтаж, выезд, комплект — то, чего в каталоге нет; "
                         "монтаж считается на блок, количество пишется как =45000*4")
    kj.add_argument("--out", help="куда положить JSON; без него — на экран")

    s = with_by(sub.add_parser("stage", help="сменить этап"))
    s.add_argument("--deal", required=True)
    s.add_argument("--to", required=True, help="|".join(STAGES))
    s.add_argument("--why", help="обязательно при выигран/проигран")

    v = with_by(sub.add_parser("vopros", help="вопрос владельцу"))
    v.add_argument("--deal")
    v.add_argument("--text", required=True)
    v.add_argument("--srochno", action="store_true")

    o = with_by(sub.add_parser("otvet", help="ответ владельца на вопрос"))
    o.add_argument("--vopros", required=True)
    o.add_argument("--deal")
    o.add_argument("--text", required=True)

    pr = with_by(sub.add_parser("probel", help="просили, а в каталоге нет"))
    pr.add_argument("--deal")
    pr.add_argument("--chto", required=True, help="чего не хватило, коротко и одинаково от раза к разу")
    pr.add_argument("--gruppa", help="группа техники")
    pr.add_argument("--text")

    op = with_by(sub.add_parser("otpravleno", help="ответ ушёл клиенту"))
    op.add_argument("--deal", required=True)
    op.add_argument("--kanal", help="whatsapp | почта | звонок")
    op.add_argument("--pravki", help="что человек исправил перед отправкой; без флага — ушло как есть")
    op.add_argument("--chto", help="о чём был ответ: подбор, цена, наличие, срок")

    z = with_by(sub.add_parser("zametka", help="заметка в историю сделки"))
    z.add_argument("--deal", required=True)
    z.add_argument("--text", required=True)

    ls = sub.add_parser("list", help="список сделок")
    ls.add_argument("--stage", action="append")
    ls.add_argument("--open", action="store_true", help="только незакрытые")
    ls.add_argument("--period", choices=["day", "week", "month", "all"])
    ls.add_argument("--json", action="store_true")

    sh = sub.add_parser("show", help="история сделки")
    sh.add_argument("--deal", required=True)
    sh.add_argument("--json", action="store_true")

    r = sub.add_parser("report", help="сводка для начальника отдела продаж")
    r.add_argument("--period", choices=["day", "week", "month", "all"], default="day")
    r.add_argument("--stale", type=int, default=3, help="сколько дней без движения считать зависанием")
    r.add_argument("--json", action="store_true")

    a = p.parse_args(argv)
    handlers = {"lead": cmd_lead, "podbor": cmd_podbor, "kp": cmd_kp, "kp-json": cmd_kp_json, "stage": cmd_stage,
                "vopros": cmd_vopros, "otvet": cmd_otvet, "probel": cmd_probel,
                "zametka": cmd_zametka, "otpravleno": cmd_otpravleno,
                "list": cmd_list, "show": cmd_show, "report": cmd_report}
    return handlers[a.cmd](a)


if __name__ == "__main__":
    try:
        import signal
        signal.signal(signal.SIGPIPE, signal.SIG_DFL)
    except (ImportError, AttributeError, ValueError):
        pass
    sys.exit(main())
