/**
 * Модели марки в наличии — в статьях базы знаний.
 *
 * Разметка:  <div class="art-cards" data-marka-modeli data-brand="CHERBROOKE" data-group="bytovye"></div>
 * Список строится из data/<группа>.json при каждом открытии страницы: что есть на складе,
 * то и показано. Цены в карточку не выводим: цена и акция живут на странице модели,
 * а расхождение двух мест читается как ошибка. Нет данных или нет в наличии ничего —
 * блок и заголовок над ним скрываются, пустого места не остаётся.
 *
 * Отдельным файлом, а не строкой в блоке: Tilda не выполняет вставной <script> внутри
 * блока статьи, а внешний скрипт со ссылкой выполняет (так же устроен art-offers.js).
 * Меняешь договор разметки — меняй ИМЯ файла: jsDelivr держит скрипт у посетителя неделю.
 */
(function () {
  var RAW = "https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/main/novy-dizayn/data/";
  var ЖДАТЬ_МС = 12000, ШАГ_МС = 200;

  function поле(x, имя) {
    var s = x.sp || [];
    for (var i = 0; i < s.length; i++) if (s[i][0] === имя) return s[i][1];
    return "";
  }

  function btu(x) { return parseInt(поле(x, "BTU"), 10) || 0; }

  function скрыть(узел) {
    var p = узел.previousElementSibling, h = p && p.previousElementSibling;
    // заголовок и пояснение стоят прямо над списком
    if (p && p.tagName === "P") p.style.display = "none";
    if (h && /^H[23]$/.test(h.tagName)) h.style.display = "none";
    узел.style.display = "none";
  }

  function рисовать(узел, список, группа) {
    узел.innerHTML = "";
    список.forEach(function (x) {
      var a = document.createElement("a");
      a.className = "art-card";
      a.href = "/tovar?g=" + encodeURIComponent(группа) + "&sl=" + encodeURIComponent(x.sl);
      var t = document.createElement("div");
      t.className = "art-card__t";
      t.textContent = (btu(x) ? btu(x) + " BTU · " : "") + (x.inv === "inv" ? "инвертор" : "On/Off");
      var s = document.createElement("div");
      s.className = "art-card__s";
      s.textContent = (x.nb || "").split("/")[0] + (x.num ? " · до " + x.num + " м²" : "");
      var g = document.createElement("div");
      g.className = "art-card__go";
      g.textContent = "Открыть карточку →";
      a.appendChild(t);
      a.appendChild(s);
      a.appendChild(g);
      узел.appendChild(a);
    });
  }

  function занять(узел) {
    var марка = (узел.getAttribute("data-brand") || "").toLowerCase();
    var группа = узел.getAttribute("data-group") || "bytovye";
    fetch(RAW + группа + ".json", { cache: "no-cache" })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (d) {
        var список = d.filter(function (x) {
          return (x.b || "").toLowerCase() === марка && !x.acc && /налич/i.test(x.st || "") && x.sl;
        }).sort(function (p, q) {
          return btu(p) - btu(q) || (p.inv === "inv" ? -1 : 1) - (q.inv === "inv" ? -1 : 1);
        });
        if (!список.length) { скрыть(узел); return; }
        рисовать(узел, список, группа);
      })
      .catch(function () { скрыть(узел); });
  }

  // Загрузчик вешает внешние скрипты ДО support.js, который собирает разметку из x-dc:
  // на момент запуска нужных элементов ещё нет — ждём их появления.
  var ждём = 0;
  var таймер = setInterval(function () {
    ждём += ШАГ_МС;
    var узлы = document.querySelectorAll("[data-marka-modeli]");
    if (!узлы.length && ждём < ЖДАТЬ_МС) return;
    clearInterval(таймер);
    [].forEach.call(узлы, занять);
  }, ШАГ_МС);
})();
