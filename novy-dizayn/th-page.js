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

  function fail(why) {
    console.error("[th-page] " + why);
    box.innerHTML = '<div style="max-width:640px;margin:40px auto;padding:24px;font:16px/1.6 system-ui,sans-serif;'
      + 'color:#B25200;background:#FFF1E3;border:1px solid #F3D2AC;border-radius:12px;">'
      + 'Страница не загрузилась. Мы уже знаем об этом. '
      + 'Напишите нам: <a href="https://wa.me/77000369369" style="color:#0A4EA7;font-weight:700;">WhatsApp</a> '
      + 'или +77 000 369 369.</div>';
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

  // До вставки блока: перекраска висит в head с загрузки страницы, снимаем сразу,
  // чтобы редизайн не успел показаться красным.
  снятьПерекраску();

  fetch(RAW + encodeURIComponent(page) + ".txt", { cache: "no-cache" })
    .then(function (r) {
      if (!r.ok) throw new Error("блок " + page + ".txt отдал " + r.status);
      return r.text();
    })
    .then(function (html) {
      // Блоки бывают двух видов:
      //  · страницы редизайна — внутри <x-dc>, их собирает support.js;
      //  · обычный HTML со своими скриптами — например калькулятор вентиляции,
      //    он собирается build_vent_calc.py и шаблонизатора не использует.
      // 26.08.2026: раньше отсутствие <x-dc> считалось битым файлом, и страница
      //             /podbor-ventilyacii показывала запасной текст вместо калькулятора.
      var сДвижком = html.indexOf("<x-dc") >= 0;
      if (!html.trim()) throw new Error("блок " + page + ".txt пуст");
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
          if (стар.src) { нов.onload = нов.onerror = function () { дальше(i + 1); }; }
          нов.text = стар.text;
          стар.parentNode.replaceChild(нов, стар);
          if (!стар.src) дальше(i + 1);
        })(0);
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

      (function next(i) {
        if (i >= srcs.length) return;
        var s = document.createElement("script");
        s.src = srcs[i];
        s.onload = s.onerror = function () { next(i + 1); };
        document.head.appendChild(s);
      })(0);
    })
    .catch(function (e) { fail(String(e && e.message || e)); });
})();
