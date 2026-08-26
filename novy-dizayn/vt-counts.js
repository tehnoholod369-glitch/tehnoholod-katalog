/**
 * Счётчики на страницах направлений (/ventilyaciya и следующие).
 *
 * Зачем отдельным файлом, а не строкой в блоке. th-page.js вставляет блок через
 * innerHTML, а он не выполняет скрипты. Внешние (<script src>) загрузчик
 * переподвешивает руками, ВСТРОЕННЫЕ в блоках с <x-dc> — нет. Проверено
 * 27.08.2026: страница собралась, а все 13 чисел остались пустыми.
 * Поэтому логика живёт здесь и подключается через src.
 *
 * Про порядок. Загрузчик вешает src-скрипты ДО support.js (тот идёт последним,
 * он и собирает разметку из <x-dc>). Значит, на момент запуска нужных элементов
 * в DOM ещё нет — ждём их появления, а не читаем сразу.
 *
 * Про честность. Числа берутся из data/index.json при каждом открытии. Если
 * данные не пришли — место остаётся пустым, а не показывает старое значение:
 * прежняя /ventilyaciya два месяца обещала «под заказ» по разделам, которых
 * в каталоге уже сотни, именно потому что цифры лежали в конфиге генератора.
 */
(function () {
  var ДАННЫЕ = "https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/main/novy-dizayn/data/index.json";
  var ЖДАТЬ_МС = 12000, ШАГ_МС = 200;

  function число(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " "); }

  function заполнить(d) {
    var по = {};
    (d.groups || []).forEach(function (g) { по[g.slug] = g; });

    var вент = по["ventilyaciya"];
    var св = document.getElementById("vt-svodka");
    if (св && вент) {
      св.textContent = " В каталоге " + число(вент.count) + " позиций от "
        + вент.brands + " производителей.";
    }

    var подгр = {};
    ((вент && вент.subs) || []).forEach(function (s) { подгр[s.name] = s.n; });

    document.querySelectorAll("[data-sub]").forEach(function (el) {
      var n = подгр[el.getAttribute("data-sub")];
      if (n) el.textContent = число(n);
    });
    document.querySelectorAll("[data-group]").forEach(function (el) {
      var g = по[el.getAttribute("data-group")];
      if (g) el.textContent = число(g.count);
    });
  }

  function когдаПоявятся(готово) {
    var ждём = 0;
    (function тик() {
      if (document.querySelector("[data-sub],[data-group]")) { готово(); return; }
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
