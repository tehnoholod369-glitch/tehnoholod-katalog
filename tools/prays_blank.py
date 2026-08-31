#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Прайс на монтажные работы ИП «ТехноХолод» — документ для клиента из того же файла цен,
по которому собирается КП.

Смысл в единственном источнике: прайс на сайте и цена в КП расходятся ровно тогда, когда
их ведут по отдельности. Здесь и там — `prays-montazha.json` в папке данных отдела.

Печатаются только утверждённые разделы. Неутверждённое в клиентский документ не попадает
и попадать не должно: цена, которой владелец не решал, показанная клиенту, становится
обещанием.

  python3 tools/prays_blank.py                 # только утверждённое, для клиента
  python3 tools/prays_blank.py --vnutrennij    # плюс предложения — для решения владельца
"""

import argparse
import json
import os
import sys
from datetime import datetime, timedelta, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "tools"))
from ledger import OTDEL_DIR                                    # noqa: E402
from kp_blank import STIL, dengi, po_russki, logotip_data_uri   # noqa: E402

TZ = timezone(timedelta(hours=5), "Алматы")
PRAYS = os.path.join(OTDEL_DIR, "prays-montazha.json")
REKVIZITY = os.path.join(OTDEL_DIR, "rekvizity.json")

# Порядок разделов в документе: сперва то, что продаётся чаще.
PORYADOK = [
    ("split", "Бытовые сплит-системы"),
    ("multisplit", "Мультисплит-системы"),
    ("poluprom", "Полупромышленные: кассетные, канальные, колонные"),
    ("vodonagrevateli", "Водонагреватели"),
    ("radiatory", "Радиаторы отопления"),
    ("teplovye_zavesy", "Тепловые завесы"),
    ("ventilyaciya", "Вентиляция"),
    ("rekuperatory", "Рекуператоры"),
]

DOP_STIL = """
  .zametka { background: #F4F8FC; border-left: 3px solid #1B7FD4; padding: 8px 12px;
             margin: 12px 0; font-size: 9.5pt; }
  .ne-utv { background: #FDF3F2; border-left-color: #E8402A; }
  tr.razdel td { padding-top: 14px; border-bottom: none; font-weight: 700;
                 color: #1B7FD4; text-transform: uppercase; font-size: 9pt;
                 letter-spacing: .5px; }
  td.bez { color: #777; }
  th.bez { color: #999; }
  /* Заголовки «Цена с НДС» и «Без НДС» шире, чем в КП: там колонки были под суммы,
     здесь под подписи, и узкие столбцы наезжали на слово «Работа». */
  table.poz col.c-cena { width: 96px; }
  table.poz col.c-sum { width: 88px; }
  /* В КП левой была вторая колонка — там первой шёл номер строки. Здесь номеров нет,
     и без этого «Работа» прижималась вправо, к «Цене с НДС». */
  table.poz thead th:first-child { text-align: left; }
"""


def stroki(prays, s_predlozheniyami):
    out, zhdut = [], []
    for klyuch, zagolovok in PORYADOK:
        razdel = prays.get(klyuch)
        if not razdel:
            continue
        utv = bool(razdel.get("utverzhdeno"))
        if not utv:
            zhdut.append(zagolovok)
            if not s_predlozheniyami:
                continue
        out.append('<tr class="razdel"><td colspan="4">%s%s</td></tr>'
                   % (zagolovok, "" if utv else " — предложение, не утверждено"))
        for k, r in razdel.items():
            if k.startswith("_") or k == "utverzhdeno" or not isinstance(r, dict):
                continue
            if r.get("price") is None:
                out.append('<tr><td class="nz" colspan="2">%s</td>'
                           '<td class="sum utoch" colspan="2">по проекту</td></tr>'
                           % r["name"])
                continue
            hvost = "/%s" % r["unit"] if r.get("unit") != "шт" else ""
            out.append('<tr><td class="nz" colspan="2">%s%s</td>'
                       '<td class="sum">%s%s</td><td class="sum bez">%s</td></tr>'
                       % (r["name"],
                          " · по замеру" if r.get("po_zameru") else "",
                          dengi(r["price"]), hvost,
                          dengi(round(r["price"] / 1.16))))
    return "\n".join(out), zhdut


def vyezd_stroki(prays):
    v = prays.get("vyezd", {})
    if not v.get("utverzhdeno"):
        return ""
    out = ['<tr class="razdel"><td colspan="4">Выезд бригады</td></tr>']
    for z in v.get("zony", []):
        if z["price"] is None:
            cena, bez = "считается отдельно", ""
        elif z["price"] == 0:
            cena, bez = "включён", ""
        else:
            cena, bez = dengi(z["price"]), dengi(round(z["price"] / 1.16))
        klass = "sum" if z["price"] else "sum utoch"
        out.append('<tr><td class="nz" colspan="2">%s%s</td>'
                   '<td class="%s">%s</td><td class="sum bez">%s</td></tr>'
                   % (z["name"],
                      "<br><span style=\"color:#777;font-size:9pt\">%s</span>" % z["_primery"]
                      if z.get("_primery") else "",
                      klass, cena, bez))
    return "\n".join(out)


TEMPLATE = """<!doctype html>
<html lang="ru"><head><meta charset="utf-8">
<title>Прайс на монтажные работы</title>
<style>
{stil}
{dop_stil}
</style></head><body>
<div class="list">

<header>
  {logo}
  <div class="firma">{kompaniya}<small>Климатическое оборудование · продажа, монтаж, сервис</small></div>
  <div class="nomer">Прайс на монтажные работы<b>{data}</b></div>
</header>

<h1>Монтажные работы</h1>

<div class="zametka">
  Все цены — <b>с НДС 16 %</b>. Отдельная колонка «без НДС» приведена для организаций,
  которые считают затраты без налога. Цена работ не зависит от того, у кого куплено
  оборудование.
</div>

<table class="poz">
  <colgroup><col><col class="c-kol"><col class="c-cena"><col class="c-sum"></colgroup>
  <thead><tr><th colspan="2">Работа</th><th>Цена с НДС</th><th class="bez">Без НДС</th></tr></thead>
  <tbody>
{vyezd}
{stroki}
  </tbody>
</table>

{zhdut}

<h2>Что входит и чего нет</h2>
<dl>
  <dt>Входит в монтаж сплит-системы</dt><dd>{sostav_split}</dd>
  <dt>Гарантия на монтажные работы</dt><dd>{garantiya}</dd>
  <dt>Не входит ни в одну работу</dt><dd><ul>{ne_vhodit}</ul></dd>
  <dt>Выезд считается</dt><dd>от адреса выезда бригады, один раз на адрес, а не на блок</dd>
</dl>

<footer>
  <b>{kompaniya}</b> · {rukovoditel}<br>
  {adres_fakt}<br>
  Юридический адрес: {adres_yur}<br>
  ИИН/БИН {iin} · {nds_status}<br>
  {telefon} · {email} · {sajt}
</footer>

</div></body></html>
"""


def main(argv=None):
    p = argparse.ArgumentParser(description="Прайс на монтажные работы")
    p.add_argument("--vnutrennij", action="store_true",
                   help="печатать и неутверждённые разделы — для решения владельца, "
                        "не для клиента")
    p.add_argument("--kuda", help="папка для файла; по умолчанию <данные отдела>/kp")
    a = p.parse_args(argv)

    with open(PRAYS, encoding="utf-8") as fh:
        prays = json.load(fh)
    with open(REKVIZITY, encoding="utf-8") as fh:
        rek = json.load(fh)

    tela, zhdut = stroki(prays, a.vnutrennij)
    zhdut_blok = ""
    if zhdut and not a.vnutrennij:
        zhdut_blok = ('<div class="zametka ne-utv">Работы по этим направлениям считаются '
                      'по объекту: %s. Цену называем после замера.</div>'
                      % ", ".join(z.lower() for z in zhdut))

    kuda = a.kuda or os.path.join(OTDEL_DIR, "kp")
    os.makedirs(kuda, exist_ok=True)
    imya = "Прайс-монтаж%s.html" % ("-внутренний" if a.vnutrennij else "")
    put = os.path.join(kuda, imya)

    with open(put, "w", encoding="utf-8") as fh:
        fh.write(TEMPLATE.format(
            stil=STIL, dop_stil=DOP_STIL,
            logo=('<img class="logo" src="%s" alt="">' % logotip_data_uri(rek))
                 if logotip_data_uri(rek) else "",
            data=po_russki(datetime.now(TZ).date()),
            kompaniya=rek["kompaniya"],
            vyezd=vyezd_stroki(prays), stroki=tela, zhdut=zhdut_blok,
            sostav_split=prays["split"]["montazh"].get("_sostav", "нет данных"),
            garantiya=rek["usloviya"]["garantiya_montazh"],
            ne_vhodit="".join("<li>%s</li>" % x
                              for x in rek["usloviya"]["ne_vhodit"]),
            rukovoditel=rek["rukovoditel"],
            adres_fakt=rek["adres_fakticheskij"],
            adres_yur=rek["adres_yuridicheskij"],
            iin=rek["iin_bin"], nds_status=rek["nds_status"],
            telefon=rek["telefon"], email=rek["email"], sajt=rek["sajt"]))

    print("Прайс: %s" % put)
    if zhdut:
        print("Не утверждено владельцем и %s: %s"
              % ("показано с пометкой" if a.vnutrennij else "в документ не попало",
                 ", ".join(zhdut)), file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
