/* Отзывы покупателей TCL FreshIN 3.0 с Kaspi: общий блок для страниц про FreshIN и для карточек других исполнений.
   Страницы: <div data-th-freshin-reviews></div> + этот скрипт. Карточка /tovar и /tproduct: slug начинается с «tcl-tac-fr»,
   у самой «tcl-tac-fr12inv-r3» уже есть свой блок отзывов, ей скрипт молчит; остальным исполнениям показывает отзывы серии
   с подписью «собственных отзывов у этой модели пока нет».
   Данные: data/kaspi-reviews.json (обновляется раз в месяц): отзывы с названием «TAC-FR..INV/R3» или «Freshin» в названии товара.
   Рейтинг не усредняем: показываем, сколько оценок 5 и сколько ниже. Разметку Review не пишем. Каждый отзыв ведёт на Kaspi. */
(function () {
  "use strict";
  var RAW = "https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/main/novy-dizayn/data/kaspi-reviews.json";
  var MARK = "data-th-fr-done";
  var OWN = "tcl-tac-fr12inv-r3";

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function dkey(d) { var m = /(\d\d)\.(\d\d)\.(\d{4})/.exec(d || ""); return m ? m[3] + m[2] + m[1] : "0"; }
  function stars(n) { n = Math.max(1, Math.min(5, +n || 5)); return "★".repeat(n) + "☆".repeat(5 - n); }
  function model(p) {
    var m = /TAC-FR(\d\d)INV\/R3/i.exec(p || "");
    return m ? "TCL FreshIN 3.0 TAC-FR" + m[1] + "INV/R3" : "TCL FreshIN 3.0";
  }
  function plural(n) {
    var a = n % 10, b = n % 100;
    return n + (a === 1 && b !== 11 ? " отзыв" : a >= 2 && a <= 4 && (b < 10 || b >= 20) ? " отзыва" : " отзывов");
  }

  var CSS = ".thfr{font-family:Inter,system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;color:#1A1A1A;margin:40px 0 0}" +
    ".thfr *{box-sizing:border-box}" +
    ".thfr h2{font:700 24px/32px Inter,system-ui,sans-serif;color:#0033A0;margin:0 0 6px}" +
    ".thfr-sub{font:400 14px/22px Inter,system-ui,sans-serif;color:#606F85;margin:0 0 4px;max-width:760px}" +
    ".thfr-g{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-top:16px;align-items:start}" +
    ".thfr-c{background:#fff;border:1px solid #E3E8EF;border-radius:12px;padding:18px 20px;display:flex;flex-direction:column;gap:10px}" +
    ".thfr-s{color:#F59E0B;letter-spacing:2px;font-size:16px;line-height:20px}" +
    ".thfr-c p{margin:0;font:400 15px/23px Inter,system-ui,sans-serif;color:#2b3a52}" +
    ".thfr-c details summary{cursor:pointer;color:#0066FF;font:600 14px/20px Inter,system-ui,sans-serif;margin-top:6px;list-style:none}" +
    ".thfr-c details[open] summary{display:none}" +
    ".thfr-a{display:flex;justify-content:space-between;gap:12px;font:400 13px/18px Inter,system-ui,sans-serif;color:#606F85;border-top:1px solid #E3E8EF;padding-top:10px}" +
    ".thfr-a b{font:600 14px/18px Inter,system-ui,sans-serif;color:#0033A0}" +
    ".thfr-m{font:400 13px/19px Inter,system-ui,sans-serif;color:#606F85}" +
    ".thfr-m a{color:#0066FF;text-decoration:none;font-weight:600}" +
    ".thfr-more{display:inline-flex;align-items:center;justify-content:center;min-height:44px;margin-top:16px;padding:0 20px;border:1.5px solid #0066FF;border-radius:8px;background:#fff;color:#0066FF;font:600 15px/1 Inter,system-ui,sans-serif;cursor:pointer}" +
    ".thfr-k{display:flex;gap:10px;flex-wrap:wrap;margin-top:16px}" +
    ".thfr-k a{display:inline-flex;align-items:center;min-height:40px;padding:0 14px;border:1px solid #E3E8EF;border-radius:999px;color:#0033A0;text-decoration:none;font:600 13px/18px Inter,system-ui,sans-serif}" +
    "@media(max-width:700px){.thfr-g{grid-template-columns:1fr}.thfr h2{font-size:20px;line-height:28px}}";

  function injectCss() {
    if (document.getElementById("thfr-css")) return;
    var s = document.createElement("style"); s.id = "thfr-css"; s.textContent = CSS; document.head.appendChild(s);
  }

  function pickTop(all, n) {
    var s = all.slice(0, n);
    var low = all.slice(0, 12).filter(function (r) { return r.r <= 4; })[0];
    if (low && s.indexOf(low) < 0) s[s.length - 1] = low;
    return s;
  }

  function cardHtml(r) {
    var t = String(r.t || "").trim(), body;
    if (t.length > 300) {
      var cut = t.indexOf(". ", 150); cut = cut === -1 ? 220 : cut + 1;
      body = "<p>" + esc(t.slice(0, cut)) + "</p><details><summary>Читать полностью</summary><p>" + esc(t.slice(cut).trim()) + "</p></details>";
    } else body = "<p>" + esc(t) + "</p>";
    return '<div class="thfr-c"><div class="thfr-s" aria-label="Оценка ' + esc(r.r) + ' из 5">' + stars(r.r) + "</div>" + body +
      '<div class="thfr-a"><b>' + esc(r.a) + "</b><span>" + esc(r.d) + ", Kaspi</span></div>" +
      '<div class="thfr-m">Купили: ' + esc(model(r.p)) + (r.u ? ' · <a href="' + esc(r.u) + '" target="_blank" rel="noopener">Читать на Kaspi →</a>' : "") + "</div></div>";
  }

  function blockHtml(all, mode) {
    var five = all.filter(function (r) { return r.r >= 5; }).length;
    var rest = all.length - five;
    var top = pickTop(all, 6), more = all.filter(function (r) { return top.indexOf(r) < 0; });
    var byUrl = {}, order = [];
    all.forEach(function (r) { if (!r.u) return; if (!byUrl[r.u]) { byUrl[r.u] = { n: 0, p: r.p }; order.push(r.u); } byUrl[r.u].n++; });
    var sub = "Всего " + plural(all.length) + " на три модели серии FreshIN 3.0: " + five + " с оценкой 5" + (rest ? ", " + rest + " с оценкой ниже" : "") +
      ". Публикуем как есть, автор и дата как на Kaspi; каждый отзыв ведёт на карточку товара в Kaspi.kz.";
    if (mode === "other") sub += " У этой модели собственных отзывов пока нет: это отзывы на другие исполнения серии, ниже у каждого указано, что именно купили.";
    var h = '<div class="thfr"><h2>Отзывы покупателей FreshIN 3.0 на Kaspi</h2><p class="thfr-sub">' + esc(sub) + '</p><div class="thfr-g">' + top.map(cardHtml).join("") + "</div>";
    if (more.length) {
      h += '<div class="thfr-g" hidden data-thfr-more>' + more.map(cardHtml).join("") + '</div><button type="button" class="thfr-more" data-thfr-btn>Показать все ' + all.length + "</button>";
    }
    h += '<div class="thfr-k">' + order.map(function (u) {
      return '<a href="' + esc(u) + '" target="_blank" rel="noopener">' + esc(model(byUrl[u].p).replace("TCL FreshIN 3.0 ", "")) + " · " + plural(byUrl[u].n) + " на Kaspi →</a>";
    }).join("") + "</div></div>";
    return h;
  }

  function wire(root) {
    var b = root.querySelector("[data-thfr-btn]"), m = root.querySelector("[data-thfr-more]");
    if (!b || !m) return;
    b.addEventListener("click", function () { m.hidden = false; b.style.display = "none"; });
  }

  var DATA = null, loading = false;
  function load(cb) {
    if (DATA) return cb(DATA);
    if (loading) return setTimeout(function () { load(cb); }, 300);
    loading = true;
    fetch(RAW, { cache: "no-cache" }).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      loading = false;
      if (!d) return;
      DATA = d.filter(function (r) { return /TAC-FR\d\dINV\/R3|Freshin/i.test(r.p || ""); })
        .sort(function (a, b) { return dkey(b.d) < dkey(a.d) ? -1 : dkey(b.d) > dkey(a.d) ? 1 : 0; });
      cb(DATA);
    }).catch(function () { loading = false; });
  }

  // страницы: маркер в разметке
  function pages() {
    var ms = document.querySelectorAll("[data-th-freshin-reviews]:not([" + MARK + "])");
    if (!ms.length) return;
    load(function (all) {
      if (!all || !all.length) return;
      injectCss();
      [].forEach.call(ms, function (el) {
        if (el.getAttribute(MARK)) return;
        el.setAttribute(MARK, "1"); el.innerHTML = blockHtml(all, "page"); wire(el);
      });
    });
  }

  // карточка товара: исполнения FreshIN, кроме той, у которой есть свой блок
  function params() {
    var p = new URLSearchParams(window.TH_CARD_QS || location.search);
    return { g: p.get("g") || "", sl: p.get("sl") || "" };
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
  function card() {
    var q = params();
    if (q.g !== "bytovye" || !/^tcl-tac-fr/.test(q.sl) || q.sl === OWN) return;
    var box = host();
    if (!box || box.querySelector("[data-th-freshin-card]")) return;
    load(function (all) {
      var b = host();
      if (!b || !all || !all.length || b.querySelector("[data-th-freshin-card]")) return;
      injectCss();
      var d = document.createElement("div"); d.setAttribute("data-th-freshin-card", "1"); d.innerHTML = blockHtml(all, "other");
      b.appendChild(d); wire(d);
    });
  }

  var t = null;
  function tick() { pages(); card(); }
  function sched() { clearTimeout(t); t = setTimeout(tick, 250); }
  if (window.MutationObserver) new MutationObserver(sched).observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener("popstate", sched);
  window.__thFreshin = { model: model, blockHtml: blockHtml };
  sched();
})();
