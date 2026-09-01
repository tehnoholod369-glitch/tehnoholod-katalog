/**
 * Мобильный слой витрины: шапка, полоса разделов, боковые поля.
 *
 * Зачем. На 375 px шапка Главной занимала 535 px из 812 — две трети первого
 * экрана до первой строки товара (замерено 01.09.2026). Разъезжалась она вся:
 * верхняя тёмная полоса вставала в четыре строки, потому что «Работаем с НДС»
 * отжат вправо через margin-left:auto, а телефон после него переносился на свою;
 * логотип и кнопка «Каталог» делили строку, поиск занимал третью, «Сравнение ·
 * Корзина» четвёртую; полоса разделов рассыпалась ещё на четыре строки кеглем
 * 15 px, и «B2B и госзакупки» висел один справа.
 *
 * Почему скриптом, а не в самой странице. Медиазапрос инлайновым style не задать
 * (00_КАК_ВЫКАТЫВАЕМ.md, «Технические ловушки»), а шапка написана инлайном на
 * 52 страницах разом. Лечить пришлось бы 52 файла и следить, чтобы новая
 * страница не разъехалась снова. Здесь правило одно на весь сайт.
 *
 * Как. Стили въезжают в <head> сразу, а разметку шапки скрипт помечает
 * атрибутами data-thm — без них к инлайновым стилям не прицепиться: React
 * пересобирает style в свой вид (background: rgb(7, 28, 59)), и селектор по
 * тексту атрибута ломался бы от одной перекраски. Метки ставятся заново после
 * каждой перерисовки — на «Каталоге» она случается на каждый щелчок по фильтру.
 *
 * Десктоп не трогаем: все правила шапки живут внутри @media. Единственное
 * общее правило — контакты одной строкой, оно нужно на любой ширине.
 */
(function () {
  "use strict";

  var ТЕЛЕФОН = 760;   // до этой ширины шапка перекладывается
  var УЗКИЙ = 480;     // до этой — ещё и боковые поля страницы

  // ── стили ───────────────────────────────────────────────────────────────
  // !important обязателен: конкурент у нас не другой лист стилей, а инлайновый
  // style самой разметки, и без приоритета он выигрывает всегда.
  var СТИЛИ = [
    "a[href^='mailto:']{white-space:nowrap}",
    "a[href^='tel:'],a[href*='wa.me']{overflow-wrap:normal;word-break:normal}",

    "@media (max-width:" + ТЕЛЕФОН + "px){",

    // Верхняя тёмная полоса. Сетка вместо flex-wrap: телефон встаёт в правый
    // верхний угол и держится там, остальное укладывается второй строкой.
    "[data-thm-top]{padding:7px 0 !important;font-size:12px !important}",
    "[data-thm-top]>div{display:grid !important;grid-template-columns:minmax(0,1fr) auto;",
    "align-items:center;gap:1px 10px !important;padding:0 14px !important}",
    "[data-thm-top]>div>*{margin-left:0 !important;min-width:0}",
    "[data-thm-top]>div>span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
    "[data-thm-top]>div>span:nth-of-type(1){grid-column:1;grid-row:1}",
    "[data-thm-top]>div>span:nth-of-type(2){grid-column:1;grid-row:2;font-size:11px !important;opacity:.62 !important}",
    "[data-thm-top]>div>span:nth-of-type(3){grid-column:2;grid-row:2;justify-self:end;font-size:11px !important;opacity:.62 !important}",
    "[data-thm-top] a[href^='tel:']{grid-column:2;grid-row:1;justify-self:end;white-space:nowrap;font-size:13px !important}",

    // Белая полоса: логотип и кнопки одной строкой, поиск — во всю ширину под ними.
    "[data-thm-bar]{padding:9px 14px !important;gap:8px !important}",
    "[data-thm-bar] img[src*='logo-horizontal']{height:32px !important}",
    "[data-thm-bar]>[data-thm='logo']{margin-right:auto !important;flex:none}",
    "[data-thm-bar]>[data-thm='catalog']{padding:9px 12px !important;font-size:14px !important;gap:6px !important;flex:none}",
    "[data-thm-bar]>[data-thm='cart']{padding:9px 11px !important;font-size:13px !important;gap:6px !important;flex:none}",
    "[data-thm-bar]>[data-thm='tools']{gap:14px !important;font-size:11px !important;flex:none}",
    // Кнопка WhatsApp в шапке на телефоне лишняя: ровно та же кнопка стоит
    // в нижней панели (mobile-bar.js) и видна с любого места страницы.
    "[data-thm-bar]>[data-thm='wa']{display:none !important}",
    "[data-thm-bar]>[data-thm='search']{order:9 !important;flex:1 1 240px !important;min-width:0 !important;",
    "font-size:14px !important;padding:9px 12px !important}",
    // «По всему каталогу» рядом с полем поиска — одной иконкой: подпись на
    // телефоне уводила поле в третью строку. font-size:0 гасит текст, у svg
    // размеры заданы атрибутами, поэтому иконка остаётся.
    "[data-thm-bar]>[data-thm='searchall']{order:10 !important;flex:none !important;",
    "font-size:0 !important;gap:0 !important;padding:10px 12px !important}",

    // Полоса разделов: одна прокручиваемая строка вместо четырёх столбиком.
    "[data-thm-nav]>div{flex-wrap:nowrap !important;overflow-x:auto;gap:0 18px !important;",
    "padding:9px 14px !important;font-size:14px !important;scrollbar-width:none}",
    "[data-thm-nav]>div::-webkit-scrollbar{display:none}",
    "[data-thm-nav]>div>a{white-space:nowrap;margin-left:0 !important;padding:3px 0 !important}",

    // Раскрытое меню каталога.
    "#th-megamenu>div{padding:16px 14px !important;gap:18px !important}",
    "}",

    "@media (max-width:" + УЗКИЙ + "px){",
    // Верхняя полоса на телефоне — одна строка: город и телефон. «Пн–Пт» и
    // «Работаем с НДС» здесь не помещаются (нужно 337 px при доступных 347,
    // и на 360 px строка уже режется многоточием), а обе фразы есть в первом
    // экране, в подвале и на /kontakty. На планшете обе остаются второй строкой.
    "[data-thm-top]>div>span:nth-of-type(n+2){display:none !important}",
    // Боковые поля страницы: 24 px на экране 375 съедают 13 % ширины. Правило
    // по тексту style, а не по метке: контейнеров с max-width на странице
    // десятки, обходить их скриптом на каждую перерисовку слишком дорого.
    "div[style*='max-width: 1320px'],div[style*='max-width: 1280px'],div[style*='max-width: 1240px']",
    "{padding-left:14px !important;padding-right:14px !important}",
    // Крупные карточки-плашки: 38 px поля вокруг текста на телефоне лишние.
    "div[style*='padding: 38px'],div[style*='padding: 36px'],div[style*='padding: 32px'],",
    "div[style*='padding: 30px']{padding:22px !important}",
    "}"
  ].join("");

  function стили() {
    if (document.getElementById("th-mobile-css")) return;
    var s = document.createElement("style");
    s.id = "th-mobile-css";
    s.textContent = СТИЛИ;
    (document.head || document.documentElement).appendChild(s);
  }

  // ── метки на разметке ───────────────────────────────────────────────────
  var ТЁМНЫЙ = "rgb(7, 28, 59)";        // #071C3B — фон верхней полосы
  var СВЕТЛЫЙ = "rgb(243, 247, 251)";   // #F3F7FB — фон полосы разделов

  function фон(эл) {
    try { return window.getComputedStyle(эл).backgroundColor; } catch (e) { return ""; }
  }

  /** Верхняя тёмная полоса — по телефону в ней. Перебираем ВСЕ tel: на странице,
   *  а не берём первый: на Tilda выше нашего блока может стоять чужая разметка
   *  со своим телефоном, и тогда первый tel: приведёт не туда. Признак нашей
   *  полосы — тёмный фон у деда ссылки. */
  function пометитьВерх() {
    var ссылки = document.querySelectorAll("a[href^='tel:']");
    for (var i = 0; i < ссылки.length; i++) {
      var строка = ссылки[i].parentElement;
      var полоса = строка && строка.parentElement;
      if (полоса && фон(полоса) === ТЁМНЫЙ) {
        полоса.setAttribute("data-thm-top", "1");
        return полоса;
      }
    }
    return null;
  }

  /** Белая полоса — по логотипу. Он лежит то прямо в flex-строке (Главная),
   *  то внутри ссылки на неё (все остальные), поэтому поднимаемся до строки.
   *  Строку принимаем только если в ней есть «Каталог» — по одному логотипу
   *  ошибиться легко, тот же файл стоит и в чужих шапках. */
  function найтиСтроку() {
    var лого = document.querySelectorAll("img[src*='logo-horizontal']");
    for (var i = 0; i < лого.length; i++) {
      var эл = лого[i], глубина = 0;
      while (эл.parentElement && глубина++ < 4) {
        if (window.getComputedStyle(эл.parentElement).display === "flex") break;
        эл = эл.parentElement;
      }
      var строка = эл.parentElement;
      if (!строка || window.getComputedStyle(строка).display !== "flex") continue;
      if (!/Каталог/.test(строка.textContent || "")) continue;
      return строка;
    }
    return null;
  }

  function пометитьШапку() {
    var строка = найтиСтроку();
    if (!строка) return null;
    строка.setAttribute("data-thm-bar", "1");

    // Роли кнопок. По тексту и атрибутам, а не по href: в исходнике ссылка
    // ведёт на файл соседней страницы, а на витрине — на её адрес, и селектор
    // по href работал бы через раз.
    var поле = null;
    [].forEach.call(строка.children, function (к) {
      if (к.querySelector("input[type=search]")) поле = к;
    });
    [].forEach.call(строка.children, function (к) {
      if (к.hasAttribute("data-thm")) return;
      var т = (к.textContent || "").trim();
      if (к.matches("img[src*='logo-horizontal']") || к.querySelector("img[src*='logo-horizontal']")) {
        к.setAttribute("data-thm", "logo");
      } else if (к === поле) {
        к.setAttribute("data-thm", "search");
      } else if (к.hasAttribute("data-th-search") || к.querySelector("[data-th-search]")) {
        // Поле ввода на странице есть только у «Каталога» — там кнопка поиска
        // по всему каталогу вторая, а на остальных страницах она и есть поиск.
        к.setAttribute("data-thm", поле ? "searchall" : "search");
      } else if (/Сравнение/.test(т)) {
        к.setAttribute("data-thm", "tools");
      } else if (/WhatsApp/i.test(т)) {
        к.setAttribute("data-thm", "wa");
      } else if (/Каталог/.test(т)) {
        к.setAttribute("data-thm", "catalog");
      } else if (/Корзина/.test(т)) {
        к.setAttribute("data-thm", "cart");
      }
    });
    return строка.parentElement;
  }

  /** Полоса разделов идёт сразу за белой шапкой. У «Каталога» на её месте
   *  тёмная строка-раскрывашка (.th-nav-toggle) — по фону её и отличаем. */
  function пометитьРазделы(белая) {
    var сл = белая && белая.nextElementSibling;
    if (!сл || фон(сл) !== СВЕТЛЫЙ) return;
    if (сл.querySelectorAll("a").length < 3) return;
    сл.setAttribute("data-thm-nav", "1");
  }

  function разметить() {
    try {
      пометитьВерх();
      пометитьРазделы(пометитьШапку());
    } catch (e) { /* шапки нет или она другая — страница остаётся как была */ }
  }

  стили();
  разметить();

  // Перерисовка. React держит нашу разметку между обновлениями состояния, но
  // первый монтаж происходит уже после загрузки скрипта, а на «Каталоге» шапка
  // пересобирается при смене фильтра. Наблюдатель дешевле опроса и точнее
  // таймера: реагируем на факт изменения, а не на догадку о его времени.
  var ждём = 0;
  function позже() {
    if (ждём) return;
    ждём = setTimeout(function () { ждём = 0; разметить(); }, 120);
  }
  if (window.MutationObserver) {
    new MutationObserver(позже).observe(document.documentElement, { childList: true, subtree: true });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", разметить);
  setTimeout(разметить, 400);
})();
