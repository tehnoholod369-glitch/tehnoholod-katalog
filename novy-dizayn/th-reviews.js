/* Отзывы покупателей с Kaspi на любой странице: <div data-th-reviews="фильтры"></div> + этот скрипт.
   Фильтры через «|», пары «ключ:значение»:
     kind:kond        только кондиционеры (kond), также: vodo, ik, kamin, pushka, konv, ochist
     topic:install    отзывы, где покупатели пишут про установку и упоминают продавца, менеджера, мастеров или ИП «ТехноХолод»
     brand:royal clima    по названию товара
     limit:6          сколько показать сразу (остальные по кнопке)
     title:Текст      заголовок блока (по умолчанию «Отзывы покупателей на Kaspi»)
     note:Текст       пояснение под заголовком (по умолчанию стандартное)
   Тот же блок на карточках линеек Royal Clima RC-AN и RC-GL: если у модели нет собственных отзывов, показываем отзывы на другие модели линейки
   с подписью, что именно купили (у моделей с собственными отзывами скрипт молчит).
   Данные: data/kaspi-reviews.json (раз в месяц). Рейтинг не усредняем, разметку Review не пишем, низкие оценки не прячем.
   Каждый отзыв ведёт на карточку товара в Kaspi.kz. */
(function () {
  "use strict";
  var RAW = "https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/main/novy-dizayn/data/kaspi-reviews.json";
  var MARK = "data-th-rv-done";

  var KIND = {
    kond: /Кондиционер\s*\+\s*Бризер|\bTAC-|\bTCL\b|Freshin|\bHisense\b|\bAS-\d|\bRAC-|\bRC-|\bRCI-|\bBSO-|Royal Fresh|кондиционер|\bEACM|\bBPAC/i,
    vodo: /водонагреватель/i,
    ik: /инфракрасн|газов.*обогреват|\bBIGH|\bBOGH|\bLQ-H|\bBIH-/i,
    kamin: /электрокамин|очаг|каминокомплект|\bEFP\//i,
    pushka: /тепловая пушка|\bBHP-|электрическая\s+BHP/i,
    konv: /конвектор|\bREC-|масляный радиатор|\bROR-/i,
    ochist: /очиститель|бризер|\bASP-/i,
    rekup: /рекуператор|\bERW-|\bFUNAI Fuji/i
  };
  var INST = /установ|монтаж|смонтир|подключил|подключен|подключили/i;
  var US = /техно ?холод|продав|магазин|менеджер|мастер|бригад/i;
  // линейки для карточек: если у модели нет своих отзывов, показываем отзывы на другие модели линейки
  var LINES = [
    { rx: /\bRC-AN\d\dHN/i, slug: /^royal-clima-rc-an/, name: "Royal Clima Attica Nero" },
    { rx: /\bRC-GL\d\dHN/i, slug: /^royal-clima-rc-gl\d/, name: "Royal Clima Gloria" }
  ];

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function dkey(d) { var m = /(\d\d)\.(\d\d)\.(\d{4})/.exec(d || ""); return m ? m[3] + m[2] + m[1] : "0"; }
  function stars(n) { n = Math.max(1, Math.min(5, +n || 5)); return "★".repeat(n) + "☆".repeat(5 - n); }
  function plural(n) {
    var a = n % 10, b = n % 100;
    return n + (a === 1 && b !== 11 ? " отзыв" : a >= 2 && a <= 4 && (b < 10 || b >= 20) ? " отзыва" : " отзывов");
  }
  function shortName(p) {
    return String(p || "").replace(/^(Кондиционер\+Бризер|Кондиционер|Водонагреватель накопительный|Газовый обогреватель (мобильный|уличный)|Инфракрасный обогреватель)\s+/i, "")
      .replace(/\s+(белый|черный|чёрный|серебристый|серый)(,.*)?$/i, "").replace(/\s*\(.*$/, "").trim();
  }

  var CSS = ".thrv{font-family:Inter,system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;color:#1A1A1A;margin:40px auto 0;max-width:1248px;padding:0 24px}" +
    ".thrv *{box-sizing:border-box}.thrv [hidden]{display:none!important}" +
    ".thrv h2{font:700 24px/32px Inter,system-ui,sans-serif;color:#0033A0;margin:0 0 6px}" +
    ".thrv-sub{font:400 14px/22px Inter,system-ui,sans-serif;color:#606F85;margin:0 0 4px;max-width:760px}" +
    ".thrv-g{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-top:16px;align-items:stretch}" +
    ".thrv-c{background:#fff;border:1px solid #E3E8EF;border-radius:12px;padding:18px 20px;display:flex;flex-direction:column;gap:10px}" +
    ".thrv-c>.thrv-a{margin-top:auto}.thgeo .thrv,.t-container .thrv{padding:0;max-width:none}" +
    ".thrv-s{color:#F59E0B;letter-spacing:2px;font-size:16px;line-height:20px}" +
    ".thrv-c p{margin:0;font:400 15px/23px Inter,system-ui,sans-serif;color:#2b3a52}" +
    ".thrv-c details summary{cursor:pointer;color:#0066FF;font:600 14px/20px Inter,system-ui,sans-serif;margin-top:6px;list-style:none}" +
    ".thrv-c details[open] summary{display:none}" +
    ".thrv-a{display:flex;justify-content:space-between;gap:12px;font:400 13px/18px Inter,system-ui,sans-serif;color:#606F85;border-top:1px solid #E3E8EF;padding-top:10px}" +
    ".thrv-a b{font:600 14px/18px Inter,system-ui,sans-serif;color:#0033A0}" +
    ".thrv-m{font:400 13px/19px Inter,system-ui,sans-serif;color:#606F85}" +
    ".thrv-m a{color:#0066FF;text-decoration:none;font-weight:600}" +
    ".thrv-m a.thrv-p{color:#0033A0;text-decoration:underline;text-underline-offset:2px}" +
    ".thrv-more{display:inline-flex;align-items:center;justify-content:center;min-height:44px;margin-top:16px;padding:0 20px;border:1.5px solid #0066FF;border-radius:8px;background:#fff;color:#0066FF;font:600 15px/1 Inter,system-ui,sans-serif;cursor:pointer}" +
    ".thrv-k{margin-top:16px;font:400 13px/20px Inter,system-ui,sans-serif;color:#606F85}.thrv-k a{color:#0066FF;font-weight:600;text-decoration:none}" +
    "@media(max-width:700px){.thrv{padding:0 16px}.thrv-g{grid-template-columns:1fr}.thrv h2{font-size:20px;line-height:28px}}";
  function injectCss() {
    if (document.getElementById("thrv-css")) return;
    var s = document.createElement("style"); s.id = "thrv-css"; s.textContent = CSS; document.head.appendChild(s);
  }

  function pickTop(all, n) {
    var s = all.slice(0, n);
    var low = all.slice(0, 15).filter(function (r) { return r.r <= 3; })[0];
    if (low && s.indexOf(low) < 0 && s.length) s[s.length - 1] = low;
    return s;
  }
  function cardHtml(r) {
    var t = String(r.t || "").trim(), body;
    if (t.length > 300) {
      var cut = t.indexOf(". ", 150); cut = cut === -1 ? 220 : cut + 1;
      body = "<p>" + esc(t.slice(0, cut)) + "</p><details><summary>Читать полностью</summary><p>" + esc(t.slice(cut).trim()) + "</p></details>";
    } else body = "<p>" + esc(t) + "</p>";
    return '<div class="thrv-c"><div class="thrv-s" aria-label="Оценка ' + esc(r.r) + ' из 5">' + stars(r.r) + "</div>" + body +
      '<div class="thrv-a"><b>' + esc(r.a) + "</b><span>" + esc(r.d) + ", Kaspi</span></div>" +
      '<div class="thrv-m">Купили: ' + (LINKS[r.p] ? '<a class="thrv-p" href="' + esc(LINKS[r.p]) + '">' + esc(shortName(r.p)) + "</a>" : esc(shortName(r.p))) + (r.u ? ' · <a href="' + esc(r.u) + '" target="_blank" rel="noopener">Читать на Kaspi →</a>' : "") + "</div></div>";
  }
  function blockHtml(all, opt) {
    var five = all.filter(function (r) { return r.r >= 5; }).length, rest = all.length - five;
    var top = pickTop(all, opt.limit), more = all.filter(function (r) { return top.indexOf(r) < 0; });
    var sub = opt.note || ("Отзывы покупателей, которые они оставили на Kaspi.kz после покупки у нас: всего " + plural(all.length) + ", " + five + " с оценкой 5" +
      (rest ? ", " + rest + " с оценкой ниже" : "") + ". Публикуем как есть, автор и дата как на Kaspi; каждый отзыв ведёт на карточку товара в Kaspi.kz.");
    var h = '<div class="thrv"><h2>' + esc(opt.title) + '</h2><p class="thrv-sub">' + esc(sub) + '</p><div class="thrv-g">' + top.map(cardHtml).join("") + "</div>";
    if (more.length) h += '<div class="thrv-g" hidden data-thrv-more>' + more.map(cardHtml).join("") + '</div><button type="button" class="thrv-more" data-thrv-btn>Показать все ' + all.length + "</button>";
    return h + '<p class="thrv-k"><a href="https://tehnoholod369.kz/otzyvy">Все отзывы о компании →</a></p></div>';
  }
  function wire(root) {
    var b = root.querySelector("[data-thrv-btn]"), m = root.querySelector("[data-thrv-more]");
    if (b && m) b.addEventListener("click", function () { m.hidden = false; b.style.display = "none"; });
  }

  var DATA = null, loading = false, LINKS = {};
  var LINKS_URL = RAW.replace("kaspi-reviews.json", "kaspi-links.json");
  function load(cb) {
    if (DATA) return cb(DATA);
    if (loading) return setTimeout(function () { load(cb); }, 300);
    loading = true;
    fetch(RAW, { cache: "no-cache" }).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      loading = false;
      if (!d) return;
      DATA = d.sort(function (a, b) { return dkey(b.d) < dkey(a.d) ? -1 : dkey(b.d) > dkey(a.d) ? 1 : 0; });
      // ссылки названий на карточки сайта (data/kaspi-links.json, gen_kaspi_links.py); нет файла — просто текст
      fetch(LINKS_URL, { cache: "no-cache" }).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; })
        .then(function (l) { LINKS = l || {}; cb(DATA); });
    }).catch(function () { loading = false; });
  }

  function parse(s) {
    var o = { limit: 6, title: "Отзывы покупателей на Kaspi" };
    String(s || "").split("|").forEach(function (p) {
      var i = p.indexOf(":"); if (i < 1) return;
      o[p.slice(0, i).trim()] = p.slice(i + 1).trim();
    });
    o.limit = parseInt(o.limit, 10) || 6;
    return o;
  }
  function filter(all, o) {
    return all.filter(function (r) {
      var p = r.p || "";
      if (o.kind && !o.kind.split(",").some(function (k) { k = k.trim(); return KIND[k] && KIND[k].test(p); })) return false;
      if (o.brand && p.toLowerCase().indexOf(o.brand.toLowerCase()) < 0) return false;
      if (o.topic === "install" && !(INST.test(r.t || "") && US.test(r.t || ""))) return false;
      return true;
    });
  }
  function pages() {
    var ms = document.querySelectorAll("[data-th-reviews]:not([" + MARK + '="2"])');
    if (!ms.length) return;
    load(function (all) {
      injectCss();
      [].forEach.call(ms, function (el) {
        if (el.getAttribute(MARK) === "2") return;
        el.setAttribute(MARK, "2"); // "1" ставит прежняя версия скрипта без ссылок: перерисовываем поверх
        var o = parse(el.getAttribute("data-th-reviews"));
        var list = filter(all, o);
        if (!list.length) return;
        el.innerHTML = blockHtml(list, o); wire(el);
        // before: CSS-селектор элемента, перед которым показать блок (выше по странице)
        var tgt = o.before ? document.querySelector(o.before) : null;
        // beforeh2: начало текста заголовка H2, перед которым показать блок
        if (!tgt && o.beforeh2) {
          var h2s = document.querySelectorAll("h2");
          for (var q = 0; q < h2s.length; q++) if ((h2s[q].textContent || "").trim().indexOf(o.beforeh2) === 0 && !el.contains(h2s[q])) { tgt = h2s[q]; break; }
        }
        if (tgt && tgt.parentNode && tgt !== el) tgt.parentNode.insertBefore(el, tgt);
      });
    });
  }

  // карточка модели из линейки
  function params() { var p = new URLSearchParams(window.TH_CARD_QS || location.search); return { g: p.get("g") || "", sl: p.get("sl") || "" }; }
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
  // у моделей со своими отзывами (точное совпадение у card-kaspi-reviews.js или свой блок карточки) молчим;
  // решаем не сразу, а через 3,5 с после появления блока отзывов, чтобы скрипт карточки успел отработать
  var lineTimer = null;
  function hasOwn(box) {
    return !!box.querySelector('[data-th-kaspi-card="exact"]') || /ОТЗЫВЫ ПОКУПАТЕЛЕЙ НА KASPI\.KZ/.test(box.textContent || "");
  }
  function place(line) {
    lineTimer = null;
    var b = host();
    if (!b || b.querySelector("[data-th-line-card]") || hasOwn(b)) return;
    load(function (all) {
      var list = all.filter(function (r) { return line.rx.test(r.p || ""); });
      if (!list.length) return;
      injectCss();
      var d = document.createElement("div"); d.setAttribute("data-th-line-card", "1");
      d.innerHTML = blockHtml(list, { limit: 6, title: "Отзывы покупателей линейки " + line.name + " на Kaspi",
        note: "У этой модели собственных отзывов пока нет. Ниже отзывы покупателей на другие модели линейки " + line.name + ": у каждого указано, что именно купили, и есть ссылка на Kaspi. Публикуем как есть." });
      b.appendChild(d); wire(d);
      var kind = b.querySelector('[data-th-kaspi-card="kind"]'); if (kind) kind.style.display = "none";
    });
  }
  function card() {
    var q = params();
    if (q.g !== "bytovye") return;
    var line = LINES.filter(function (l) { return l.slug.test(q.sl); })[0];
    if (!line) return;
    var box = host();
    if (!box) return;
    var mine = box.querySelector("[data-th-line-card]");
    if (mine) { if (hasOwn(box)) mine.remove(); return; }
    if (!lineTimer) lineTimer = setTimeout(function () { place(line); }, 3500);
  }

  var t = null;
  function tick() { pages(); card(); }
  function sched() { clearTimeout(t); t = setTimeout(tick, 250); }
  if (window.MutationObserver) new MutationObserver(sched).observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener("popstate", sched);
  window.__thReviews = { filter: filter, parse: parse, shortName: shortName };
  sched();
})();
