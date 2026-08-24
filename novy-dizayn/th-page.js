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
      + 'или +7 700 036 93 69.</div>';
  }

  fetch(RAW + encodeURIComponent(page) + ".txt", { cache: "no-cache" })
    .then(function (r) {
      if (!r.ok) throw new Error("блок " + page + ".txt отдал " + r.status);
      return r.text();
    })
    .then(function (html) {
      if (html.indexOf("<x-dc") < 0) throw new Error("в блоке " + page + ".txt нет <x-dc> — файл неполный");
      box.innerHTML = html;

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
