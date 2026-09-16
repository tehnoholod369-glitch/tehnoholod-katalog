/**
 * Загрузчик страницы редизайна для Tilda.
 *
 * Зачем. Блок страницы — 30–80 тысяч символов. 25.08.2026 выяснилось, что Tilda
 * такую вставку не переживает: на живой /novy-katalog из 65 386 символов доехали
 * последние 13 131, первые 80 % потерялись молча. Страница ушла в публикацию и в
 * карту сайта битой, без единой ошибки в консоли.
 *
 * Как. В блок T123 вставляются две строки — контейнер и этот скрипт. Он забирает
 * готовый блок с raw и вставляет в страницу сам. Вставка перестаёт зависеть от
 * размера, а код страницы дальше едет сам, как цены: правка в репозитории
 * доезжает до витрины без повторной вставки.
 *
 * Вставлять так (адрес страницы — из имени файла блока):
 *   <div data-th-page="novy-katalog"></div>
 *   <script src="https://cdn.jsdelivr.net/gh/tehnoholod369-glitch/tehnoholod-katalog@main/novy-dizayn/th-page.js"></script>
 *
 * Тонкости, на которых легко ошибиться:
 *  - блоки берём с raw, а не с jsDelivr: jsDelivr держит @main до 12 часов;
 *  - innerHTML не выполняет <script src>. Их надо переподвесить руками,
 *    и support.js — последним: он ищет <x-dc> уже готовым в DOM;
 *  - <script type="text/x-dc" data-dc-script> выполнять НЕ нужно, support.js
 *    читает его как текст. innerHTML оставляет его в DOM — этого достаточно.
 *
 * ── Первый кадр (16.09.2026, T-006 HUMAN QA 1/6, раунд 3) ─────────────────────
 * Владелец на телефоне, в новой вкладке, видел сначала серверный SEO-раздел
 * («Климатическая техника в Алматы», «Сервис и условия», подвал), а через миг — страницу;
 * однажды перед страницей мелькнуло «Страница не загрузилась».
 * Причина, по замеру холодных загрузок (EVIDENCE/T-006_R3_QA):
 *  1. Этот скрипт стоит в T123 между пустым контейнером и статическим SEO-разделом и до
 *     прихода блока ничего не рисовал. Пока блок, семь скриптов, support.js и React ехали
 *     по сети, единственным содержимым экрана были SEO-раздел и подвал; потом страница
 *     вставала НАД ними. Замер: SEO без страницы 7,8–11,7 с на каждой холодной загрузке.
 *  2. Скрипты блока грузились строго по одному — цепочка из восьми запросов подряд.
 *  3. Сторож объявлял ошибку по таймеру (12 с), даже когда загрузка просто медленная, а
 *     сбой запроса блока был окончательным, без повтора.
 * Лечение — здесь же, без задержек:
 *  · заглушка первого экрана ставится синхронно, до разбора SEO-раздела. SEO-раздел и
 *    подвал остаются в разметке как есть, просто ниже экрана: ничего не прячем, робот
 *    видит тот же HTML;
 *  · заглушка снимается в тот момент, когда в #dc-root появилось содержимое (блоки без
 *    шаблонизатора — сразу после вставки);
 *  · скрипты блока качаются параллельно и выполняются в прежнем порядке (async=false);
 *  · ошибка — только по факту: блок не получен после повторов, не загрузился support.js,
 *    не загрузился React (отклонённый промис support.js) или за 60 с ничего не отрисовалось;
 *  · если отрисовка идёт дольше 25 с, заглушка сжимается до строки «Загружаем страницу…»,
 *    и SEO-раздел под ней становится доступен — полезный текст вместо ожидания. Порог
 *    25 с, а не меньше: на «медленном 3G» с CPU×4 страница встаёт через ~19 с после
 *    старта загрузчика, и более ранний порог показывал бы SEO-слой перед нормальной страницей;
 *  · состояние — атрибут data-th-state на <html>: loading → ready | error. По нему ждёт
 *    плашка наполнения (th-plashka.js).
 * Без JS заглушки нет вовсе — SEO-раздел виден сразу.
 * Отказ support.js ловится слушателем события error: свойство onerror у всех <script>
 * переписывает tilda-fallback (независимый QA 16.09.2026, D1) — подробности у подключитьСкрипты.
 */
(function () {
  var RAW = "https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/main/novy-dizayn/blocks/";
  var me = document.currentScript;           // внутри колбэка он уже null — берём сразу
  if (!me) return;

  var box = document.querySelector("[data-th-page]");
  var page = box && box.getAttribute("data-th-page");
  if (!box || !page) {
    console.error("[th-page] нет <div data-th-page=\"…\"> — вставлять надо две строки, см. th-page.js");
    return;
  }

  var МЕДЛЕННО_МС = 25000;   // заглушка → строка «Загружаем…», SEO-раздел доступен
  var ПРЕДЕЛ_МС = 60000;     // ничего не отрисовалось — честное сообщение об ошибке
  var корень = document.documentElement;
  var заглушка = null;
  var итог = "";             // "" пока грузимся, потом "ready" или "error"
  var наблюдатель = null, таймерМедленно = 0, таймерПредел = 0;

  function состояние(s) {
    try { корень.setAttribute("data-th-state", s); } catch (e) { /* не критично */ }
  }

  // ── заглушка первого экрана ──────────────────────────────────────────────
  // Размеры повторяют каркас страниц редизайна: белая шапка, полоса разделов, первый
  // блок. У Главной первый блок — синий герой, у остальных — белая карточка.
  var СТИЛЬ_ЗАГЛУШКИ = [
    "[data-th-skeleton]{min-height:100vh;background:#F3F7FB;box-sizing:border-box}",
    ".th-sk-bar{height:99px;background:#fff;border-bottom:1px solid #DCE5F0}",
    ".th-sk-nav{height:42px;border-bottom:1px solid #DCE5F0}",
    ".th-sk-body{max-width:1320px;margin:0 auto;padding:24px;box-sizing:border-box}",
    ".th-sk-hero{height:560px;border-radius:16px;background:#fff;border:1px solid #DCE5F0}",
    "[data-th-skeleton=home] .th-sk-hero{background:linear-gradient(125deg,#071C3B,#0A4EA7 70%,#0872D3);border:0}",
    ".th-sk-note{display:none;padding:14px 16px;font:14px/1.5 Inter,'Segoe UI',Arial,sans-serif;color:#5A6675;text-align:center}",
    "[data-th-skeleton][data-slow]{min-height:0}",
    "[data-th-skeleton][data-slow] .th-sk-bar,[data-th-skeleton][data-slow] .th-sk-nav,",
    "[data-th-skeleton][data-slow] .th-sk-body{display:none}",
    "[data-th-skeleton][data-slow] .th-sk-note{display:block}",
    "@media (max-width:640px){.th-sk-bar{height:54px}.th-sk-nav{height:44px}",
    ".th-sk-body{padding:12px 14px}.th-sk-hero{height:430px}}"
  ].join("");

  function поставитьЗаглушку() {
    try {
      var с = document.createElement("style");
      с.id = "th-skeleton-css";
      с.textContent = СТИЛЬ_ЗАГЛУШКИ;
      (document.head || document.documentElement).appendChild(с);
      заглушка = document.createElement("div");
      заглушка.setAttribute("data-th-skeleton", page === "novy-glavnaya" ? "home" : "page");
      заглушка.setAttribute("aria-hidden", "true");
      заглушка.innerHTML = '<div class="th-sk-bar"></div><div class="th-sk-nav"></div>'
        + '<div class="th-sk-body"><div class="th-sk-hero"></div></div>'
        + '<div class="th-sk-note">Загружаем страницу…</div>';
      // сразу за контейнером: SEO-раздел ещё не разобран и встанет ниже заглушки
      box.parentNode.insertBefore(заглушка, box.nextSibling);
    } catch (e) { заглушка = null; }
  }

  function снятьЗаглушку() {
    if (заглушка && заглушка.parentNode) заглушка.parentNode.removeChild(заглушка);
    заглушка = null;
  }

  function закончить(как) {
    итог = как;
    состояние(как);
    снятьЗаглушку();
    if (наблюдатель) { наблюдатель.disconnect(); наблюдатель = null; }
    clearTimeout(таймерМедленно);
    clearTimeout(таймерПредел);
    window.removeEventListener("unhandledrejection", отказДвижка);
  }

  function готово() {
    if (итог) return;
    закончить("ready");
  }

  // Сырой шаблон не должен показываться никогда.
  //
  // 05.09.2026. Блок страницы редизайна — это <x-dc> с подстановками вида {{ d.season }},
  // их разворачивает support.js уже в браузере. Порядок был такой: сюда прилетает текст
  // блока, box.innerHTML кладёт его в ВИДИМЫЙ DOM, и только потом грузится support.js
  // (65 КБ плюс React) и вызывает свой hideRawTemplate(). Между этими шагами на экране
  // висят голые {{ }}. Замерено на живой Главной: окно поймано на 855-й мс после начала
  // навигации, и это на быстром канале. На медленном оно длится сколько угодно, а рендер
  // Googlebot снимает кадр когда захочет — отсюда {{ d.season }} и {{ promoPrice }}
  // в индексируемом представлении.
  //
  // Стиль ставим ДО первой вставки и своими силами, а не ждём его от support.js:
  // тот приходит по сети и может не прийти вовсе. Затрагивает 19 страниц — все,
  // у кого в блоке есть подстановки (Главная, каталог, карточка товара, корзина,
  // бригады, отзывы, сравнение, TCL FreshIN и другие).
  function спрятатьСыройШаблон() {
    var с = document.createElement("style");
    с.id = "th-hide-raw";
    с.textContent = "x-dc{display:none!important}";
    (document.head || document.documentElement).appendChild(с);
  }

  function fail(why) {
    if (итог) return;
    console.error("[th-page] " + why);
    закончить("error");
    var с = document.getElementById("th-hide-raw");
    if (с && с.parentNode) с.parentNode.removeChild(с);
    box.innerHTML = '<div style="max-width:640px;margin:40px auto;padding:24px;font:16px/1.6 system-ui,sans-serif;'
      + 'color:#B25200;background:#FFF1E3;border:1px solid #F3D2AC;border-radius:12px;">'
      + 'Страница не загрузилась. Мы уже знаем об этом. '
      + 'Напишите нам: <a href="https://wa.me/77000369369" style="color:#0A4EA7;font-weight:700;">WhatsApp</a> '
      + 'или +77 000 369 369.</div>';
  }

  // Отрисовано — когда в корне шаблонизатора появился текст.
  function отрисовано() {
    var r = box.querySelector("#dc-root");
    return !!(r && (r.textContent || "").replace(/\s+/g, "").length > 0);
  }

  function ждатьОтрисовки() {
    if (отрисовано()) { готово(); return; }
    if (window.MutationObserver) {
      наблюдатель = new MutationObserver(function () { if (!итог && отрисовано()) готово(); });
      наблюдатель.observe(box, { childList: true, subtree: true, characterData: true });
    } else {
      (function опрос() {
        if (итог) return;
        if (отрисовано()) готово(); else setTimeout(опрос, 100);
      })();
    }
  }

  // support.js при сбое загрузки React или сборки страницы отклоняет свой промис —
  // это настоящий отказ, ждать 60 с незачем.
  function отказДвижка(e) {
    var r = e && e.reason;
    var текст = String((r && r.message) || r || "");
    if (/failed to load|dc-runtime/i.test(текст)) fail("движок страницы: " + текст);
  }

  // На «/» с 14.06.2026 в head страницы Tilda висят два <style> старой Главной:
  //   <style id="th-blue2red">  #allrecords a{color:#FA0101 !important}
  //   <style> THX-BLUE-FIX      a{color:#FA0101 !important}
  // Правило перекрашивает ВСЕ ссылки страницы, и !important бьёт даже inline-цвета
  // редизайна: 27.08.2026 на живой Главной так покраснели все 122 ссылки — пункты
  // меню, заголовки направлений, чипы подкатегорий, «В каталог →», телефон в шапке
  // и текст на синей кнопке «Перейти в каталог». Утверждённый макет не менялся,
  // его перекрывали сверху. Блоки старого дизайна со страницы уже сняты, правило
  // осталось; на страницах редизайна снимаем его сами.
  //
  // Смотрим не на текст стиля, а на то, что правило делает: CSSOM отдаёт цвет и
  // !important уже разобранными. Первая версия (27.08.2026, 14:33) сверяла текст
  // регекспом — и вместо \b в файл попал невидимый байт 0x08, условие не совпадало
  // никогда. Снимался только th-blue2red по id, второй стиль оставался, страница
  // оставалась красной. Правило с классами старого дизайна (a.thhero__btn) не трогаем.
  function снятьПерекраску() {
    var КРАСНЫЙ = /^(#fa0101|rgb\(250,1,1\))$/;
    var ПРО_ССЫЛКИ = /(^|,)\s*(#allrecords\s+)?a(:link|:visited|:hover)?\s*(,|$)/;
    [].forEach.call(document.styleSheets, function (лист) {
      var правила;
      try { правила = лист.cssRules; } catch (e) { return; }   // чужой домен — не читается
      if (!правила) return;
      for (var i = правила.length - 1; i >= 0; i--) {
        var п = правила[i];
        if (!п.selectorText || !п.style) continue;
        if (п.style.getPropertyPriority("color") !== "important") continue;
        if (!КРАСНЫЙ.test(String(п.style.color).replace(/\s/g, "").toLowerCase())) continue;
        if (!ПРО_ССЫЛКИ.test(п.selectorText)) continue;
        try { лист.deleteRule(i); } catch (e) { /* лист защищён — пропускаем */ }
      }
    });
  }

  // Блок с raw. Сеть и 5xx/429 повторяем (до трёх попыток с паузой), 4xx — окончательно.
  function взятьБлок(попытка) {
    return fetch(RAW + encodeURIComponent(page) + ".txt", { cache: "no-cache" })
      .then(function (r) {
        if (r.ok) return r.text();
        var e = new Error("блок " + page + ".txt отдал " + r.status);
        e.повтор = r.status >= 500 || r.status === 429 || r.status === 408;
        throw e;
      })
      .catch(function (e) {
        if (e.повтор === false || попытка >= 3) throw e;
        return new Promise(function (ok) { setTimeout(ok, 800 * попытка); })
          .then(function () { return взятьБлок(попытка + 1); });
      });
  }

  // Скрипты блока: качаются параллельно, выполняются по порядку вставки (async=false).
  // support.js обязан быть последним — он ищет <x-dc> и собирает страницу.
  //
  // Ошибку ловим слушателем, а не свойством onerror. tilda-fallback-1.0.min.js при своей
  // загрузке и на DOMContentLoaded переписывает onerror у ВСЕХ <script> на
  // t_fallback__reloadSRC(this), а для адресов jsDelivr тот ничего не делает. Если наш
  // скрипт вставлен раньше этого прохода, обработчик пропадал, и отказ support.js
  // показывался только по пределу 60 с (независимый QA 16.09.2026, D1: ошибка на 65-й
  // секунде). Слушатель события Tilda не трогает.
  function подключитьСкрипты(srcs) {
    srcs.forEach(function (src) {
      var s = document.createElement("script");
      s.src = src;
      s.async = false;
      if (/support\.js/.test(src)) {
        s.addEventListener("error", function () { fail("не загрузился " + src); });
      }
      document.head.appendChild(s);
    });
  }

  // До вставки блока: перекраска висит в head с загрузки страницы, снимаем сразу,
  // чтобы редизайн не успел показаться красным.
  снятьПерекраску();

  состояние("loading");
  поставитьЗаглушку();
  window.addEventListener("unhandledrejection", отказДвижка);
  таймерМедленно = setTimeout(function () {
    if (!итог && заглушка) заглушка.setAttribute("data-slow", "");
  }, МЕДЛЕННО_МС);
  таймерПредел = setTimeout(function () {
    if (!итог) fail("страница не отрисовалась за " + (ПРЕДЕЛ_МС / 1000) + " с");
  }, ПРЕДЕЛ_МС);

  взятьБлок(1)
    .then(function (html) {
      // Блоки бывают двух видов:
      //  · страницы редизайна — внутри <x-dc>, их собирает support.js;
      //  · обычный HTML со своими скриптами — например калькулятор вентиляции,
      //    он собирается build_vent_calc.py и шаблонизатора не использует.
      // 26.08.2026: раньше отсутствие <x-dc> считалось битым файлом, и страница
      //             /podbor-ventilyacii показывала запасной текст вместо калькулятора.
      var сДвижком = html.indexOf("<x-dc") >= 0;
      if (!html.trim()) throw new Error("блок " + page + ".txt пуст");
      if (сДвижком) спрятатьСыройШаблон();
      box.innerHTML = html;
      снятьПерекраску();

      if (!сДвижком) {
        // Инлайн-скрипты innerHTML тоже не выполняет — пересоздаём ВСЕ по порядку.
        var все = [].slice.call(box.querySelectorAll("script"));
        (function дальше(i) {
          if (i >= все.length) return;
          var стар = все[i], нов = document.createElement("script");
          for (var k = 0; k < стар.attributes.length; k++) {
            нов.setAttribute(стар.attributes[k].name, стар.attributes[k].value);
          }
          if (стар.src) {
            // слушатели, а не onload/onerror: onerror перепишет tilda-fallback (см. подключитьСкрипты),
            // и цепочка после отказа одного скрипта встала бы
            var пошли = false;
            var следующий = function () { if (!пошли) { пошли = true; дальше(i + 1); } };
            нов.addEventListener("load", следующий);
            нов.addEventListener("error", следующий);
          }
          нов.text = стар.text;
          стар.parentNode.replaceChild(нов, стар);
          if (!стар.src) дальше(i + 1);
        })(0);
        // содержимое такого блока видно сразу после вставки
        готово();
        return;
      }

      // src-скрипты innerHTML не выполняет: вынимаем и вешаем заново
      var tags = [].slice.call(box.querySelectorAll("script[src]"));
      var srcs = tags.map(function (t) { return t.getAttribute("src"); });
      tags.forEach(function (t) { t.parentNode.removeChild(t); });

      // support.js — последним: остальные только объявляют window.CART и прочее,
      // а он сразу же ищет <x-dc> и собирает страницу
      srcs.sort(function (a, b) {
        return (/support\.js/.test(a) ? 1 : 0) - (/support\.js/.test(b) ? 1 : 0);
      });

      ждатьОтрисовки();
      подключитьСкрипты(srcs);
    })
    .catch(function (e) { fail(String(e && e.message || e)); });
})();
