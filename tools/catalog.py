#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Поисковый инструмент по каталогу ИП «ТехноХолод» для ИИ-экспертов отдела продаж.

Источник данных — массивы `var DATA=[...]` внутри katalog-*.html этого репозитория.
Страницы собираются пайплайном ОБНОВИТЬ-ВСЁ.py из мастер-таблицы PIM, поэтому
индекс здесь — производная витрины, а НЕ второй источник правды.
Правится мастер-таблица → пересобирается каталог → `catalog.py build`.

Зачем инструмент, а не выгрузка в контекст: эксперт не должен «вспоминать» цену.
Он обязан её найти запросом и процитировать. Нет позиции в выдаче — значит её нет
в каталоге, и это ответ «нет данных», а не повод придумать модель.

Команды:
  build                     пересобрать data/catalog-index.json и data/catalog-meta.json
  find [фильтры]            найти позиции
  show ID [ID ...]          полная карточка с ТТХ
  groups                    список групп техники с количеством
  brands [--group G]        список брендов
  stats                     сводка по каталогу

Примеры:
  python3 tools/catalog.py find --group bytovye --area 25 --instock --limit 5
  python3 tools/catalog.py find --q "кассетный" --price-max 900000 --instock
  python3 tools/catalog.py find --group radiatory --brand "Royal Thermo" --json
  python3 tools/catalog.py show bytovye:MDSA-30HRN1
"""

import argparse
import glob
import hashlib
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT, "data")
INDEX_PATH = os.path.join(DATA_DIR, "catalog-index.json")
META_PATH = os.path.join(DATA_DIR, "catalog-meta.json")

# Человекочитаемые названия групп. Ключ = имя файла katalog-<slug>.html
GROUP_TITLES = {
    "bytovye": "Бытовые кондиционеры",
    "poluprom": "Полупромышленные кондиционеры",
    "multisplit": "Мультисплит-системы",
    "mini-vrf": "Мини-VRF",
    "chillery": "Чиллеры",
    "fankoyly": "Фанкойлы",
    "precizionnye": "Прецизионные кондиционеры",
    "mobilnye": "Мобильные кондиционеры",
    "prom-mobilnye": "Промышленные мобильные кондиционеры",
    "vozduhoohladiteli": "Воздухоохладители",
    "osushiteli": "Осушители воздуха",
    "vodoochistka": "Водоочистка",
    "ventilyaciya": "Вентиляция",
    "ventilyatory-prom": "Промышленные вентиляторы",
    "rekuperatory": "Рекуператоры",
    "radiatory": "Радиаторы отопления",
    "kaminy": "Камины и очаги",
    "obogrevateli": "Обогреватели",
    "infrakrasnye-obogrevateli": "Инфракрасные обогреватели",
    "teplovye-pushki": "Тепловые пушки",
    "teplovye-zavesy": "Тепловые завесы",
    "teplovye-nasosy": "Тепловые насосы",
    "vodyanye-teploventilyatory": "Водяные тепловентиляторы",
    "vodonagrevateli": "Водонагреватели",
}

SITE_URL = "https://tehnoholod369.kz/katalog"


# --------------------------------------------------------------------------- #
# Разбор витрины
# --------------------------------------------------------------------------- #

def _grab_array(src, var_name):
    """Вырезает JS-массив `var NAME=[...]` по балансу скобок и парсит как JSON."""
    marker = "var %s=" % var_name
    i = src.find(marker)
    if i < 0:
        return None
    j = src.index("[", i)
    depth = 0
    in_str = False
    esc = False
    for k in range(j, len(src)):
        ch = src[k]
        if in_str:
            if esc:
                esc = False
            elif ch == "\\":
                esc = True
            elif ch == '"':
                in_str = False
            continue
        if ch == '"':
            in_str = True
        elif ch == "[":
            depth += 1
        elif ch == "]":
            depth -= 1
            if depth == 0:
                try:
                    return json.loads(src[j:k + 1])
                except ValueError:
                    return None
    return None


def _num(text):
    """Первое число из строки: «20.5 м²» → 20.5, «7000 BTU» → 7000.0."""
    if text is None:
        return None
    if isinstance(text, (int, float)):
        return float(text)
    m = re.search(r"-?\d+(?:[.,]\d+)?", str(text).replace(" ", " "))
    return float(m.group(0).replace(",", ".")) if m else None


def _specs_dict(specs):
    out = {}
    for kv in specs or []:
        if not kv:
            continue
        key = str(kv[0]).strip()
        val = str(kv[1]).strip() if len(kv) > 1 else ""
        val = re.sub(r"<[^>]+>", " ", val)          # ТТХ иногда содержат ссылки
        val = re.sub(r"\s+", " ", val).strip()
        if key and key not in out:
            out[key] = val
    return out


def _first(specs, *keys):
    for k in keys:
        if k in specs and specs[k] not in ("", "-", "—"):
            return specs[k]
    return None


def _make_id(group, art, name):
    if art:
        token = re.sub(r"\s+", "", str(art))
    else:
        token = hashlib.md5(name.encode("utf-8")).hexdigest()[:8]
    return "%s:%s" % (group, token)


def _normalize(group, raw, seq):
    specs = _specs_dict(raw.get("specs"))
    name = str(raw.get("name") or "").strip()
    art = raw.get("art") or _first(specs, "Артикул", "Код поставщика (НС)", "Код")
    imgs = raw.get("imgs") or raw.get("hi") or ([raw["img"]] if raw.get("img") else [])

    # Площадь берётся из ТТХ, а не из числового поля area витрины: у части карточек
    # (37 позиций на 22.08.2026, в основном FUNAI и ROYAL CLIMA) в area лежит величина
    # примерно втрое больше паспортной — похоже на объём в м³. Клиенту в названии и в
    # ТТХ показано паспортное значение, по нему и подбираем; расхождение помечаем.
    area_specs = _num(_first(specs, "Площадь", "Площадь помещения"))
    area_field = _num(raw.get("area"))
    area = area_specs if area_specs is not None else area_field
    area_conflict = (area_specs is not None and area_field is not None
                     and abs(area_field - area_specs) > 0.25 * max(area_field, area_specs))
    btu = _num(raw.get("btu")) or _num(_first(specs, "BTU"))
    kw_cool = _num(_first(specs, "Мощность (охлаждение)", "Холодопроизводительность"))
    kw_heat = _num(_first(specs, "Мощность (обогрев)", "Тепловая мощность",
                          "Теплоотдача", "Мощность"))
    airflow = _num(_first(specs, "Производительность", "Приток воздуха", "Расход воздуха"))

    # «Обогрев до» лежит диапазоном «-15 ~ +24 °C» — нужна нижняя граница по улице.
    heat_to = None
    raw_heat = _first(specs, "Обогрев до")
    if raw_heat:
        nums = [float(x.replace(",", ".")) for x in re.findall(r"-?\d+(?:[.,]\d+)?", raw_heat)]
        if nums:
            heat_to = min(nums)

    # «Шум внутр. блока» — ряд по скоростям «21/26/31/34 дБ(А)». Сравнивать надо минимум.
    noise_min = None
    raw_noise = _first(specs, "Шум внутр. блока", "Уровень шума")
    if raw_noise:
        nums = [float(x.replace(",", ".")) for x in re.findall(r"\d+(?:[.,]\d+)?", raw_noise)]
        if nums:
            noise_min = min(nums)

    stock = str(raw.get("stock") or "").strip()
    instock = raw.get("instock")
    if instock is None:
        instock = stock.lower().startswith("в наличии")

    rec = {
        "id": _make_id(group, art, name or ("%s-%04d" % (group, seq))),
        "group": group,
        "group_title": GROUP_TITLES.get(group, group),
        "brand": str(raw.get("brand") or "").strip(),
        "name": name,
        "art": str(art).strip() if art else None,
        "type": str(raw.get("type") or raw.get("case") or "").strip() or None,
        "price_kzt": raw.get("pn") if isinstance(raw.get("pn"), (int, float)) else _num(raw.get("price")),
        "price_text": str(raw.get("price") or "").strip() or None,
        "rassrochka": str(raw.get("rassr") or "").strip() or None,
        "stock": stock or None,
        "instock": bool(instock),
        "inverter": raw.get("inv") if raw.get("inv") else None,
        "area_m2": area,
        "area_vitrina": area_field if area_conflict else None,
        "area_conflict": area_conflict or None,
        "btu": btu,
        "kw_cool": kw_cool,
        "kw_heat": kw_heat,
        "airflow_m3h": airflow,
        "heat_to_c": heat_to,
        "noise_min_db": noise_min,
        "wifi": raw.get("wifi") if isinstance(raw.get("wifi"), bool) else None,
        "img": raw.get("img"),
        "imgs": imgs,
        "manual": raw.get("manual") or raw.get("man") or None,
        "desc": str(raw.get("desc") or "").strip() or None,
        "specs": specs,
        "page": "katalog-%s.html" % group,
        "url": SITE_URL,
    }
    return rec


def build(verbose=True):
    """Пересобирает индекс из katalog-*.html."""
    records = []
    per_page = {}
    for path in sorted(glob.glob(os.path.join(ROOT, "katalog-*.html"))):
        fname = os.path.basename(path)
        group = fname[len("katalog-"):-len(".html")]
        src = open(path, encoding="utf-8").read()
        arrays = []
        data = _grab_array(src, "DATA")
        if data:
            arrays.append(data)
        else:
            # katalog-multisplit.html — конфигуратор: внутренние и наружные блоки врозь
            for var in ("INDOOR", "OUTDOOR"):
                part = _grab_array(src, var)
                if part:
                    arrays.append(part)
        if not arrays:
            if verbose:
                print("  ! %s — массив позиций не найден, страница пропущена" % fname,
                      file=sys.stderr)
            continue
        seq = 0
        seen = set()
        for arr in arrays:
            for raw in arr:
                seq += 1
                rec = _normalize(group, raw, seq)
                if rec["id"] in seen:                 # один артикул в двух ролях
                    rec["id"] = "%s#%d" % (rec["id"], seq)
                seen.add(rec["id"])
                records.append(rec)
        per_page[group] = seq

    os.makedirs(DATA_DIR, exist_ok=True)
    with open(INDEX_PATH, "w", encoding="utf-8") as fh:
        json.dump(records, fh, ensure_ascii=False, separators=(",", ":"))

    brands = {}
    for r in records:
        brands.setdefault(r["brand"] or "нет данных", 0)
        brands[r["brand"] or "нет данных"] += 1
    meta = {
        "istochnik": "katalog-*.html этого репозитория (витрина, собранная из мастер-таблицы PIM)",
        "vsego_pozicij": len(records),
        "v_nalichii": sum(1 for r in records if r["instock"]),
        "bez_ceny": sum(1 for r in records if not r["price_kzt"]),
        "grupp": len(per_page),
        "po_gruppam": {g: {"nazvanie": GROUP_TITLES.get(g, g), "pozicij": n}
                       for g, n in sorted(per_page.items())},
        "po_brendam": dict(sorted(brands.items(), key=lambda kv: -kv[1])),
    }
    with open(META_PATH, "w", encoding="utf-8") as fh:
        json.dump(meta, fh, ensure_ascii=False, indent=1)

    if verbose:
        print("Индекс собран: %d позиций из %d групп → %s"
              % (len(records), len(per_page), os.path.relpath(INDEX_PATH, ROOT)))
        print("В наличии: %d · без цены: %d" % (meta["v_nalichii"], meta["bez_ceny"]))
    return records


def _index_stale():
    """Индекс устарел, если хоть одна страница каталога новее его."""
    if not os.path.exists(INDEX_PATH):
        return True
    made = os.path.getmtime(INDEX_PATH)
    return any(os.path.getmtime(p) > made
               for p in glob.glob(os.path.join(ROOT, "katalog-*.html")))


def load():
    # Пересборка сама, без напоминаний: устаревший индекс означает продажу по ценам
    # прошлой сборки каталога — самый дорогой из возможных сбоев отдела.
    if _index_stale():
        return build(verbose=False)
    with open(INDEX_PATH, encoding="utf-8") as fh:
        return json.load(fh)


# --------------------------------------------------------------------------- #
# Поиск
# --------------------------------------------------------------------------- #

def _matches(rec, a):
    if a.group and rec["group"] not in a.group:
        return False
    if a.brand and not any(b.lower() in (rec["brand"] or "").lower() for b in a.brand):
        return False
    if a.instock and not rec["instock"]:
        return False
    if a.type and (a.type.lower() not in (rec["type"] or "").lower()
                   and a.type.lower() not in rec["name"].lower()):
        return False
    if a.price_max is not None and (rec["price_kzt"] is None or rec["price_kzt"] > a.price_max):
        return False
    if a.price_min is not None and (rec["price_kzt"] is None or rec["price_kzt"] < a.price_min):
        return False
    if a.area is not None:
        val = rec["area_m2"]
        if val is None:
            return False
        lo, hi = a.area * (1 - a.tol), a.area * (1 + a.tol)
        # Подбор «на площадь»: годится техника не слабее запроса и не втрое мощнее
        if not (lo <= val <= hi * 1.6):
            return False
    if a.btu is not None:
        val = rec["btu"]
        if val is None or not (a.btu * (1 - a.tol) <= val <= a.btu * (1 + a.tol) * 1.6):
            return False
    if a.kw is not None:
        val = rec["kw_heat"] or rec["kw_cool"]
        if val is None or not (a.kw * (1 - a.tol) <= val <= a.kw * (1 + a.tol) * 1.6):
            return False
    if getattr(a, "compressor", None):
        # Витрина уже несёт машинное поле inv/onoff, и оно совпадает с ТТХ «Тип» на всех
        # позициях, где заполнено и то и другое. Незаполненное — не годится: опросный лист
        # спрашивает про инвертор прямо, отвечать догадкой нельзя.
        want = "inv" if a.compressor == "инвертор" else "onoff"
        if rec.get("inverter") != want:
            return False
    if a.heat_to is not None:
        val = rec.get("heat_to_c")
        # Нужен обогрев до −20 → годится только техника с границей −20 и ниже.
        # Нет данных о границе — позиция не годится: обещать обогрев вслепую нельзя.
        if val is None or val > a.heat_to:
            return False
    if a.max_noise is not None:
        val = rec.get("noise_min_db")
        if val is None or val > a.max_noise:
            return False
    if a.q:
        hay = " ".join(filter(None, [
            rec["name"], rec["brand"], rec["art"] or "", rec["type"] or "",
            rec["desc"] or "", " ".join("%s %s" % kv for kv in rec["specs"].items()),
        ])).lower()
        for token in a.q:
            if token.lower() not in hay:
                return False
    return True


def _sort_key(rec, a):
    if a.sort == "price":
        return (rec["price_kzt"] is None, rec["price_kzt"] or 0)
    if a.sort == "area":
        return (rec["area_m2"] is None, rec["area_m2"] or 0)
    # По умолчанию: сначала в наличии, потом дешевле
    return (not rec["instock"], rec["price_kzt"] is None, rec["price_kzt"] or 0)


def _brief(rec):
    bits = [rec["id"], rec["name"]]
    line = "%-34s %s" % (rec["id"][:34], rec["name"])
    tail = []
    tail.append(rec["price_text"] or "цена: нет данных")
    tail.append(rec["stock"] or "наличие: нет данных")
    if rec["area_m2"]:
        tail.append("%g м²" % rec["area_m2"])
    if rec["btu"]:
        tail.append("%g BTU" % rec["btu"])
    if rec["kw_heat"] and not rec["btu"]:
        tail.append("%g кВт" % rec["kw_heat"])
    if rec.get("inverter"):
        tail.append("инвертор" if rec["inverter"] == "inv" else "On/Off")
    if rec.get("heat_to_c") is not None:
        tail.append("обогрев до %g °C" % rec["heat_to_c"])
    if rec.get("noise_min_db") is not None:
        tail.append("от %g дБ" % rec["noise_min_db"])
    del bits
    return line + "\n" + " " * 35 + " · ".join(tail)


def _power_step(rows, a):
    """Позиции того же шага мощности, что и запрос.

    Фильтр намеренно пропускает технику до 1,6× запроса: брать слабее нельзя, а запас
    сверху бывает оправдан. Но тройку «дешевле · рабочий · лучше» так набирать нельзя —
    иначе рядом окажутся 8000 BTU за 40 тыс и 12000 BTU за миллион, и сравнивать их
    клиенту нечем. Возвращает (пул, границы шага) или (все строки, None), если внутри
    шага меньше трёх позиций.
    """
    if a.btu is not None:
        key, target, unit = (lambda r: r["btu"]), a.btu, "BTU"
    elif a.kw is not None:
        key, target, unit = (lambda r: r["kw_heat"] or r["kw_cool"]), a.kw, "кВт"
    elif a.area is not None:
        key, target, unit = (lambda r: r["area_m2"]), a.area, "м²"
    else:
        return rows, None
    lo, hi = target * (1 - a.tol), target * (1 + a.tol)
    step = [r for r in rows if key(r) is not None and lo <= key(r) <= hi]
    if len(step) < 3:
        return rows, None
    return step, (lo, hi, unit)


def cmd_find(a):
    rows = [r for r in load() if _matches(r, a)]
    rows.sort(key=lambda r: _sort_key(r, a))
    total = len(rows)
    step_band = None
    in_step = None
    if getattr(a, "spread", False) and total >= 3:
        # Регламент требует три варианта: дешевле · рабочий · лучше. Сортировка по цене
        # показывает только нижний край выдачи, и эксперт видит одни самые дешёвые модели.
        pool, step_band = _power_step(rows, a)
        by_price = sorted([r for r in pool if r["price_kzt"]], key=lambda r: r["price_kzt"])
        if len(by_price) >= 3:
            rows = [by_price[0], by_price[len(by_price) // 2], by_price[-1]]
            in_step = len(by_price)
        else:
            rows = rows[:a.limit]
    else:
        rows = rows[:a.limit]
    if a.json:
        keys = ("id", "group", "brand", "name", "art", "type", "price_kzt", "price_text",
                "stock", "instock", "area_m2", "btu", "kw_cool", "kw_heat", "airflow_m3h",
                "heat_to_c", "noise_min_db", "inverter", "img")
        out = {"najdeno": total, "pokazano": len(rows)}
        if step_band:
            out["shag_moshchnosti"] = "%g–%g %s" % step_band
            out["v_shage"] = in_step
        out["pozicii"] = [{k: r[k] for k in keys} for r in rows]
        print(json.dumps(out, ensure_ascii=False, indent=1))
        return 0
    if not rows:
        print("Найдено: 0. По этому запросу в каталоге позиций нет — это «нет данных», "
              "а не повод предложить модель по памяти.")
        return 0
    if step_band:
        print("Найдено: %d, из них в шаге %g–%g %s: %d, показано: %d\n"
              % ((total,) + step_band + (in_step, len(rows))))
    else:
        print("Найдено: %d, показано: %d\n" % (total, len(rows)))
    for r in rows:
        print(_brief(r))
        print()
    if total > len(rows):
        print("… ещё %d позиций, уточните фильтры или поднимите --limit" % (total - len(rows)))
    return 0


def cmd_show(a):
    index = {r["id"]: r for r in load()}
    out = []
    for wanted in a.id:
        rec = index.get(wanted)
        if not rec:
            cand = [r for r in index.values()
                    if wanted.lower() in r["id"].lower() or wanted.lower() in r["name"].lower()]
            if len(cand) == 1:
                rec = cand[0]
            elif cand:
                print("«%s» — неоднозначно, подходит %d позиций:" % (wanted, len(cand)))
                for c in cand[:10]:
                    print("  %s  %s" % (c["id"], c["name"]))
                continue
            else:
                print("«%s» — в каталоге не найдено." % wanted)
                continue
        out.append(rec)
    if a.json:
        print(json.dumps(out, ensure_ascii=False, indent=1))
        return 0
    for rec in out:
        print("=" * 72)
        print(rec["name"])
        print("ID: %s · группа: %s · бренд: %s · артикул: %s"
              % (rec["id"], rec["group_title"], rec["brand"] or "нет данных",
                 rec["art"] or "нет данных"))
        print("Цена: %s · %s" % (rec["price_text"] or "нет данных",
                                 rec["stock"] or "наличие: нет данных"))
        if rec["rassrochka"]:
            print("Рассрочка: %s" % rec["rassrochka"])
        if rec["desc"]:
            print("\n%s" % rec["desc"])
        if rec["specs"]:
            print("\nТТХ:")
            for k, v in rec["specs"].items():
                print("  %-32s %s" % (k, v))
        if rec["img"]:
            print("\nФото: %s" % rec["img"])
        if rec["manual"]:
            print("Документация: %s" % rec["manual"])
        print()
    return 0


def cmd_groups(a):
    rows = load()
    counts = {}
    for r in rows:
        g = counts.setdefault(r["group"], {"vsego": 0, "v_nalichii": 0})
        g["vsego"] += 1
        g["v_nalichii"] += 1 if r["instock"] else 0
    if a.json:
        print(json.dumps(counts, ensure_ascii=False, indent=1))
        return 0
    print("%-30s %-38s %7s %10s" % ("slug", "группа", "всего", "в наличии"))
    for slug in sorted(counts, key=lambda s: -counts[s]["vsego"]):
        c = counts[slug]
        print("%-30s %-38s %7d %10d"
              % (slug, GROUP_TITLES.get(slug, slug), c["vsego"], c["v_nalichii"]))
    return 0


def cmd_brands(a):
    rows = load()
    if a.group:
        rows = [r for r in rows if r["group"] in a.group]
    counts = {}
    for r in rows:
        counts[r["brand"] or "нет данных"] = counts.get(r["brand"] or "нет данных", 0) + 1
    if a.json:
        print(json.dumps(counts, ensure_ascii=False, indent=1))
        return 0
    for b, n in sorted(counts.items(), key=lambda kv: -kv[1]):
        print("%5d  %s" % (n, b))
    return 0


def cmd_stats(a):
    if _index_stale() or not os.path.exists(META_PATH):
        build(verbose=False)
    meta = json.load(open(META_PATH, encoding="utf-8"))
    if a.json:
        print(json.dumps(meta, ensure_ascii=False, indent=1))
        return 0
    print("Каталог: %d позиций, %d групп" % (meta["vsego_pozicij"], meta["grupp"]))
    print("В наличии: %d · без цены: %d" % (meta["v_nalichii"], meta["bez_ceny"]))
    print("Источник: %s" % meta["istochnik"])
    return 0


def cmd_doctor(a):
    """Дыры и противоречия в витрине — сырьё для предложений владельцу."""
    rows = load()
    problems = {
        "без цены": [r for r in rows if not r["price_kzt"]],
        "без фото": [r for r in rows if not r["img"]],
        "артикул не выведен в витрину": [r for r in rows if not r["art"]],
        "площадь витрины спорит с ТТХ": [r for r in rows if r.get("area_conflict")],
        "наличие не указано": [r for r in rows if not r["stock"]],
        "мощность не машиночитаема": [r for r in rows
                                      if r["group"] in ("bytovye", "poluprom", "multisplit",
                                                        "mini-vrf", "mobilnye")
                                      and not r["btu"] and not r["kw_cool"]],
    }
    if a.group:
        problems = {k: [r for r in v if r["group"] in a.group] for k, v in problems.items()}
    if a.json:
        print(json.dumps({k: {"pozicij": len(v),
                              "primery": [{"id": r["id"], "name": r["name"],
                                           "group": r["group"]} for r in v[:a.limit]]}
                          for k, v in problems.items()}, ensure_ascii=False, indent=1))
        return 0
    print("Проверка витрины — %d позиций" % len(rows))
    print("Считается по данным, попавшим на страницы каталога. «Не выведено в витрину» "
          "не равно «нет в мастер-таблице»: часть полей на страницу просто не выгружается.\n")
    for name, items in problems.items():
        print("%-34s %5d" % (name, len(items)))
        by_group = {}
        for r in items:
            by_group[r["group"]] = by_group.get(r["group"], 0) + 1
        for g, n in sorted(by_group.items(), key=lambda kv: -kv[1])[:5]:
            print("      %-28s %5d" % (g, n))
        for r in items[:a.limit]:
            print("      · %s  %s" % (r["id"], r["name"][:64]))
        print()
    return 0


def main(argv=None):
    p = argparse.ArgumentParser(description="Поиск по каталогу ИП «ТехноХолод»")
    sub = p.add_subparsers(dest="cmd", required=True)

    sub.add_parser("build", help="пересобрать индекс из katalog-*.html")

    f = sub.add_parser("find", help="найти позиции")
    f.add_argument("--group", action="append", help="slug группы, можно несколько раз")
    f.add_argument("--brand", action="append", help="бренд, можно несколько раз")
    f.add_argument("--q", action="append", help="слово в названии/ТТХ, можно несколько раз")
    f.add_argument("--type", help="тип/исполнение: кассетный, канальный, настенный…")
    f.add_argument("--area", type=float, help="площадь помещения, м²")
    f.add_argument("--btu", type=float, help="требуемая мощность, BTU")
    f.add_argument("--kw", type=float, help="требуемая мощность, кВт")
    f.add_argument("--tol", type=float, default=0.15, help="допуск по мощности, доля (0.15)")
    f.add_argument("--price-max", type=float, dest="price_max")
    f.add_argument("--price-min", type=float, dest="price_min")
    f.add_argument("--instock", action="store_true", help="только то, что в наличии")
    f.add_argument("--compressor", choices=["инвертор", "onoff"],
                   help="тип компрессора: инвертор или On/Off")
    f.add_argument("--heat-to", type=float, dest="heat_to", metavar="C",
                   help="обогрев работает до этой уличной температуры и ниже, например -20")
    f.add_argument("--max-noise", type=float, dest="max_noise", metavar="ДБ",
                   help="шум на минимальной скорости не выше, дБ(А)")
    f.add_argument("--spread", action="store_true",
                   help="три варианта вместо списка: дешевле · рабочий · лучше")
    f.add_argument("--sort", choices=["default", "price", "area"], default="default")
    f.add_argument("--limit", type=int, default=20)
    f.add_argument("--json", action="store_true")

    s = sub.add_parser("show", help="полная карточка")
    s.add_argument("id", nargs="+")
    s.add_argument("--json", action="store_true")

    g = sub.add_parser("groups", help="группы техники")
    g.add_argument("--json", action="store_true")

    b = sub.add_parser("brands", help="бренды")
    b.add_argument("--group", action="append")
    b.add_argument("--json", action="store_true")

    st = sub.add_parser("stats", help="сводка")
    st.add_argument("--json", action="store_true")

    dc = sub.add_parser("doctor", help="дыры и противоречия в витрине")
    dc.add_argument("--group", action="append")
    dc.add_argument("--limit", type=int, default=3, help="сколько примеров показывать")
    dc.add_argument("--json", action="store_true")

    a = p.parse_args(argv)
    if a.cmd == "build":
        build()
        return 0
    return {"find": cmd_find, "show": cmd_show, "groups": cmd_groups,
            "brands": cmd_brands, "stats": cmd_stats, "doctor": cmd_doctor}[a.cmd](a)


if __name__ == "__main__":
    try:
        import signal
        signal.signal(signal.SIGPIPE, signal.SIG_DFL)   # вывод часто уходит в head
    except (ImportError, AttributeError, ValueError):
        pass
    sys.exit(main())
