#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Бланк коммерческого предложения ИП «ТехноХолод» — оформление, а не расчёт.

Деньги считает навык `kp-generator` (`kp_calc.py`), и только он: второй счётчик НДС
разойдётся с первым в первый же месяц. Здесь берётся его выдача `--json` и раскладывается
по бланку — логотип, реквизиты, условия, подписи.

Отдаёт два файла рядом:
  КП-<сделка>.html   — печатать в PDF из браузера (Ctrl+P → «Сохранить как PDF»)
  КП-<сделка>.txt    — та же смета текстом, для WhatsApp

По своду 4П:
  Правдиво    строка без цены пишется «требует уточнения», а не правдоподобной суммой;
              итог называется «по оборудованию», пока монтаж не посчитан.
  Практично   одна команда, ничего не нужно доустанавливать: логотип встроен в HTML.
  Прагматично расчёт не дублируется, реквизиты лежат одним файлом.
  Оптимально  без внешних библиотек — HTML печатается в PDF браузером.
  Красиво     A4, цвета логотипа, воздух вокруг цифр.

  python3 tools/kp_blank.py --in kp.json
  python3 tools/kp_blank.py --in kp.json --nomer КП-D-20260823-001 --data 2026-08-23
"""

import argparse
import base64
import json
import os
import subprocess
import sys
from datetime import datetime, timedelta, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "tools"))
from ledger import OTDEL_DIR  # noqa: E402 — единый ответ на «где лежат данные отдела»

TZ = timezone(timedelta(hours=5), "Алматы")
REKVIZITY = os.path.join(ROOT, "otdel-prodazh", "rekvizity.json")
KP_CALC = os.path.expanduser(
    "~/.claude/skills/synced/kp-generator/scripts/kp_calc.py")

MESYACY = ("января", "февраля", "марта", "апреля", "мая", "июня",
           "июля", "августа", "сентября", "октября", "ноября", "декабря")
NET = "требует уточнения"


def dengi(v):
    return "{:,}".format(int(round(v))).replace(",", " ") + " ₸"


def po_russki(d):
    return "%d %s %d г." % (d.day, MESYACY[d.month - 1], d.year)


def schitat(put_json):
    """Деньги — только из kp_calc.py. Своего расчёта здесь нет и быть не должно."""
    if not os.path.exists(KP_CALC):
        print("Не найден расчётчик КП: %s\nБез него бланк заполнять нечем — считать "
              "суммы здесь нельзя, это работа навыка kp-generator." % KP_CALC,
              file=sys.stderr)
        raise SystemExit(2)
    r = subprocess.run([sys.executable, KP_CALC, "--in", put_json, "--json"],
                       capture_output=True, text=True)
    if r.returncode != 0:
        print(r.stderr.strip() or "kp_calc.py вернул ошибку", file=sys.stderr)
        raise SystemExit(r.returncode)
    return json.loads(r.stdout)


def logotip_data_uri(rek):
    put = os.path.join(ROOT, rek.get("logotip", ""))
    if not os.path.exists(put):
        return None
    with open(put, "rb") as fh:
        return "data:image/png;base64," + base64.b64encode(fh.read()).decode("ascii")


def stroki_html(pozicii, pustaya_podpis):
    """Строка без цены не выдумывается: она остаётся в КП с пометкой."""
    if not pozicii:
        return ('<tr><td class="n">1.</td><td class="nz">%s</td>'
                '<td class="sum utoch" colspan="3">%s</td></tr>'
                % (pustaya_podpis, NET))
    out = []
    for i, p in enumerate(pozicii, 1):
        out.append(
            '<tr><td class="n">%d.</td><td class="nz">%s</td>'
            '<td class="kol">%d шт</td><td class="cena">%s</td>'
            '<td class="sum">%s</td></tr>'
            % (i, p["name"], p["qty"], dengi(p["price"]), dengi(p["sum"])))
    return "\n".join(out)


def sobrat_html(dan, raschet, rek, nomer, data, logo):
    u = rek["usloviya"]
    do = data + timedelta(days=u["srok_deystviya_dney"])
    est_montazh = bool(raschet["install"])
    itog_podpis = "ИТОГО ПО КП" if est_montazh else "ИТОГО ПО ОБОРУДОВАНИЮ"
    itog_summa = raschet["grand_total"]
    itog_nds = raschet["grand_total_vat"]

    # Раздел «Монтаж» печатается всегда, даже когда цены нет. Убрать его — значит
    # молча ответить не на тот вопрос: клиент просил предложение с установкой.
    montazh_blok = """
  <h2>Монтаж и пусконаладка</h2>
  <table class="poz">
    <colgroup><col class="c-n"><col><col class="c-kol"><col class="c-cena"><col class="c-sum"></colgroup>
    <thead><tr><th></th><th>Наименование</th><th>Кол-во</th><th>Цена</th><th>Сумма</th></tr></thead>
    <tbody>%s</tbody>
  </table>
  %s""" % (
        stroki_html(raschet["install"],
                    "Монтаж и пусконаладка оборудования по спецификации выше"),
        ('<p class="itogo-razdel">Итого монтаж и пусконаладка: <b>%s</b>'
             '<span class="nds">в том числе НДС 16 %% — %s</span></p>'
             % (dengi(raschet["install_totals"]["gross"]),
                dengi(raschet["install_totals"]["vat"]))
         if est_montazh else
         '<p class="primech">Стоимость монтажа определяется после осмотра объекта. '
         'Назвать её заранее нельзя: она зависит от длины трассы, места наружного '
         'блока и доступа к нему.</p>'))

    oplata = u.get("oplata") or NET
    postavka = u.get("srok_postavki") or NET
    ne_vhodit = "".join("<li>%s</li>" % x for x in u["ne_vhodit"])
    telefon = rek["telefon"]
    if rek.get("telefon_v_kp") == "oba":
        telefon += " · " + rek["telefon_dopolnitelnyj"]

    return TEMPLATE.format(
        nomer=nomer,
        data=po_russki(data),
        do=po_russki(do),
        logo=('<img class="logo" src="%s" alt="">' % logo) if logo else "",
        kompaniya=rek["kompaniya"],
        klient=dan.get("customer") or NET,
        obekt=dan.get("object") or NET,
        stroki_oborud=stroki_html(raschet["equipment"], "Оборудование по спецификации"),
        itogo_oborud=dengi(raschet["equipment_totals"]["gross"]),
        nds_oborud=dengi(raschet["equipment_totals"]["vat"]),
        montazh_blok=montazh_blok,
        itog_podpis=itog_podpis,
        itog_summa=dengi(itog_summa),
        itog_nds=dengi(itog_nds),
        srok_dney=u["srok_deystviya_dney"],
        oplata=oplata,
        postavka=postavka,
        garantiya_ob=u["garantiya_oborudovanie"],
        garantiya_mo=u["garantiya_montazh"],
        ne_vhodit=ne_vhodit,
        rukovoditel=rek["rukovoditel"],
        adres_fakt=rek["adres_fakticheskij"],
        adres_yur=rek["adres_yuridicheskij"],
        iin=rek["iin_bin"],
        nds_status=rek["nds_status"],
        telefon=telefon,
        email=rek["email"],
        sajt=rek["sajt"],
        bank=rek["bank"],
        bik=rek["bik"],
        iik=rek["iik"],
    )


def sobrat_text(dan, raschet, rek, nomer, data):
    """То же самое для WhatsApp: без таблиц и рамок, они там разваливаются."""
    L = ["%s от %s" % (nomer, po_russki(data)), ""]
    if dan.get("customer"):
        L.append("Для: " + dan["customer"])
    if dan.get("object"):
        L.append("Объект: " + dan["object"])
    L += ["", "ОБОРУДОВАНИЕ"]
    for i, p in enumerate(raschet["equipment"], 1):
        L.append("%d. %s" % (i, p["name"]))
        L.append("   %d × %s = %s" % (p["qty"], dengi(p["price"]), dengi(p["sum"])))
    L.append("Итого оборудование: %s, в том числе НДС 16 %% — %s"
             % (dengi(raschet["equipment_totals"]["gross"]),
                dengi(raschet["equipment_totals"]["vat"])))
    L += ["", "МОНТАЖ И ПУСКОНАЛАДКА"]
    if raschet["install"]:
        for i, p in enumerate(raschet["install"], 1):
            L.append("%d. %s — %d × %s = %s"
                     % (i, p["name"], p["qty"], dengi(p["price"]), dengi(p["sum"])))
        L.append("Итого монтаж: %s, в том числе НДС 16 %% — %s"
                 % (dengi(raschet["install_totals"]["gross"]),
                    dengi(raschet["install_totals"]["vat"])))
        itog = "ИТОГО ПО КП"
    else:
        L.append("Стоимость монтажа определяется после осмотра объекта.")
        itog = "ИТОГО ПО ОБОРУДОВАНИЮ"
    u = rek["usloviya"]
    do = data + timedelta(days=u["srok_deystviya_dney"])
    L += ["", "%s: %s, в том числе НДС 16 %% — %s"
          % (itog, dengi(raschet["grand_total"]), dengi(raschet["grand_total_vat"])),
          "", "Предложение действует до %s" % po_russki(do),
          "Гарантия на оборудование — %s." % u["garantiya_oborudovanie"],
          "Гарантия на монтаж — %s." % u["garantiya_montazh"],
          "", "%s, %s, %s" % (rek["kompaniya"], rek["telefon"], rek["sajt"])]
    return "\n".join(L)


TEMPLATE = """<!doctype html>
<html lang="ru"><head><meta charset="utf-8">
<title>{nomer}</title>
<style>
  @page {{ size: A4; margin: 14mm 14mm 12mm; }}
  * {{ box-sizing: border-box; }}
  body {{ margin: 0; font: 10.5pt/1.45 "Segoe UI", Arial, sans-serif; color: #1b1b1b; }}
  .list {{ max-width: 182mm; margin: 0 auto; padding: 8mm 0; }}
  header {{ display: flex; align-items: center; gap: 14px;
            border-bottom: 2px solid #1B7FD4; padding-bottom: 10px; }}
  .logo {{ width: 58px; height: 58px; }}
  .firma {{ font-size: 15pt; font-weight: 700; letter-spacing: .2px; }}
  .firma small {{ display: block; font-size: 8.5pt; font-weight: 400; color: #555;
                  letter-spacing: 0; margin-top: 2px; }}
  .nomer {{ margin-left: auto; text-align: right; font-size: 9.5pt; color: #555; }}
  .nomer b {{ display: block; font-size: 12pt; color: #1b1b1b; }}
  h1 {{ font-size: 14pt; margin: 16px 0 4px; }}
  .komu {{ margin: 10px 0 16px; }}
  .komu div {{ margin: 2px 0; }}
  .komu span {{ display: inline-block; min-width: 74px; color: #666; }}
  h2 {{ font-size: 10.5pt; text-transform: uppercase; letter-spacing: .6px;
        color: #1B7FD4; margin: 18px 0 6px; }}
  table.poz {{ width: 100%; border-collapse: collapse; table-layout: fixed; }}
  table.poz col.c-n {{ width: 22px; }}
  table.poz col.c-kol {{ width: 52px; }}
  table.poz col.c-cena {{ width: 78px; }}
  table.poz col.c-sum {{ width: 96px; }}
  table.poz th {{ font-size: 8.5pt; text-transform: uppercase; letter-spacing: .4px;
                  color: #777; font-weight: 600; text-align: right;
                  border-bottom: 1px solid #ddd; padding: 0 0 5px; }}
  table.poz th:nth-child(2) {{ text-align: left; }}
  table.poz td {{ padding: 7px 0; border-bottom: 1px solid #eee; vertical-align: top; }}
  td.n {{ color: #999; }}
  td.nz {{ padding-right: 10px; }}
  td.kol, td.cena, td.sum {{ text-align: right; white-space: nowrap; padding-left: 12px; }}
  td.sum {{ font-weight: 600; }}
  td.utoch {{ font-weight: 400; color: #C0392B; font-style: italic; }}
  .itogo-razdel {{ text-align: right; margin: 8px 0 0; }}
  .itogo-razdel .nds {{ display: block; font-size: 9pt; color: #666; }}
  .primech {{ margin: 8px 0 0; font-size: 9.5pt; color: #555; }}
  .itog {{ margin-top: 18px; border-top: 2px solid #E8402A; padding-top: 10px;
           display: flex; align-items: baseline; }}
  .itog .p {{ font-size: 11pt; font-weight: 700; text-transform: uppercase;
              letter-spacing: .5px; }}
  .itog .s {{ margin-left: auto; text-align: right; }}
  .itog .s b {{ font-size: 16pt; }}
  .itog .s span {{ display: block; font-size: 9pt; color: #666; }}
  dl {{ display: grid; grid-template-columns: 58mm 1fr; gap: 5px 10px; margin: 8px 0 0; }}
  dt {{ color: #666; }}
  dd {{ margin: 0; }}
  dd.utoch {{ color: #C0392B; font-style: italic; }}
  ul {{ margin: 4px 0 0; padding-left: 18px; }}
  li {{ margin: 2px 0; }}
  footer {{ margin-top: 22px; border-top: 1px solid #ddd; padding-top: 10px;
            font-size: 8.5pt; color: #555; line-height: 1.6; }}
  footer b {{ color: #1b1b1b; font-size: 9.5pt; }}
  @media print {{ .list {{ padding: 0; }} }}
</style></head><body>
<div class="list">

<header>
  {logo}
  <div class="firma">{kompaniya}<small>Климатическое оборудование · продажа, монтаж, сервис</small></div>
  <div class="nomer">Коммерческое предложение<b>{nomer}</b>{data}</div>
</header>

<h1>Предложение по климатическому оборудованию</h1>

<div class="komu">
  <div><span>Кому:</span>{klient}</div>
  <div><span>Объект:</span>{obekt}</div>
</div>

<h2>Оборудование</h2>
<table class="poz">
  <colgroup><col class="c-n"><col><col class="c-kol"><col class="c-cena"><col class="c-sum"></colgroup>
  <thead><tr><th></th><th>Наименование</th><th>Кол-во</th><th>Цена</th><th>Сумма</th></tr></thead>
  <tbody>{stroki_oborud}</tbody>
</table>
<p class="itogo-razdel">Итого оборудование: <b>{itogo_oborud}</b>
  <span class="nds">в том числе НДС 16 % — {nds_oborud}</span></p>
{montazh_blok}

<div class="itog">
  <div class="p">{itog_podpis}</div>
  <div class="s"><b>{itog_summa}</b><span>в том числе НДС 16 % — {itog_nds}</span></div>
</div>

<h2>Условия</h2>
<dl>
  <dt>Срок действия предложения</dt><dd>{srok_dney} календарных дней, до {do}</dd>
  <dt>Срок поставки</dt><dd class="utoch">{postavka}</dd>
  <dt>Порядок оплаты</dt><dd class="utoch">{oplata}</dd>
  <dt>Гарантия на оборудование</dt><dd>{garantiya_ob}</dd>
  <dt>Гарантия на монтажные работы</dt><dd>{garantiya_mo}</dd>
  <dt>Не входит в предложение</dt><dd><ul>{ne_vhodit}</ul></dd>
</dl>

<footer>
  <b>{kompaniya}</b> · {rukovoditel}<br>
  {adres_fakt}<br>
  Юридический адрес: {adres_yur}<br>
  ИИН/БИН {iin} · {nds_status}<br>
  {telefon} · {email} · {sajt}<br>
  {bank} · БИК {bik} · ИИК {iik}
</footer>

</div></body></html>
"""


def main(argv=None):
    p = argparse.ArgumentParser(description="Бланк КП ИП «ТехноХолод»")
    p.add_argument("--in", dest="vhod", required=True,
                   help="JSON контракта kp-generator, его делает ledger.py kp-json")
    p.add_argument("--nomer", help="номер КП; по умолчанию КП-<сделка> из контракта")
    p.add_argument("--data", help="дата в виде ГГГГ-ММ-ДД; по умолчанию сегодня")
    p.add_argument("--kuda", help="папка для файлов; по умолчанию <данные отдела>/kp")
    a = p.parse_args(argv)

    with open(a.vhod, encoding="utf-8") as fh:
        dan = json.load(fh)
    with open(REKVIZITY, encoding="utf-8") as fh:
        rek = json.load(fh)

    raschet = schitat(a.vhod)
    data = (datetime.strptime(a.data, "%Y-%m-%d").date() if a.data
            else datetime.now(TZ).date())
    sdelka = dan.get("_sdelka")
    nomer = a.nomer or ("КП-%s" % sdelka if sdelka else "КП-без-сделки")

    kuda = a.kuda or os.path.join(OTDEL_DIR, "kp")
    os.makedirs(kuda, exist_ok=True)
    put_html = os.path.join(kuda, nomer + ".html")
    put_txt = os.path.join(kuda, nomer + ".txt")

    with open(put_html, "w", encoding="utf-8") as fh:
        fh.write(sobrat_html(dan, raschet, rek, nomer, data, logotip_data_uri(rek)))
    with open(put_txt, "w", encoding="utf-8") as fh:
        fh.write(sobrat_text(dan, raschet, rek, nomer, data) + "\n")

    print("Бланк:   %s" % put_html)
    print("Текст:   %s" % put_txt)
    print("В PDF:   открыть html в браузере, Ctrl+P → «Сохранить как PDF», поля по умолчанию")
    if not raschet["install"]:
        print("\nМонтаж в КП не посчитан — в бланке стоит «требует уточнения». "
              "Клиенту, который просил «с установкой», это видно.", file=sys.stderr)
    for pole, imya in (("oplata", "порядок оплаты"), ("srok_postavki", "срок поставки")):
        if not rek["usloviya"].get(pole):
            print("Не заполнено в otdel-prodazh/rekvizity.json: %s — в бланке "
                  "«требует уточнения»." % imya, file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
