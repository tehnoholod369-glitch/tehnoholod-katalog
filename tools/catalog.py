#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Поисковый инструмент по каталогу ИП «ТехноХолод» для ИИ-экспертов отдела продаж.

Источник данных — novy-dizayn/data/<группа>.json этого репозитория: именно их читает
живой сайт tehnoholod369.kz (карточка, список, корзина), а список групп и дату данных
задаёт novy-dizayn/data/index.json. Раньше инструмент читал katalog-*.html — страницы,
которые сайт с редизайна не показывает; 22.11.2026 это давало 420 расхождений цены
(Д-08 в otdel-prodazh/reestr-oshibok.md).
Данные собираются пайплайном PIM из мастер-таблицы, поэтому индекс здесь — производная
сайта, а НЕ второй источник правды.
Правится мастер-таблица → пересобираются данные сайта → `catalog.py build`.

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
  doctor                    дыры и противоречия + свежесть файлов-источников

Примеры:
  python3 tools/catalog.py find --group bytovye --area 25 --instock --limit 5
  python3 tools/catalog.py find --q "кассетный" --price-max 900000 --instock
  python3 tools/catalog.py find --group radiatory --brand "Royal Thermo" --json
  python3 tools/catalog.py show bytovye:MDSA-30HRN1
"""

import argparse
import datetime
import hashlib
import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT, "data")
INDEX_PATH = os.path.join(DATA_DIR, "catalog-index.json")
META_PATH = os.path.join(DATA_DIR, "catalog-meta.json")

# Данные живого сайта. index.json — список групп и дата данных; <slug>.json — позиции группы.
SITE_DATA_DIR = os.path.join(ROOT, "novy-dizayn", "data")
SITE_INDEX_PATH = os.path.join(SITE_DATA_DIR, "index.json")

# Файл-источник, не менявшийся дольше этого срока до даты данных сайта, помечается в doctor.
# Не обязательно ошибка (данные могли не меняться), но повод проверить, что группа не отстала.
STALE_DAYS = 14

# Запасные названия групп — на случай, если в index.json название не указано.
# Основное название берётся из index.json (`title`): так их показывает сайт.
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
PRODUCT_URL = "https://tehnoholod369.kz/tovar?g=%s&sl=%s"


# --------------------------------------------------------------------------- #
# Чтение данных сайта
# --------------------------------------------------------------------------- #

def _read_json(path):
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)


def _site_groups():
    """(дата данных сайта, [(slug, название)]) — из novy-dizayn/data/index.json.

    Список групп берётся оттуда же, откуда его берёт сайт, а не перебором файлов:
    в той же папке лежат десятки служебных json, не являющихся группами.
    """
    if not os.path.exists(SITE_INDEX_PATH):
        sys.exit("Нет %s — это клон репозитория каталога? Данные сайта не найдены, "
                 "каталог собрать нельзя." % os.path.relpath(SITE_INDEX_PATH, ROOT))
    idx = _read_json(SITE_INDEX_PATH)
    groups = [(g["slug"], g.get("title") or GROUP_TITLES.get(g["slug"], g["slug"]),
               g.get("count")) for g in idx.get("groups", [])]
    return idx.get("updated"), groups


def _num(text):
    """Первое число из строки: «20.5 м²» → 20.5, «7000 BTU» → 7000.0."""
    if text is None:
        return None
    if isinstance(text, (int, float)):
        return float(text)
    m = re.search(r"-?\d+(?:[.,]\d+)?", str(text).replace(" ", " "))
    return float(m.group(0).replace(",", ".")) if m else None


# p в данных сайта = число (цена в ₸), pt = та же цена текстом, как её видит покупатель.
# 1000000000 при пустой цене текстом — заглушка, а не цена (Д-07 в
# otdel-prodazh/reestr-oshibok.md). В данных сайта на 22.11.2026 таких значений нет;
# проверка оставлена, потому что страницы katalog-*.html их содержали.
PN_STUB = 1_000_000_000


def _price_kzt(raw):
    """Цена в ₸ из позиции данных сайта; нет цены или заглушка — None («нет данных»)."""
    p = raw.get("p")
    if isinstance(p, (int, float)) and not isinstance(p, bool):
        return p if 0 < p < PN_STUB else None
    return _num(raw.get("pt"))


def _chip(chips, pattern):
    """Число из плашки карточки: «до 20 м²», «7000 BTU». Плашки — то, что видит клиент."""
    for c in chips or []:
        m = re.search(pattern, str(c), re.I)
        if m:
            return float(m.group(1).replace(",", "."))
    return None


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


def _normalize(group, group_title, raw, seq, det=None):
    """Одна позиция данных сайта → запись индекса.

    det — запись details/<группа>.json этой позиции: d описание · gl галерея ·
    mn ссылка на инструкцию · vd видео. Сайт сопоставляет её по номеру позиции в
    массиве группы (tovar.txt, load()), так же делаем и мы.

    Поля данных сайта: b бренд · t тип/исполнение · n название · s артикул · sl slug
    (ключ карточки на сайте) · p цена ₸ · pt цена текстом · r цена в рассрочку текстом ·
    st наличие · i фото · pl плашки карточки · sp ТТХ [[ключ, значение], …] ·
    inv inv/onoff · acc 1 = аксессуар · tp id карточки магазина Tilda.
    Поля num, sg, exp не разобраны: смысл num зависит от группы (площадь, Вт, м³/ч),
    поэтому для подбора он не используется — площадь и BTU берутся из ТТХ и плашек.
    """
    specs = _specs_dict(raw.get("sp"))
    chips = raw.get("pl") if isinstance(raw.get("pl"), list) else []
    name = str(raw.get("n") or "").strip()
    art = raw.get("s") or _first(specs, "Артикул", "Код поставщика (НС)", "Код")
    det = det if isinstance(det, dict) else {}
    img = raw.get("i")
    imgs = img if isinstance(img, list) else ([img] if img else [])
    if isinstance(det.get("gl"), list) and det["gl"]:
        imgs = det["gl"]

    # Площадь берётся из ТТХ, а не из плашки: у части карточек (37 позиций на
    # 22.08.2026, в основном FUNAI и ROYAL CLIMA) в числовом поле лежала величина
    # примерно втрое больше паспортной — похоже на объём в м³. Клиенту в названии и в
    # ТТХ показано паспортное значение, по нему и подбираем; расхождение помечаем.
    area_specs = _num(_first(specs, "Площадь", "Площадь помещения"))
    area_field = _chip(chips, r"(\d+(?:[.,]\d+)?)\s*м²")
    area = area_specs if area_specs is not None else area_field
    area_conflict = (area_specs is not None and area_field is not None
                     and abs(area_field - area_specs) > 0.25 * max(area_field, area_specs))
    btu = _chip(chips, r"(\d+(?:[.,]\d+)?)\s*BTU") or _num(_first(specs, "BTU"))
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

    # «В наличии» — только текст, начинающийся с этих слов. «Блок в наличии, наружный —
    # под заказ» (16 позиций мультисплита) в наличие не засчитывается: целиком не продать.
    stock = str(raw.get("st") or "").strip()
    instock = stock.lower().startswith("в наличии")

    p = raw.get("p")
    rec_id = _make_id(group, art, name or ("%s-%04d" % (group, seq)))
    # Прежние сборки (из katalog-*.html) у позиций без артикула строили id из хеша названия.
    # В данных сайта у части таких позиций артикул есть, и id стал другим (1 024 позиции на
    # 22.11.2026). Старый id сохраняем как legacy_id: сделки, записанные по нему, находятся.
    legacy_id = _make_id(group, None, name) if (art and name) else None
    rec = {
        "id": rec_id,
        "legacy_id": legacy_id,
        "group": group,
        "group_title": group_title,
        "brand": str(raw.get("b") or "").strip(),
        "name": name,
        "art": str(art).strip() if art else None,
        "type": str(raw.get("t") or "").strip() or None,
        "price_kzt": _price_kzt(raw),
        "price_stub": (isinstance(p, (int, float)) and not isinstance(p, bool)
                       and p >= PN_STUB) or None,
        "price_text": str(raw.get("pt") or "").strip() or None,
        "rassrochka": str(raw.get("r") or "").strip() or None,
        "stock": stock or None,
        "instock": bool(instock),
        "accessory": True if raw.get("acc") else None,
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
        "wifi": None,                      # в данных сайта отдельного поля нет, только текст в ТТХ
        "img": imgs[0] if imgs else None,
        "imgs": imgs,
        "manual": str(det.get("mn") or "").strip() or None,
        "desc": str(det.get("d") or "").strip() or None,
        "specs": specs,
        "slug": raw.get("sl") or None,
        "tproduct": raw.get("tp") or None,
        "url": (PRODUCT_URL % (group, raw["sl"])) if raw.get("sl") else SITE_URL,
    }
    return rec


def _group_path(slug):
    return os.path.join(SITE_DATA_DIR, slug + ".json")


def build(verbose=True):
    """Пересобирает индекс из novy-dizayn/data/<группа>.json (то, что показывает сайт)."""
    data_updated, groups = _site_groups()
    records = []
    per_page = {}
    for group, title, _count in groups:
        path = _group_path(group)
        if not os.path.exists(path):
            print("  ! %s — файла группы нет, группа пропущена" % os.path.relpath(path, ROOT),
                  file=sys.stderr)
            continue
        arr = _read_json(path)
        if not isinstance(arr, list):
            print("  ! %s — ожидался список позиций, группа пропущена"
                  % os.path.relpath(path, ROOT), file=sys.stderr)
            continue
        dpath = os.path.join(SITE_DATA_DIR, "details", group + ".json")
        details = _read_json(dpath) if os.path.exists(dpath) else {}
        seq = 0
        seen = set()
        for raw in arr:
            seq += 1
            det = (details.get(str(seq - 1)) if isinstance(details, dict)
                   else details[seq - 1] if seq - 1 < len(details) else None)
            rec = _normalize(group, title, raw, seq, det)
            if rec["id"] in seen:                 # один артикул у нескольких позиций
                rec["id"] = "%s#%s" % (rec["id"], raw.get("sl") or seq)
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
        "istochnik": "novy-dizayn/data/<группа>.json этого репозитория (данные живого сайта, "
                     "собранные из мастер-таблицы PIM)",
        "data_sajta": data_updated,
        "vsego_pozicij": len(records),
        "v_nalichii": sum(1 for r in records if r["instock"]),
        "bez_ceny": sum(1 for r in records if not r["price_kzt"]),
        "grupp": len(per_page),
        "po_gruppam": {g: {"nazvanie": next(t for s, t, _ in groups if s == g), "pozicij": n}
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


def _source_files():
    """Файлы данных сайта, из которых собирается индекс: index.json и файл каждой группы."""
    _updated, groups = _site_groups()
    return [SITE_INDEX_PATH] + [_group_path(g) for g, _t, _c in groups
                                if os.path.exists(_group_path(g))]


def _detail_files():
    """Файлы details/<группа>.json — описание, галерея, инструкция."""
    _updated, groups = _site_groups()
    paths = [os.path.join(SITE_DATA_DIR, "details", g + ".json") for g, _t, _c in groups]
    return [p for p in paths if os.path.exists(p)]


def _index_stale():
    """Индекс устарел, если хоть один файл данных сайта новее его."""
    if not os.path.exists(INDEX_PATH):
        return True
    made = os.path.getmtime(INDEX_PATH)
    # Сам разборщик новее индекса — правила разбора изменились, индекс пересобрать.
    sources = _source_files() + _detail_files() + [os.path.abspath(__file__)]
    return any(os.path.getmtime(p) > made for p in sources)


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
    rows = load()
    index = {r["id"]: r for r in rows}
    legacy = {r["legacy_id"]: r for r in rows if r.get("legacy_id") and r["legacy_id"] not in index}
    out = []
    for wanted in a.id:
        rec = index.get(wanted) or legacy.get(wanted)
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
    titles = {}
    for r in rows:
        g = counts.setdefault(r["group"], {"vsego": 0, "v_nalichii": 0})
        g["vsego"] += 1
        g["v_nalichii"] += 1 if r["instock"] else 0
        titles[r["group"]] = r["group_title"]
    if a.json:
        print(json.dumps(counts, ensure_ascii=False, indent=1))
        return 0
    print("%-30s %-38s %7s %10s" % ("slug", "группа", "всего", "в наличии"))
    for slug in sorted(counts, key=lambda s: -counts[s]["vsego"]):
        c = counts[slug]
        print("%-30s %-38s %7d %10d"
              % (slug, titles.get(slug, slug), c["vsego"], c["v_nalichii"]))
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
    print("Дата данных сайта (index.json): %s" % (meta.get("data_sajta") or "нет данных"))
    return 0


def _source_dates():
    """Дата последнего изменения каждого файла-источника.

    Берётся из git (дата последнего коммита, менявшего файл). Время изменения файла на
    диске для этого не годится: свежий клон ставит его равным моменту клонирования.
    Нет git или клон неполный (--depth) — дата по диску, помечена как ненадёжная.
    """
    use_git = True
    try:
        shallow = subprocess.run(["git", "-C", ROOT, "rev-parse", "--is-shallow-repository"],
                                 capture_output=True, text=True, timeout=30).stdout.strip()
        use_git = shallow == "false"
    except (OSError, subprocess.SubprocessError):
        use_git = False
    out = []
    for p in _source_files():
        rel = os.path.relpath(p, ROOT).replace("\\", "/")
        date, how = None, "диск (ненадёжно)"
        if use_git:
            try:
                d = subprocess.run(["git", "-C", ROOT, "log", "-1", "--format=%cs", "--", rel],
                                   capture_output=True, text=True, timeout=60).stdout.strip()
                if d:
                    date, how = d, "git"
            except (OSError, subprocess.SubprocessError):
                pass
        if date is None:
            date = datetime.date.fromtimestamp(os.path.getmtime(p)).isoformat()
        out.append({"file": rel, "date": date, "how": how})
    return out


def _freshness(rows):
    """Дата самого старого файла-источника против даты данных сайта (Д-08).

    Ловит ситуацию, когда часть источников отстала от остальных: 17 из 26 страниц
    katalog-*.html не обновлялись с 08.09.2026, а инструмент об этом молчал.
    «Не менялся» не равно «устарел» — данные могли не меняться; это повод проверить.
    """
    data_updated, groups = _site_groups()
    d_site = datetime.date.fromisoformat(data_updated) if data_updated else None
    dates = _source_dates()
    group_files = [d for d in dates if not d["file"].endswith("novy-dizayn/data/index.json")]
    for d in group_files:
        d["lag_days"] = ((d_site - datetime.date.fromisoformat(d["date"])).days
                         if d_site else None)
    oldest = min(group_files, key=lambda d: d["date"]) if group_files else None
    counts = {}
    for r in rows:
        counts[r["group"]] = counts.get(r["group"], 0) + 1
    mismatch = [{"group": g, "v_index_json": c, "v_fajle": counts.get(g, 0)}
                for g, _t, c in groups if c is not None and counts.get(g, 0) != c]
    today = datetime.date.today()
    return {
        "data_sajta": data_updated,
        "dnej_s_dati_sajta": (today - d_site).days if d_site else None,
        "samyj_staryj_istochnik": oldest,
        "otstayut": sorted([d for d in group_files
                            if d["lag_days"] is not None and d["lag_days"] > STALE_DAYS],
                           key=lambda d: d["date"]),
        "porog_dnej": STALE_DAYS,
        "chislo_pozicij_raznoe": mismatch,
        "gruppy_bez_cheka_po_git": [d["file"] for d in group_files if d["how"] != "git"],
    }


def _price_text_mismatch(r):
    """Число p и текст pt — две записи одной цены; на сайте виден текст."""
    if r["price_kzt"] is None and r["price_text"]:
        return True
    if r["price_kzt"] is not None and not r["price_text"]:
        return True
    if r["price_kzt"] is not None:
        digits = re.sub(r"\D", "", r["price_text"])      # «97 505 ₸» → 97505, пробелы любые
        return not digits or abs(int(digits) - r["price_kzt"]) > 0.5
    return False


def _print_freshness(f):
    print("СВЕЖЕСТЬ ИСТОЧНИКА")
    print("  дата данных сайта (index.json, поле updated): %s" % (f["data_sajta"] or "нет данных"))
    if f["dnej_s_dati_sajta"] is not None:
        print("  с этой даты прошло дней: %d" % f["dnej_s_dati_sajta"])
    o = f["samyj_staryj_istochnik"]
    if o:
        print("  самый старый файл-источник: %s — последнее изменение %s (%s)"
              % (o["file"], o["date"], o["how"]))
    if f["otstayut"]:
        print("  не менялись более %d дн. до даты данных сайта: %d"
              % (f["porog_dnej"], len(f["otstayut"])))
        for d in f["otstayut"][:10]:
            print("      · %-48s %s  (на %d дн. раньше)" % (d["file"], d["date"], d["lag_days"]))
        print("    Это повод проверить, что группа не отстала от мастера, а не вывод, "
              "что цены в ней неверны.")
    else:
        print("  отстающих файлов нет (порог %d дн.)" % f["porog_dnej"])
    if f["chislo_pozicij_raznoe"]:
        print("  число позиций не совпадает с index.json:")
        for m in f["chislo_pozicij_raznoe"]:
            print("      · %s: в index.json %d, в файле %d"
                  % (m["group"], m["v_index_json"], m["v_fajle"]))
    if f["gruppy_bez_cheka_po_git"]:
        print("  дата по git недоступна (нет git или неполный клон) для %d файлов — "
              "даты по диску ненадёжны" % len(f["gruppy_bez_cheka_po_git"]))
    print()


def cmd_doctor(a):
    """Дыры и противоречия в данных сайта — сырьё для предложений владельцу."""
    rows = load()
    problems = {
        "без цены": [r for r in rows if not r["price_kzt"]],
        "заглушка вместо цены (pn >= 1e9)": [r for r in rows if r.get("price_stub")],
        "число p и текст pt цены расходятся": [r for r in rows if _price_text_mismatch(r)],
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
    fresh = _freshness(rows)
    if a.json:
        out = {k: {"pozicij": len(v),
                   "primery": [{"id": r["id"], "name": r["name"],
                                "group": r["group"]} for r in v[:a.limit]]}
               for k, v in problems.items()}
        out["svezhest_istochnika"] = fresh
        print(json.dumps(out, ensure_ascii=False, indent=1))
        return 0
    print("Проверка данных сайта — %d позиций" % len(rows))
    print("Считается по novy-dizayn/data — тем данным, которые показывает сайт. «Не выведено» "
          "не равно «нет в мастер-таблице»: часть полей в данные сайта не выгружается.\n")
    _print_freshness(fresh)
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

    sub.add_parser("build", help="пересобрать индекс из novy-dizayn/data (данные сайта)")

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

    dc = sub.add_parser("doctor", help="дыры и противоречия в данных сайта, свежесть источников")
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
