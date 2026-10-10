/**
 * Нижняя панель для телефона (04.10.2026, дизайн-код 369, п. 6.6): Главная · Каталог · Корзина · Позвонить · WhatsApp.
 * «Избранное» добавить, когда появится функция (сейчас её в коде нет). Адреса публичные, как в шапке th-shapka.js.
 * @media в инлайн-стилях DC недоступен, поэтому ширина проверяется в рантайме
 * и панель монтируется скриптом — одинаково на всех страницах сайта.
 */
(function () {
  // Страница может подключить панель дважды (шапка и старый тег mobile-bar.js): второй запуск
  // навесил бы второй обработчик клика, и меню открывалось бы и сразу закрывалось.
  if (window.__thBar369) return;
  window.__thBar369 = 1;
  var ID = "th-mobile-bar";
  var BREAK = 760; // как у шапки: на этой ширине полоса меню сворачивается в «Меню»

  function svg(inner) {
    return '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="display:block">' + inner + '</svg>';
  }

  var СТИЛЬ_ССЫЛКИ = "position:relative;display:flex;flex-direction:column;align-items:center;gap:3px;padding:8px 2px 9px;color:#0033A0;font:600 11px/14px Inter,TildaSans,Arial,sans-serif;text-decoration:none";

  function build() {
    var bar = document.createElement("div");
    bar.id = ID;
    bar.style.cssText = "position:fixed;left:0;right:0;bottom:0;z-index:40;background:#fff;border-top:1px solid #DCE5F0;box-shadow:0 -4px 16px rgba(0,51,160,0.08);display:grid;grid-template-columns:repeat(5,1fr)";
    bar.innerHTML =
      '<a href="/" style="' + СТИЛЬ_ССЫЛКИ + '">' + svg('<path d="M3 11l9-7 9 7"/><path d="M5 10v10h5v-6h4v6h5V10"/>') + 'Главная</a>'
      + '<a href="/katalog" data-th-open-menu style="' + СТИЛЬ_ССЫЛКИ + '">' + svg('<path d="M3.5 6.5h17M3.5 12h17M3.5 17.5h17"/>') + 'Каталог</a>'
      + '<a href="/korzina" style="' + СТИЛЬ_ССЫЛКИ + '">' + svg('<path d="M3 4h2l2.4 11h10.2L20 8H6.2"/><circle cx="9" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/>') + 'Корзина'
        + '<i data-th-cart-count style="display:none;position:absolute;top:3px;left:calc(50% + 6px);min-width:16px;height:16px;padding:0 4px;border-radius:8px;background:#E81C1C;color:#fff;font:700 10px/16px Inter,Arial,sans-serif;font-style:normal;text-align:center;box-sizing:border-box"></i></a>'
      + '<a href="tel:+77000369369" style="' + СТИЛЬ_ССЫЛКИ + '">' + svg('<path d="M6.5 3.5h3l1.5 4-2 1.4a12 12 0 0 0 6.1 6.1l1.4-2 4 1.5v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4.5 5.7 2 2 0 0 1 6.5 3.5z"/>') + 'Позвонить</a>'
      + '<a href="https://wa.me/77000369369" style="' + СТИЛЬ_ССЫЛКИ + '">' + svg('<path d="M12 2.5a9.4 9.4 0 0 0-8 14.3L2.5 21.5l4.8-1.4A9.4 9.4 0 1 0 12 2.5z"/><path d="M8.8 8.2c.3 2.8 2.7 5.2 5.5 5.5l1.2-1.3-1.9-1-0.9.7a4 4 0 0 1-1.9-1.9l.7-.9-1-1.9z"/>') + 'WhatsApp</a>';
    return bar;
  }

  // Счётчик корзины читает ту же запись, что cart.js и шапка: localStorage «th_cart_v1».
  function счётчик() {
    var bar = document.getElementById(ID);
    if (!bar) return;
    var n = 0;
    try {
      var л = JSON.parse(window.localStorage.getItem("th_cart_v1") || "[]");
      if (Array.isArray(л)) n = л.reduce(function (с, x) { return с + (x.q || 1); }, 0);
    } catch (e) {}
    var б = bar.querySelector("[data-th-cart-count]");
    if (б) { б.textContent = n > 99 ? "99+" : String(n); б.style.display = n > 0 ? "block" : "none"; }
  }

  // Один каталог на телефоне (10.10.2026, решение владельца): «Каталог» внизу открывает то же меню,
  // что значок вверху слева. Раньше было три входа: значок, эта кнопка (страница /katalog) и синяя
  // кнопка «Каталог товаров» внутри меню, которая раскрывала третий, неоформленный список разделов.
  // Над значком подпись «Каталог», синюю кнопку и её список на телефоне прячем: разделы уже в меню.
  // Нет меню на странице — кнопка остаётся обычной ссылкой на /katalog.
  document.addEventListener("click", function (e) {
    // по адресу, а не по метке: на телефоне со старым кэшем панель может нарисовать прежняя версия скрипта, без метки
    var a = e.target && e.target.closest ? e.target.closest('#th-mobile-bar a[href="/katalog"]') : null;
    var m = document.querySelector(".th-mn");
    if (!a || !m || e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
    e.preventDefault();
    if (m.classList.contains("th-open")) { m.classList.remove("th-open"); return; }
    m.classList.add("th-open");
    window.scrollTo(0, 0);
  });

  function подписьМеню(need) {
    var st = document.getElementById("th-menu-cap");
    if (!need) { if (st) st.parentNode.removeChild(st); return; }
    if (!st) {
      st = document.createElement("style");
      st.id = "th-menu-cap";
      st.textContent = "[data-th-burger]{flex-direction:column!important;gap:2px!important}"
        // подпись рисуем стилем, а не меняем текст: шапку страница перерисовывает позже, и текст возвращался в «Меню»
        + "[data-th-burger] span{display:block!important;font-size:0!important;line-height:0!important}"
        + "[data-th-burger] span::after{content:'Каталог';font-size:10px;line-height:12px;font-weight:600}"
        + "[data-th-cat],#th-panel{display:none!important}";
      document.head.appendChild(st);
    }
    [].forEach.call(document.querySelectorAll("[data-th-burger]"), function (b) {
      if (b.getAttribute("aria-label") !== "Каталог") b.setAttribute("aria-label", "Каталог");
    });
  }

  function sync() {
    var need = window.innerWidth <= BREAK;
    подписьМеню(need);
    var bar = document.getElementById(ID);
    var подвал = !!document.querySelector("[data-th-podval]");
    if (need && !bar) {
      document.body.appendChild(build());
    } else if (!need && bar) {
      bar.parentNode.removeChild(bar);
    }
    // Место под панель: у страницы с общим подвалом его держит подвал (padding-bottom 86px), иначе под подвалом была бы белая полоса.
    document.body.style.paddingBottom = (need && !подвал) ? "64px" : "";
    счётчик();
  }

  window.addEventListener("resize", sync);
  window.addEventListener("storage", счётчик);
  window.addEventListener("th-cart", счётчик);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", sync);
  else sync();
  setTimeout(sync, 300); setTimeout(sync, 1500); setTimeout(sync, 4000); // подвал рисует th-shapka.js позже: поле у body снимаем, когда он появился
})();
