/**
 * Счётчики на страницах направлений (/ventilyaciya, /otoplenie, /vodonagrevateli).
 * Имя историческое — «vt» от первой такой страницы; работает для всех направлений.
 *
 * Зачем отдельным файлом, а не строкой в блоке. th-page.js вставляет блок через
 * innerHTML, а он не выполняет скрипты. Внешние (со ссылкой) загрузчик
 * переподвешивает руками, написанные прямо в блоке с x-dc — НЕТ. Проверено
 * 27.08.2026: страница собралась, а все 13 чисел остались пустыми.
 *
 * Про порядок. Загрузчик вешает такие скрипты ДО support.js (тот идёт последним,
 * он и собирает разметку из x-dc). Значит, на момент запуска нужных элементов
 * в DOM ещё нет — ждём их появления, а не читаем сразу.
 *
 * Про честность. Числа берутся из data/index.json при каждом открытии. Не пришли
 * данные — место остаётся пустым, а не показывает старое значение. Прежние
 * страницы направлений именно так и врали: цифры лежали в конфиге gen_dir_blocks.py
 * от 30.07.2026 и там же устарели, а витрина обещала «под заказ» по разделам,
 * которых в каталоге уже сотни.
 *
 * Разметка — одно правило на все направления:
 *   <span data-group="teplovye-pushki"></span>          — сколько в группе
 *   <span data-sub="radiatory|Секционные"></span>       — сколько в подкатегории
 * Слева от «|» — slug группы, справа — имя подкатегории как в index.json.
 * ⚠️ Число обязано совпадать с тем, что покажет каталог по ссылке этой же плитки:
 *    одна плитка — один фильтр. Иначе страница обещает то, чего не выполняет.
 */
(function () {
  var ДАННЫЕ = "https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/main/novy-dizayn/data/index.json";
  var ЖДАТЬ_МС = 12000, ШАГ_МС = 200;

  function склон(n, один, два, много) {
    var a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) return много;
    if (b > 1 && b < 5) return два;
    if (b === 1) return один;
    return много;
  }

  function число(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " "); }

  function заполнить(d) {
    var по = {};
    (d.groups || []).forEach(function (g) { по[g.slug] = g; });

    // сводка направления: <span id="vt-svodka" data-svodka="ventilyaciya">
    var св = document.getElementById("vt-svodka");
    if (св) {
      var g = по[св.getAttribute("data-svodka") || ""];
      if (g) {
        св.textContent = " В каталоге " + число(g.count) + " "
          + склон(g.count, "позиция", "позиции", "позиций") + " от "
          + число(g.brands) + " "
          + склон(g.brands, "производителя", "производителей", "производителей") + ".";
      }
    }

    document.querySelectorAll("[data-group]").forEach(function (el) {
      var g = по[el.getAttribute("data-group")];
      if (g) el.textContent = число(g.count);
    });

    document.querySelectorAll("[data-sub]").forEach(function (el) {
      var части = (el.getAttribute("data-sub") || "").split("|");
      if (части.length < 2) return;               // без группы считать нечего
      var g = по[части[0]];
      if (!g) return;
      var имя = части.slice(1).join("|");
      (g.subs || []).forEach(function (s) {
        if (s.name === имя) el.textContent = число(s.n);
      });
    });
  }

  function когдаПоявятся(готово) {
    var ждём = 0;
    (function тик() {
      if (document.querySelector("[data-sub],[data-group],#vt-svodka")) { готово(); return; }
      ждём += ШАГ_МС;
      if (ждём < ЖДАТЬ_МС) setTimeout(тик, ШАГ_МС);
      // не дождались — молчим: пустое место честнее выдуманного числа
    })();
  }

  fetch(ДАННЫЕ, { cache: "no-cache" })
    .then(function (r) { return r.json(); })
    .then(function (d) { когдаПоявятся(function () { заполнить(d); }); })
    .catch(function () { /* данных нет — числа остаются пустыми */ });
})();
