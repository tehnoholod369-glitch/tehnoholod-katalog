/**
 * Избранное и сравнение (04.10.2026, дизайн-код 369, п. 6.5). Одно хранилище на весь сайт, работает на любой странице,
 * где есть кнопки с атрибутами:
 *   <button data-th-fav data-g="obogrevateli" data-sl="royal-clima-rec-re1000m" data-n="REC-RE1000M" data-b="ROYAL CLIMA" data-i="https://…jpg">
 *   <button data-th-cmp  …те же атрибуты…>
 * Хранилище — localStorage (при запрете хранилища работает в пределах страницы):
 *   th_fav_v1 — избранное, th_cmp_v1 — сравнение. Запись: {g, sl, n, b, i}. Цену и характеристики страницы «Избранное» и «Сравнение»
 *   берут из data/<g>.json по (g, sl): актуальные, а не те, что были на момент нажатия.
 * Правила: сравнение только внутри одного раздела (решение владельца 03.10.2026), не больше 4 моделей.
 * События: «th-fav» на window при любом изменении; счётчики — элементы [data-th-fav-count] и [data-th-cmp-count].
 */
(function () {
  if (window.THFav) return;
  var KEY_FAV = "th_fav_v1", KEY_CMP = "th_cmp_v1", МАКС_СРАВНЕНИЕ = 4;
  var память = {}; // запасной вариант, если localStorage запрещён

  function читать(ключ) {
    try {
      var л = JSON.parse(window.localStorage.getItem(ключ) || "null");
      if (Array.isArray(л)) return л;
    } catch (e) {}
    return Array.isArray(память[ключ]) ? память[ключ] : [];
  }
  function писать(ключ, список) {
    память[ключ] = список;
    try { window.localStorage.setItem(ключ, JSON.stringify(список)); } catch (e) {}
  }
  function ключЭлемента(x) { return x.g + "/" + x.sl; }
  function есть(список, x) { return список.some(function (y) { return ключЭлемента(y) === ключЭлемента(x); }); }
  function из(кнопка) {
    var d = кнопка.dataset;
    if (!d.g || !d.sl) return null;
    return { g: d.g, sl: d.sl, n: d.n || "", b: d.b || "", i: d.i || "" };
  }

  function сообщить(текст) {
    var т = document.getElementById("th-fav-toast");
    if (!т) {
      т = document.createElement("div");
      т.id = "th-fav-toast";
      т.setAttribute("role", "status");
      т.style.cssText = "position:fixed;left:50%;bottom:78px;transform:translateX(-50%);z-index:80;max-width:min(92vw,420px);padding:12px 16px;border-radius:10px;background:#0033A0;color:#fff;font:600 14px/20px Inter,TildaSans,Arial,sans-serif;box-shadow:0 8px 24px rgba(0,51,160,.25);display:none";
      document.body.appendChild(т);
    }
    т.textContent = текст;
    т.style.display = "block";
    clearTimeout(т._t);
    т._t = setTimeout(function () { т.style.display = "none"; }, 3600);
  }

  function обновить() {
    var f = читать(KEY_FAV), c = читать(KEY_CMP);
    [].forEach.call(document.querySelectorAll("[data-th-fav-count]"), function (б) { var т = f.length > 99 ? "99+" : String(f.length); if (б.textContent !== т) б.textContent = т; б.classList.toggle("th-on", f.length > 0); б.style.display = f.length ? "" : "none"; });
    [].forEach.call(document.querySelectorAll("[data-th-cmp-count]"), function (б) { var т = c.length > 99 ? "99+" : String(c.length); if (б.textContent !== т) б.textContent = т; б.classList.toggle("th-on", c.length > 0); б.style.display = c.length ? "" : "none"; });
    [].forEach.call(document.querySelectorAll("[data-th-fav]"), function (к) {
      var x = из(к); var on = !!x && есть(f, x);
      к.classList.toggle("th-on", on); к.setAttribute("aria-pressed", on ? "true" : "false");
      к.setAttribute("aria-label", on ? "Убрать из избранного" : "В избранное"); к.title = on ? "Убрать из избранного" : "В избранное";
    });
    [].forEach.call(document.querySelectorAll("[data-th-cmp]"), function (к) {
      var x = из(к); var on = !!x && есть(c, x);
      к.classList.toggle("th-on", on); к.setAttribute("aria-pressed", on ? "true" : "false");
      к.setAttribute("aria-label", on ? "Убрать из сравнения" : "Сравнить"); к.title = on ? "Убрать из сравнения" : "Сравнить";
    });
  }

  function переключитьИзбранное(x) {
    var с = читать(KEY_FAV);
    if (есть(с, x)) с = с.filter(function (y) { return ключЭлемента(y) !== ключЭлемента(x); }); else с.push(x);
    писать(KEY_FAV, с); изменилось();
  }
  function переключитьСравнение(x) {
    var с = читать(KEY_CMP);
    if (есть(с, x)) { с = с.filter(function (y) { return ключЭлемента(y) !== ключЭлемента(x); }); }
    else {
      if (с.length && с[0].g !== x.g) { сообщить("Сравнивать можно модели одного раздела. Сначала очистите текущее сравнение."); return; }
      if (с.length >= МАКС_СРАВНЕНИЕ) { сообщить("В сравнении не больше " + МАКС_СРАВНЕНИЕ + " моделей."); return; }
      с.push(x);
    }
    писать(KEY_CMP, с); изменилось();
  }
  function изменилось() {
    обновить();
    try { window.dispatchEvent(new CustomEvent("th-fav")); } catch (e) {}
  }

  document.addEventListener("click", function (e) {
    var к = e.target && e.target.closest ? e.target.closest("[data-th-fav],[data-th-cmp]") : null;
    if (!к) return;
    var x = из(к);
    if (!x) return;
    e.preventDefault(); e.stopPropagation();
    if (к.hasAttribute("data-th-fav")) переключитьИзбранное(x); else переключитьСравнение(x);
  }, true);

  window.addEventListener("storage", обновить);
  window.addEventListener("th-cart", function () {});
  window.THFav = {
    избранное: function () { return читать(KEY_FAV); },
    сравнение: function () { return читать(KEY_CMP); },
    убратьИзбранное: function (x) { писать(KEY_FAV, читать(KEY_FAV).filter(function (y) { return ключЭлемента(y) !== ключЭлемента(x); })); изменилось(); },
    убратьСравнение: function (x) { писать(KEY_CMP, читать(KEY_CMP).filter(function (y) { return ключЭлемента(y) !== ключЭлемента(x); })); изменилось(); },
    очиститьСравнение: function () { писать(KEY_CMP, []); изменилось(); },
    обновить: обновить
  };

  // Стили кнопок на карточках: два значка в правом верхнем углу фото (как в утверждённой карточке каталога).
  var ст = document.createElement("style");
  ст.textContent = ".th-act{position:absolute;top:10px;right:10px;z-index:3;display:flex;gap:6px}"
    + ".th-act button{width:36px;height:36px;padding:0;border:1px solid #DCE5F0;border-radius:50%;background:#fff;color:#0033A0;cursor:pointer;display:flex;align-items:center;justify-content:center}"
    + ".th-act button svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}"
    + ".th-act button:hover{border-color:#0066FF;color:#0066FF}"
    + ".th-act button.th-on{background:#0066FF;border-color:#0066FF;color:#E81C1C}"
    + ".th-act button.th-on svg{stroke-width:2.6;filter:drop-shadow(0 0 1px #fff) drop-shadow(0 0 1px #fff)}"
    + ".th-act [data-th-fav].th-on svg{fill:#E81C1C}"
    + ".th-bd[data-th-fav-count],.th-bd[data-th-cmp-count]{background:#0066FF}";
  document.head.appendChild(ст);

  // Карточки приходят позже (скрипты страниц, рендерер): обновляем состояние кнопок по мере появления.
  var таймер = null;
  if (window.MutationObserver) {
    new MutationObserver(function () { clearTimeout(таймер); таймер = setTimeout(обновить, 120); })
      .observe(document.documentElement, { childList: true, subtree: true });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", обновить); else обновить();
  // T-006, 07.10.2026: приём списков из подборщика. Подборщик стоит на другом адресе (podbor.tehnoholod369.kz), хранилище браузера у него своё,
  // поэтому он передаёт избранное и сравнение в ссылке: ?th_import=<base64url от JSON {f:[...], c:[...]}>. Здесь они сливаются с сохранённым, параметр убирается из адреса.
  (function () {
    try {
      var m = location.search.match(/[?&]th_import=([^&]+)/);
      if (!m) return;
      var d = JSON.parse(decodeURIComponent(escape(atob(m[1].replace(/-/g, "+").replace(/_/g, "/")))));
      var чист = function (t, n) { return String(t || "").replace(/[<>"'`]/g, "").slice(0, n); };
      var ок = function (x) { return x && typeof x.g === "string" && typeof x.sl === "string" && /^[a-z0-9-]{1,40}$/i.test(x.g) && /^[a-z0-9._-]{1,120}$/i.test(x.sl); };
      var копия = function (x) { return { g: x.g, sl: x.sl, n: чист(x.n, 200), b: чист(x.b, 80), i: /^https?:\/\//i.test(x.i || "") ? чист(x.i, 300) : "" }; };
      var f = читать(KEY_FAV), c = читать(KEY_CMP);
      (d.f || []).filter(ок).slice(0, 100).forEach(function (x) { if (!есть(f, x)) f.push(копия(x)); });
      (d.c || []).filter(ок).slice(0, МАКС_СРАВНЕНИЕ).forEach(function (x) { if (!есть(c, x) && c.length < МАКС_СРАВНЕНИЕ && (!c.length || c[0].g === x.g)) c.push(копия(x)); });
      писать(KEY_FAV, f); писать(KEY_CMP, c);
      var q = location.search.replace(/([?&])th_import=[^&]*(&|$)/, function (a, p, e) { return e ? p : ""; }).replace(/[?&]$/, "");
      history.replaceState(null, "", location.pathname + q + location.hash);
      изменилось();
    } catch (e) {}
  })();
})();
