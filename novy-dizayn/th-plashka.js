/**
 * Всплывающая плашка «сайт наполняется и работает в тестовом режиме».
 *
 * Зачем. Такая строчка стояла только в первом экране Главной, а заходят чаще
 * не туда: 95 % входов идут из Google-фида сразу в карточку товара. Человек
 * видит раздел без фото или группу из трёх позиций и считает, что так и есть,
 * — вместо того чтобы спросить. Плашка говорит это на любой странице и сразу
 * даёт куда написать.
 *
 * Текст один в один с Главной: разное объяснение одного и того же на соседних
 * страницах читается как небрежность.
 *
 * Поведение. Показывается через 1,2 с после загрузки — чтобы не спорить с
 * первым экраном; закрывается крестиком или «Понятно» и после этого не
 * возвращается неделю. На телефоне встаёт НАД нижней панелью (mobile-bar.js),
 * иначе накрыла бы «Позвонить · WhatsApp · Каталог».
 *
 * Подключается и из страниц редизайна, и из th-shapka.js для старых страниц
 * и карточек /tproduct/. Повторный запуск ничего не делает — метка по id.
 */
(function () {
  "use strict";

  // Скрипт приезжает дважды: из тела страницы редизайна и из th-shapka.js,
  // который вставлен в HEAD Tilda ради старых страниц и карточек /tproduct/.
  // Проверки по id мало: оба экземпляра ждут одну и ту же секунду и могли бы
  // успеть создать по плашке.
  if (window.__th_plashka) return;
  window.__th_plashka = 1;

  var ID = "th-plashka";
  var КЛЮЧ = "th-plashka-закрыта";
  var МОЛЧАНИЕ = 7 * 24 * 60 * 60 * 1000;   // неделя после «Понятно»
  var ЗАДЕРЖКА = 1200;
  var ТЕЛЕФОН = "77000369369";

  var ЗАГОЛОВОК = "Сайт в режиме наполнения и тестирования";
  var ТЕКСТ = "Сайт работает в тестовом режиме и продолжает наполняться. " +
    "Не нашли нужное или заметили неточность — напишите, поможем и поправим.";

  /** Приватный режим запрещает localStorage — тогда плашка просто показывается
   *  каждый раз, а не роняет страницу. */
  function закрыта() {
    try {
      var t = window.localStorage.getItem(КЛЮЧ);
      return !!t && (Date.now() - Number(t)) < МОЛЧАНИЕ;
    } catch (e) { return false; }
  }

  function запомнить() {
    try { window.localStorage.setItem(КЛЮЧ, String(Date.now())); } catch (e) { /* и ладно */ }
  }

  function стили() {
    if (document.getElementById(ID + "-css")) return;
    var s = document.createElement("style");
    s.id = ID + "-css";
    s.textContent = [
      "#" + ID + "{position:fixed;right:16px;bottom:16px;left:auto;z-index:45;",
      "width:min(370px,calc(100vw - 32px));box-sizing:border-box;",
      "background:#fff;border:1px solid #DCE5F0;border-left:4px solid #0872D3;border-radius:14px;",
      "box-shadow:0 14px 34px rgba(7,28,59,0.18);padding:14px 16px;",
      "font:14px/1.5 'Inter',TildaSans,'Segoe UI',Arial,sans-serif;color:#18212F;",
      "opacity:0;transform:translateY(14px);transition:opacity .26s ease-out,transform .26s ease-out}",
      "#" + ID + "[data-shown]{opacity:1;transform:none}",
      "#" + ID + " b{display:block;font-size:15px;font-weight:700;color:#0A4EA7;padding-right:22px}",
      "#" + ID + " p{margin:6px 0 0;color:#2C3846}",
      "#" + ID + " .th-pl-row{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}",
      "#" + ID + " .th-pl-wa{background:#E7F7EF;border:1px solid #BFE6D4;color:#0B6B45;",
      "border-radius:8px;padding:9px 14px;font-weight:700;text-decoration:none}",
      "#" + ID + " .th-pl-ok{background:#F3F7FB;border:1px solid #DCE5F0;color:#5A6675;",
      "border-radius:8px;padding:9px 14px;font:inherit;font-weight:600;cursor:pointer}",
      "#" + ID + " .th-pl-x{position:absolute;top:8px;right:8px;width:28px;height:28px;",
      "border:0;background:transparent;color:#8593A6;font-size:20px;line-height:1;cursor:pointer;border-radius:8px}",
      "#" + ID + " .th-pl-x:hover{background:#F3F7FB;color:#2C3846}",
      // Телефон: во всю ширину и над нижней панелью — её высота 64 px (mobile-bar.js).
      "@media (max-width:640px){#" + ID + "{left:10px;right:10px;bottom:74px;width:auto;padding:13px 14px}",
      "#" + ID + " b{font-size:14px}#" + ID + "{font-size:13px}}",
      "@media (prefers-reduced-motion:reduce){#" + ID + "{transition:none}}"
    ].join("");
    (document.head || document.documentElement).appendChild(s);
  }

  function показать() {
    if (document.getElementById(ID) || закрыта()) return;
    стили();

    var к = document.createElement("div");
    к.id = ID;
    к.setAttribute("role", "status");
    к.innerHTML =
      '<button type="button" class="th-pl-x" aria-label="Закрыть">&times;</button>'
      + "<b>" + ЗАГОЛОВОК + "</b>"
      + "<p>" + ТЕКСТ + "</p>"
      + '<div class="th-pl-row">'
      + '<a class="th-pl-wa" href="https://wa.me/' + ТЕЛЕФОН + '">Написать в WhatsApp</a>'
      + '<button type="button" class="th-pl-ok">Понятно</button>'
      + "</div>";
    document.body.appendChild(к);

    // Кадр на применение начальных стилей — иначе перехода не видно и плашка
    // просто возникает.
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { к.setAttribute("data-shown", "1"); });
    });

    function убрать() {
      запомнить();
      к.removeAttribute("data-shown");
      setTimeout(function () { if (к.parentNode) к.parentNode.removeChild(к); }, 280);
    }
    к.querySelector(".th-pl-x").addEventListener("click", убрать);
    к.querySelector(".th-pl-ok").addEventListener("click", убрать);
    // Ушёл писать в WhatsApp — вопрос закрыт, второй раз показывать незачем.
    к.querySelector(".th-pl-wa").addEventListener("click", запомнить);
  }

  function пуск() { setTimeout(показать, ЗАДЕРЖКА); }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", пуск);
  else пуск();
})();
