/* Отзывы с Kaspi на карточке товара (/tovar).
   1) Есть отзывы именно на эту модель -> показываем их.
   2) Нет -> отзывы покупателей нашего магазина на технику того же типа, с названием купленной модели.
   Разметку Review/AggregateRating не пишем, рейтинг не считаем. Данные: data/kaspi-reviews.json (обновляется раз в месяц).
   Если на карточке уже есть блок «Отзывы покупателей на Kaspi.kz» из details/*.json, скрипт молчит. */
(function () {
  "use strict";
  var RAW = "https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/main/novy-dizayn/data/";
  var SHOP = "https://kaspi.kz/shop/info/merchant/13704016/reviews-tab/?merchantId=13704016";
  var MARK = "data-th-kaspi-card";

  // Тип техники по названию на Kaspi. Порядок важен: сначала узкие признаки.
  var KIND_RULES = [
    ["osush", /осушител|\bBD\s?\d|\bRD-|\bRAD-|\bBDR-|\bBDI-|\bBDH-/i],
    ["vodo", /водонагреватель/i],
    ["osmos", /осмос|фильтр.*вод/i],
    ["kamin", /электрокамин|очаг|каминокомплект|\bEFP\//i],
    ["ik", /инфракрасн|газов.*обогреват|\bBIGH|\bBOGH|\bLQ-H|\bBIH-/i],
    ["pushka", /тепловая пушка|\bBHP-|электрическая\s+BHP/i],
    ["konv", /конвектор|\bREC-|масляный радиатор|\bROR-/i],
    ["kond", /Кондиционер\s*\+\s*Бризер|\bTAC-/i],
    ["ochist", /очиститель|бризер|\bASP-/i],
    ["mobil", /\bEACM|\bBPAC|мобильн/i],
    ["kond", /\bTCL\b|Freshin|\bHisense\b|\bAS-\d|\bRAC-|\bRC-|\bRCI-|\bBSO-|Royal Fresh|кондиционер/i]
  ];
  // Группа каталога -> типы техники, отзывы на которые уместны «по теме».
  var GROUP_KINDS = {
    "bytovye": ["kond"], "multisplit": ["kond"], "mobilnye": ["mobil"],
    "osushiteli": ["osush"], "vodonagrevateli": ["vodo"], "vodoochistka": ["osmos"],
    "kaminy": ["kamin"], "infrakrasnye-obogrevateli": ["ik"], "teplovye-pushki": ["pushka"],
    "obogrevateli": ["konv"]
  };
  var KIND_LABEL = {
    kond: "кондиционеры", mobil: "мобильные кондиционеры", osush: "осушители воздуха", vodo: "водонагреватели",
    osmos: "системы очистки воды", kamin: "электрокамины", ik: "обогреватели", pushka: "тепловые пушки",
    konv: "конвекторы и масляные радиаторы", ochist: "очистители воздуха"
  };

  function kindOf(name) {
    for (var i = 0; i < KIND_RULES.length; i++) if (KIND_RULES[i][1].test(name || "")) return KIND_RULES[i][0];
    return "";
  }
  function norm(s) { return String(s || "").toLowerCase().replace(/[^a-z0-9а-яё]+/g, ""); }
  function dateKey(d) { var m = /(\d\d)\.(\d\d)\.(\d{4})/.exec(d || ""); return m ? m[3] + m[2] + m[1] : "0"; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function stars(n) { n = Math.max(1, Math.min(5, +n || 5)); return "★".repeat(n) + "☆".repeat(5 - n); }

  // Выбор отзывов: самые свежие, но низкие оценки не прячем (одна из последних десяти — в выдачу).
  function pick(list, max) {
    var s = list.slice().sort(function (a, b) { return dateKey(b.d) < dateKey(a.d) ? -1 : dateKey(b.d) > dateKey(a.d) ? 1 : 0; });
    s = s.filter(function (r) { return (r.t || "").trim().length >= 25; });
    var top = s.slice(0, max);
    var low = s.slice(0, 12).filter(function (r) { return r.r <= 3; })[0];
    if (low && top.indexOf(low) < 0 && top.length) top[top.length - 1] = low;
    return top;
  }

  function params() {
    var p = new URLSearchParams(window.TH_CARD_QS || location.search);
    return { g: p.get("g") || "", sl: p.get("sl") || "" };
  }

  function card(r, withProduct) {
    return '<div style="margin-top:12px;padding:14px 16px;background:#F7F9FC;border:1px solid #E5EAF1;border-radius:12px;">' +
      '<div style="font-size:13px;color:#606F85;"><span style="color:#E8A33D;" aria-label="Оценка ' + esc(r.r) + ' из 5">' + stars(r.r) + "</span> &middot; " + esc(r.a) + " &middot; " + esc(r.d) + "</div>" +
      '<div style="font-size:15px;line-height:1.6;color:#1A1A1A;margin-top:6px;text-wrap:pretty;">' + esc(r.t) + "</div>" +
      (withProduct && r.p ? '<div style="font-size:12px;color:#606F85;margin-top:8px;">Купили: ' + (r.u ? '<a href="' + esc(r.u) + '" target="_blank" rel="noopener" style="color:#606F85;text-decoration:underline;">' + esc(r.p) + "</a>" : esc(r.p)) + "</div>" : "") +
      "</div>";
  }

  function build(mode, list, kind) {
    var head, note;
    if (mode === "exact") {
      head = "Отзывы покупателей этой модели на Kaspi.kz";
      note = "Публикуем как есть: автор и дата как на Kaspi.";
    } else {
      head = "Покупатели о технике этого типа в нашем магазине";
      note = "Отзывов на эту модель пока нет. Ниже отзывы на другие модели (" + (KIND_LABEL[kind] || "та же категория") + "), которые купили у нас на Kaspi.kz; под каждым указано, что именно купили. Публикуем как есть.";
    }
    var url = mode === "exact" && list[0] && list[0].u ? list[0].u : SHOP;
    var linkText = mode === "exact" ? "Все отзывы на карточке товара в Kaspi.kz" : "Все отзывы о магазине на Kaspi.kz";
    var h = '<div ' + MARK + '="' + mode + '" style="margin-top:16px;">' +
      '<div style="font-size:12px;font-weight:700;color:#606F85;letter-spacing:0.05em;text-transform:uppercase;">' + esc(head) + "</div>" +
      '<div style="font-size:13px;color:#606F85;line-height:1.55;margin-top:4px;">' + esc(note) + "</div>";
    list.forEach(function (r) { h += card(r, true); });
    h += '<a href="' + esc(url) + '" target="_blank" rel="noopener" style="display:inline-block;margin-top:14px;font-size:14px;font-weight:700;color:#0066FF;text-decoration:none;">' + esc(linkText) + " &rarr;</a></div>";
    return h;
  }

  var state = { key: "", html: "", loading: false };
  var DATA = null, ITEMS = {};

  function getJSON(u) { return fetch(u, { cache: "no-cache" }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }); }

  function compute(g, sl) {
    return Promise.all([DATA ? Promise.resolve(DATA) : getJSON(RAW + "kaspi-reviews.json"), ITEMS[g] ? Promise.resolve(ITEMS[g]) : getJSON(RAW + g + ".json")]).then(function (a) {
      DATA = a[0]; ITEMS[g] = a[1];
      if (!DATA || !ITEMS[g]) return "";
      var it = ITEMS[g].filter(function (x) { return x.sl === sl; })[0];
      if (!it) return "";
      var codes = [it.s, it.nb].map(norm).filter(function (c) { return c.length >= 5; });
      // совпадение по артикулу с границами: «BD30T» не должно цепляться за «BD30T CL2», а «55» — за «155»
      var exact = DATA.filter(function (r) {
        var p = String(r.p || "").toLowerCase();
        return [it.s, it.nb].some(function (code) {
          var toks = String(code || "").toLowerCase().split(/[^a-z0-9а-яё]+/).filter(Boolean);
          if (!toks.length || norm(code).length < 5) return false;
          var re = new RegExp("(^|[^a-z0-9а-яё])" + toks.map(function (t) { return t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }).join("[^a-z0-9а-яё]*") + "($|[^a-z0-9а-яё])");
          return re.test(p);
        });
      });
      if (exact.length) return build("exact", pick(exact, 3), "");
      var kinds = GROUP_KINDS[g];
      if (!kinds) return "";
      var same = DATA.filter(function (r) { return kinds.indexOf(kindOf(r.p)) >= 0; });
      if (same.length < 2) return "";
      return build("kind", pick(same, 3), kinds[0]);
    });
  }

  function host() {
    var hs = document.querySelectorAll("h2");
    for (var i = 0; i < hs.length; i++) {
      if ((hs[i].textContent || "").trim() === "Отзывы") {
        var wrap = hs[i].parentElement && hs[i].parentElement.parentElement && hs[i].parentElement.parentElement.parentElement;
        if (wrap && wrap.children.length) return wrap;
      }
    }
    return null;
  }

  function tick() {
    var p = params();
    if (!p.g || !p.sl) return;
    var box = host();
    if (!box) return;
    if (/ОТЗЫВЫ ПОКУПАТЕЛЕЙ НА KASPI\.KZ/.test(box.textContent || "")) return; // свои отзывы карточки уже показаны
    var key = p.g + "|" + p.sl;
    if (box.querySelector("[" + MARK + "]")) return;
    if (state.key === key && state.html !== null) {
      if (state.html) box.children[0].insertAdjacentHTML("afterend", state.html);
      return;
    }
    if (state.loading) return;
    state.loading = true;
    compute(p.g, p.sl).then(function (html) {
      state.key = key; state.html = html; state.loading = false;
      var b = host();
      if (b && html && !b.querySelector("[" + MARK + "]")) b.children[0].insertAdjacentHTML("afterend", html);
    }).catch(function () { state.loading = false; });
  }

  var t = null;
  function sched() { clearTimeout(t); t = setTimeout(tick, 250); }
  if (window.MutationObserver) new MutationObserver(sched).observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener("popstate", sched);
  sched();
  window.__thKaspiCard = { kindOf: kindOf, norm: norm, KIND_RULES: KIND_RULES, GROUP_KINDS: GROUP_KINDS, pick: pick };
})();
