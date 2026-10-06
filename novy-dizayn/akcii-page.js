/* Страница «Акции»: сверяет карточки с реестром акций и прячет просроченные.
   Работает только на странице /akcii. Любая ошибка молча оставляет страницу такой,
   какой её собрал генератор (цены и сроки из того же akcii.json на момент сборки).
   Правила: срок и цена берутся из data/akcii.json; зачёркнутая цена и процент — только у карточек,
   где генератор уже подтвердил прежнюю цену (в карточке есть data-akc-old). */
(function () {
  "use strict";
  var URL = "https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/main/novy-dizayn/data/akcii.json";
  var NBSP = " ";

  function ru(n) {
    var s = String(Math.round(+n)), out = "";
    for (var i = 0; i < s.length; i++) {
      if (i > 0 && (s.length - i) % 3 === 0) out += NBSP;
      out += s.charAt(i);
    }
    return out + NBSP + "₸";
  }

  // «19.10.2026» -> конец этого дня по времени Алматы (UTC+5), в миллисекундах UTC
  function endOfDay(s) {
    var m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(s || "");
    return m ? Date.UTC(+m[3], +m[2] - 1, +m[1], 18, 59, 59) : null;
  }

  function hide(el) { el.style.display = "none"; }

  function run(data) {
    var items = (data && data.items) || {};
    var now = Date.now();
    var cards = document.querySelectorAll("[data-akc]");
    var latest = null;

    Array.prototype.forEach.call(cards, function (el) {
      var it = items[el.getAttribute("data-akc")];
      if (!it) { hide(el); return; }
      var end = endOfDay(it.till);
      if (end !== null && now > end) { hide(el); return; }

      if (it.price) {
        var nw = el.querySelector("[data-akc-new]");
        if (nw) nw.textContent = ru(it.price);
      }
      var old = el.querySelector("[data-akc-old]");
      if (old) {
        if (it.was && it.price && +it.was > +it.price) {
          old.textContent = ru(it.was);
          var d = el.querySelector("[data-akc-dsc]");
          if (d) d.textContent = "−" + Math.round((1 - it.price / it.was) * 100) + "%";
        } else {
          old.style.display = "none";
          var d2 = el.querySelector("[data-akc-dsc]");
          if (d2) d2.style.display = "none";
        }
      }
      var til = el.querySelector("[data-akc-til]");
      if (til) {
        var m = /^(\d{2})\.(\d{2})\./.exec(it.till || "");
        if (m) til.textContent = "до " + m[1] + "." + m[2]; else hide(til);
      }
      if (end !== null && (latest === null || end > latest)) latest = end;
    });

    // секции без единой видимой карточки прячем целиком
    Array.prototype.forEach.call(document.querySelectorAll("[data-akc-sec]"), function (sec) {
      var visible = false;
      Array.prototype.forEach.call(sec.querySelectorAll("[data-akc]"), function (c) {
        if (c.style.display !== "none") visible = true;
      });
      if (!visible) {
        hide(sec);
        Array.prototype.forEach.call(document.querySelectorAll('a[href="#' + sec.id + '"]'), hide);
      }
    });

    // факт со сроком акции
    var until = document.querySelector("[data-akc-until]");
    if (until) {
      if (latest === null) {
        var box = until.parentNode;
        if (box) hide(box);
      } else {
        var dt = new Date(latest - 5 * 3600 * 1000);
        var dd = ("0" + dt.getUTCDate()).slice(-2), mm = ("0" + (dt.getUTCMonth() + 1)).slice(-2);
        until.textContent = "до " + dd + "." + mm;
      }
    }
  }

  function start() {
    if (!document.querySelector("[data-akc]")) return;
    fetch(URL, { cache: "no-cache" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { if (d) run(d); })
      .catch(function () {});
  }

  // страница вставляется в Tilda скриптом после загрузки: ждём появления карточек
  var tries = 0;
  (function wait() {
    if (document.querySelector("[data-akc]")) { start(); return; }
    if (++tries < 40) setTimeout(wait, 250);
  })();
})();
