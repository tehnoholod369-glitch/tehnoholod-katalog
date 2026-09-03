/**
 * Цены и рекомендация в статьях базы знаний.
 *
 * Зачем. Статьи были чисто просветительские: объясняют и индексируются, но не
 * продают — ни цены, ни ссылки в группу, ни модели (решение владельца 30.08.2026:
 * ввести за правило). Число в статье руками писать нельзя: прайсы меняются,
 * и вписанная цена устаревает молча — ровно так статьи Tilda два месяца
 * показывали TCL FreshIN на 17 % дороже мастера.
 *
 * Поэтому цена берётся из data/<группа>.json при каждом открытии страницы —
 * из того же файла, который пересобирает ОБНОВИТЬ-ВСЁ.py из мастер-таблицы.
 * Не пришли данные — место остаётся пустым, а не показывает вчерашнее значение.
 *
 * Отдельным файлом, а не строкой в блоке: th-page.js вставляет блок через
 * innerHTML и оживляет только скрипты со ссылкой. Причина та же, что у
 * dir-counts.js — проверено 27.08.2026 на живой /ventilyaciya.
 *
 * ⚠️ Ломаешь договор разметки — меняй ИМЯ файла. jsDelivr держит скрипт
 * у посетителя долго, и старый кэш встретит новую разметку (грабли dir-counts).
 *
 * Разметка:
 *   <span data-price-from="bytovye"></span>     — минимальная цена по группе
 *   <span data-price-from="ventilyaciya|Приточные установки"></span>
 *                                               — то же, но по подкатегории:
 *      вторая часть пишется той же строкой, что в ссылке плитки ?g=…&sub=…
 *   Аксессуары в «от» не идут (поле acc): минимум по всей группе — это цена
 *      запчасти, а не товара. Замер 31.08.2026: мультисплит «от 12 500 ₸» —
 *      Wi-Fi модуль MDV, вентиляция «от 4 317 ₸» — ручной привод SHUFT.
 *   <span data-price-date></span>               — дата пересборки данных
 *   <a data-pick="bytovye" href="...">          — карточка рекомендованной модели,
 *      <img data-pick-img>                        href подставляется сам
 *      <span data-pick-brand>
 *      <span data-pick-name>
 *      <span data-pick-price>
 *   <a data-pick="bytovye" data-pick-only="TCL|FreshIN 3.0">
 *      — сузить рекомендацию до марки и модели (обе части необязательны)
 *
 * Две метки, два разных утверждения — не путать:
 *   «Хит продаж» — это часто покупают. Назначает ВЛАДЕЛЕЦ в PIM/ХИТЫ_ПРОДАЖ.csv,
 *      скрипт хиты.py проверяет и кладёт в data/hits.json (решение владельца
 *      30.08.2026). Своей статистики продаж пока нет: владелец знает продажи
 *      по заказам и является источником сам. Появится оцифрованная статистика —
 *      источником станет она, а реестр останется способом переопределить руками.
 *   «Наш выбор» — это МЫ рекомендуем. Считается по данным или по picks.json,
 *      правило то же, что на странице выдачи.
 * Хит есть в группе — показываем его и метку «Хит продаж»; нет — «Наш выбор».
 */
(function () {
  var RAW = "https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/main/novy-dizayn/data/";
  var ЖДАТЬ_МС = 12000, ШАГ_МС = 200;

  function число(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " "); }

  function взять(имя) {
    return fetch(RAW + имя, { cache: "no-cache" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  }

  // Правило «Наш выбор» — то же, что на странице выдачи /katalog (там оно называется
  // isPick и recScore). Второго правила для одной сущности не заводим: если в picks.json
  // владелец вписал артикулы, выбираем из них; список пуст — считаем по данным.
  function лучший(items, picks) {
    var есть = function (it) { return !!(it.s && it.i && it.p && /налич/i.test(it.st || "")); };
    var свой = function (it) { return picks && picks.length ? (it.s && picks.indexOf(it.s) >= 0) : есть(it); };
    var балл = function (it) {
      var n = 0;
      if (свой(it)) n += 8;
      if (/налич/i.test(it.st || "")) n += 4;
      if (it.i) n += 2;
      if (it.p) n += 1;
      return n;
    };
    var лучш = null, лучшБалл = -1;
    items.forEach(function (it) {
      var b = балл(it);
      // при равном балле берём дешевле: статья ведёт от объяснения к покупке,
      // и первая названная цена не должна быть самой дорогой в группе
      if (b > лучшБалл || (b === лучшБалл && лучш && it.p && лучш.p && it.p < лучш.p)) {
        лучш = it; лучшБалл = b;
      }
    });
    return лучшБалл >= 8 ? лучш : null;
  }

  function фото(u) {
    if (!u) return "";
    if (/^https?:/i.test(u)) return u;
    return "https://img.tehnoholod369.kz/" + String(u).replace(/^\/+/, "");
  }

  // Значение атрибута — «bytovye» или «ventilyaciya|Приточные установки».
  // Вторая часть сужает «от» до подкатегории, и пишется она той же строкой,
  // что в ссылке плитки ?g=…&sub=…: число под ссылкой и то, что по ней
  // откроется, обязаны совпадать, иначе страница обещает не то.
  function слаг(v) { return String(v || "").split("|")[0].trim(); }
  function подкат(v) { var ч = String(v || "").split("|"); return ч.length > 1 ? ч[1].trim() : ""; }

  function заполнить() {
    var цены = [].slice.call(document.querySelectorAll("[data-price-from]"));
    var пики = [].slice.call(document.querySelectorAll("[data-pick]"));
    if (!цены.length && !пики.length) return;

    var группы = {};
    цены.forEach(function (e) { группы[слаг(e.getAttribute("data-price-from"))] = 1; });
    пики.forEach(function (e) { группы[слаг(e.getAttribute("data-pick"))] = 1; });

    Promise.all([взять("index.json"), взять("picks.json"), взять("hits.json"),
                 взять("articles.json")])
      .then(function (общее) {
      var idx = общее[0], p = общее[1], hits = общее[2] || {};
      var skus = (p && p.skus) || [];

      var изДанных = "";
      var стат = (общее[3] && общее[3].items) || [];
      var адрес = location.pathname.replace(/^\/+|\/+$/g, "");
      for (var i = 0; i < стат.length; i++) {
        if (стат[i].s === адрес) { изДанных = стат[i].p || ""; break; }
      }

      var дата = idx && idx.updated;
      if (дата) {
        var m = String(дата).match(/^(\d{4})-(\d{2})-(\d{2})/);
        var ру = m ? (m[3] + "." + m[2] + "." + m[1]) : дата;
        [].slice.call(document.querySelectorAll("[data-price-date]")).forEach(function (e) {
          e.textContent = ру;
        });
      }

      Object.keys(группы).forEach(function (slug) {
        взять(slug + ".json").then(function (items) {
          if (!items || !items.length) return;

          // Аксессуары из «от» исключаются. Минимум по всей группе — это цена
          // запчасти, а не товара: в мультисплите Wi-Fi модуль за 12 500 ₸,
          // в вентиляции ручной привод за 4 317 ₸ (замер 31.08.2026). Та же
          // грабля, что «цена внутреннего блока ≠ цена комплекта».
          var товар = items.filter(function (it) { return it.p && !it.acc; });

          цены.filter(function (e) { return слаг(e.getAttribute("data-price-from")) === slug; })
            .forEach(function (e) {
              var sub = подкат(e.getAttribute("data-price-from"));
              var годные = sub ? товар.filter(function (it) { return it.sub === sub; }) : товар;
              // нет данных — место остаётся пустым, а не показывает цену соседней
              // подкатегории: пустое место честнее неверного числа
              if (!годные.length) return;
              var мин = Math.min.apply(null, годные.map(function (it) { return it.p; }));
              e.textContent = число(мин) + " ₸";
            });

          var хиты = ((hits.byGroup || {})[slug] || []);
          var хит = null;
          for (var h = 0; h < хиты.length && !хит; h++) {
            хит = items.filter(function (x) { return x.s === хиты[h] && x.p; })[0] || null;
          }
          пики.filter(function (e) { return слаг(e.getAttribute("data-pick")) === slug; })
            .forEach(function (a) {
              // Сужение статьи: data-pick-only="TCL|FreshIN 3.0" — марка и кусок
              // названия. Появилось 03.09.2026: в статье про приточный кондиционер
              // «Наш выбор» показывал Ditreex, потому что выбирал из всех 383
              // настенных группы, а поле sub у них у всех одно — «Настенные».
              // Статья про конкретную технику обязана рекомендовать её же.
              // Третья часть — запасной кусок: названную модель разберут, и без него
              // карточка просто пропала бы со страницы. Запасной шире (вся линейка),
              // и он честнее пустого места: техника та же, исполнение другое.
              var только = (a.getAttribute("data-pick-only") || изДанных || "").split("|");
              var марка = (только[0] || "").trim().toLowerCase();
              var кусок = (только[1] || "").trim().toLowerCase();
              var запас = (только[2] || "").trim().toLowerCase();
              var поле = function (x) { return ((x.nb || x.n || "") + "").toLowerCase(); };
              var сузить = function (ч) {
                return товар.filter(function (x) {
                  if (марка && ((x.b || "") + "").toLowerCase().indexOf(марка) < 0) return false;
                  if (ч && поле(x).indexOf(ч) < 0) return false;
                  return true;
                }).filter(function (x) { return /налич/i.test(x.st || ""); });
              };
              var годные = сузить(кусок);
              if (!годные.length && запас) годные = сузить(запас);
              // сузили в пустоту — карточку не показываем вовсе: чужая модель
              // под заголовком статьи хуже, чем её отсутствие
              if (!годные.length) return;
              var свойХит = (марка || кусок)
                ? (годные.indexOf(хит) >= 0 ? хит : null) : хит;
              var it = свойХит || лучший(годные, skus);
              if (!it) return;
              if (a.tagName === "A") {
                a.setAttribute("href", "/tovar?g=" + slug + "&sl=" + encodeURIComponent(it.sl || ""));
              }
              var уст = function (сел, знач, атр) {
                var el = a.querySelector(сел);
                if (!el || !знач) return;
                if (атр) el.setAttribute(атр, знач); else el.textContent = знач;
              };
              // подпись метки и всплывающая подсказка. Формулировки разные намеренно:
              // «часто покупают» — утверждение о продажах, «мы отобрали» — о нашем мнении
              уст("[data-pick-tag]", хит ? "Хит продаж" : "Наш выбор");
              a.setAttribute("title", хит
                ? "Часто покупают у нас в Алматы. Отмечено ИП «ТехноХолод» по опыту продаж."
                : "Рекомендация ИП «ТехноХолод»: есть в наличии, с фото и полными "
                  + "характеристиками. Это наш выбор, а не статистика продаж.");
              уст("[data-pick-brand]", it.b);
              уст("[data-pick-name]", it.nb || it.n);
              уст("[data-pick-price]", it.pt || (it.p ? число(it.p) + " ₸" : ""));
              уст("[data-pick-img]", фото(it.i), "src");
              // класс, а не style: инлайновую запись шаблонизатор редизайна не сохраняет
              a.className = (a.className + " art-pick--on").trim();
            });
        });
      });
    });
  }

  // Загрузчик вешает внешние скрипты ДО support.js, который и собирает разметку
  // из x-dc: на момент запуска нужных элементов в DOM ещё нет — ждём их появления.
  var ждём = 0;
  var таймер = setInterval(function () {
    ждём += ШАГ_МС;
    if (document.querySelector("[data-price-from], [data-pick]")) {
      clearInterval(таймер);
      заполнить();
    } else if (ждём >= ЖДАТЬ_МС) {
      clearInterval(таймер);
    }
  }, ШАГ_МС);
})();
