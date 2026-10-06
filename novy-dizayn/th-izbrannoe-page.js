/**
 * Страницы «Избранное» (/izbrannoe) и «Сравнение» (/sravnenie) — по макетам, утверждённым 03.10.2026.
 * Контейнеры: <div id="th-fav-page"></div> и <div id="th-cmp-page"></div>. Хранилище и кнопки — th-izbrannoe.js,
 * корзина — cart.js (window.CART). Цены, фото и характеристики берутся из data/<раздел>.json по (g, sl): актуальные,
 * а не снимок на момент нажатия. Нет в данных (модель снята) — показываем снимок с пометкой.
 */
(function () {
  var DATA = "https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/main/novy-dizayn/data/";
  var КЭШ = {};
  var РАЗДЕЛЫ = {
    "bytovye": "Бытовые сплит-системы", "poluprom": "Полупромышленные кондиционеры", "multisplit": "Мультисплит-системы", "mobilnye": "Мобильные кондиционеры",
    "prom-mobilnye": "Промышленные мобильные", "vozduhoohladiteli": "Воздухоохладители", "radiatory": "Радиаторы Royal Thermo", "teplovye-pushki": "Тепловые пушки",
    "teplovye-zavesy": "Тепловые завесы", "infrakrasnye-obogrevateli": "Инфракрасные обогреватели", "vodyanye-teploventilyatory": "Водяные тепловентиляторы",
    "kaminy": "Камины и электроочаги", "obogrevateli": "Конвекторы и обогреватели", "teplovye-nasosy": "Тепловые насосы", "ventilyaciya": "Приточные и приточно-вытяжные установки",
    "ventilyatory-prom": "Промышленные вентиляторы", "osushiteli": "Осушители воздуха", "uvlazhniteli": "Промышленные увлажнители", "vodonagrevateli": "Водонагреватели и бойлеры",
    "vodoochistka": "Водоочистка и фильтры", "avtonomnoe-pitanie": "Зарядные станции и солнечные панели", "mini-vrf": "Мини-VRF и мультизональные", "fankoyly": "Фанкойлы",
    "chillery": "Чиллеры", "precizionnye": "Прецизионные кондиционеры"
  };

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function группа(g) {
    if (!КЭШ[g]) {
      КЭШ[g] = fetch(DATA + encodeURIComponent(g) + ".json", { cache: "no-cache" }).then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; });
    }
    return КЭШ[g];
  }
  function найти(записи) {
    var группы = {};
    записи.forEach(function (x) { группы[x.g] = 1; });
    return Promise.all(Object.keys(группы).map(function (g) { return группа(g).then(function (л) { return [g, л]; }); })).then(function (пары) {
      var по = {}; пары.forEach(function (п) { по[п[0]] = п[1]; });
      return записи.map(function (x) {
        var it = null;
        (по[x.g] || []).forEach(function (y) { if (y && y.sl === x.sl) it = y; });
        return { z: x, it: it };
      });
    });
  }
  var ИК_СЕРДЦЕ = '<svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>';
  var ИК_КРЕСТ = '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  function атр(x) { return 'data-g="' + esc(x.g) + '" data-sl="' + esc(x.sl) + '" data-n="' + esc(x.n) + '" data-b="' + esc(x.b) + '" data-i="' + esc(x.i) + '"'; }
  function урлФото(путь) {
    var s = String(путь || "");
    if (!s) return "";
    if (/^https?:\/\//.test(s)) return s;
    if (window.photoUrl) return window.photoUrl(s);
    return "https://img.tehnoholod369.kz/" + s.replace(/^\/+/, "");
  }
  var ПРИ_ОШИБКЕ = ' onerror="this.onerror=null;var a=window.photoAlt&&window.photoAlt(this.src);if(a)this.src=a;"';
  function адресМодели(x) { return "/tovar?g=" + encodeURIComponent(x.g) + "&sl=" + encodeURIComponent(x.sl); }
  function вКорзину(it, g) {
    if (window.CART && window.CART.add) window.CART.add(Object.assign({}, it, { g: g }), 1);
    try { window.dispatchEvent(new CustomEvent("th-cart")); } catch (e) {}
  }
  function пусто(корень, заголовок, текст) {
    корень.innerHTML = '<div class="thp-empty"><h2>' + esc(заголовок) + '</h2><p>' + esc(текст) + '</p><a class="thp-btn" href="/katalog">В каталог</a></div>';
  }
  function крошки(имя) { return '<div class="thp-cr"><a href="/">Главная</a> › ' + esc(имя) + '</div>'; }

  var ВАЖНЫЕ_ПОЛЯ = ["Мощность", "Объём", "Площадь помещения", "Производительность", "Тип управления", "Управление", "Диагональ экрана", "Вид установки", "Размер", "Цвет"];
  function краткие(it, сколько) {
    сколько = сколько || 3;
    var sp = (it.sp || []).filter(function (s) { return s && s[1] && String(s[1]).length < 40; });
    var вых = [];
    ВАЖНЫЕ_ПОЛЯ.forEach(function (имя) { sp.forEach(function (s) { if (s[0] === имя && вых.length < сколько && !вых.some(function (v) { return v[0] === имя; })) вых.push(s); }); });
    sp.forEach(function (s) { if (вых.length < сколько && !/^(Тип|Серия|Страна|Бренд)/.test(s[0]) && !вых.some(function (v) { return v[0] === s[0]; })) вых.push(s); });
    return вых.slice(0, сколько);
  }

  // ───────── Избранное ─────────
  function избранное(корень) {
    var список = window.THFav ? window.THFav.избранное() : [];
    if (!список.length) { корень.innerHTML = крошки("Избранное") + '<h1>Избранное</h1>'; var в = document.createElement("div"); корень.appendChild(в); пусто(в, "В избранном пока пусто", "Нажимайте сердечко на карточках моделей. Здесь они сохранятся, и позже их можно сравнить и положить в корзину."); return; }
    корень.innerHTML = крошки("Избранное") + '<h1>Избранное (' + список.length + ')</h1><div class="thp-grid" id="thp-grid"><p class="thp-note">Загружаем…</p></div><p class="thp-note">Цену и наличие подтверждаем перед оплатой.</p>';
    найти(список).then(function (пары) {
      var html = пары.map(function (п) {
        var z = п.z, it = п.it;
        var имя = it ? (it.nb || it.n) : z.n, бренд = it ? it.b : z.b, фото_ = it ? it.i : z.i, фото = !!фото_;
        var спец = it ? краткие(it, 6).map(function (s) { return '<div class="thp-r"><span>' + esc(s[0]) + '</span><b>' + esc(s[1]) + '</b></div>'; }).join("") : '<div class="thp-r"><span>Модель снята с витрины</span></div>';
        var цена = it && it.p ? '<div class="thp-p">' + esc(it.pt || "") + '</div>' : '<div class="thp-p thp-np">Цена по запросу</div>';
        var кнопка = it ? '<button type="button" class="thp-btn" data-cart="' + esc(z.g + "/" + z.sl) + '">' + (it.p ? "В корзину" : "Запросить цену") + '</button>' : "";
        return '<article class="thp-card">'
          + '<div class="thp-im">' + (фото ? '<img src="' + esc(урлФото(фото_)) + '" alt="' + esc(бренд + " " + имя) + '" loading="lazy"' + ПРИ_ОШИБКЕ + '>' : '') + '</div>'
          + '<div class="thp-bd"><div class="thp-top"><span class="thp-br">' + esc(бренд) + (it && /налич/i.test(it.st || "") ? ' <span class="thp-st">В наличии</span>' : '') + '</span><button type="button" class="thp-heart th-on" data-th-fav ' + атр(z) + ' aria-label="Убрать из избранного">' + ИК_СЕРДЦЕ + '</button></div>'
          + '<a class="thp-nm" href="' + адресМодели(z) + '">' + esc(имя) + '</a>' + (it && it.s ? '<div class="thp-sku">арт. ' + esc(it.s) + '</div>' : '') + спец + '<a class="thp-more" href="' + адресМодели(z) + '">Подробнее →</a></div>'
          + '<div class="thp-ft">' + цена + кнопка + '</div></article>';
      }).join("");
      document.getElementById("thp-grid").innerHTML = html;
      [].forEach.call(корень.querySelectorAll("[data-cart]"), function (б) {
        б.addEventListener("click", function () {
          var k = б.getAttribute("data-cart"), п = пары.filter(function (x) { return x.z.g + "/" + x.z.sl === k; })[0];
          if (!п || !п.it) return;
          if (!п.it.p) { location.href = "https://wa.me/77000369369?text=" + encodeURIComponent("Здравствуйте. Подскажите цену: " + (п.it.b || "") + " " + (п.it.nb || п.it.n)); return; }
          вКорзину(п.it, п.z.g); б.textContent = "В корзине ✓";
        });
      });
    });
  }

  // ───────── Сравнение ─────────
  var только = true;
  function сравнение(корень) {
    var список = window.THFav ? window.THFav.сравнение() : [];
    if (!список.length) { корень.innerHTML = крошки("Сравнение") + '<h1>Сравнение</h1>'; var в = document.createElement("div"); корень.appendChild(в); пусто(в, "Сравнивать пока нечего", "Нажмите значок диаграммы на карточках двух-трёх моделей одного раздела — здесь появится таблица различий."); return; }
    var раздел = РАЗДЕЛЫ[список[0].g] || "";
    корень.innerHTML = крошки("Сравнение") + '<h1>Сравнение (' + список.length + ')</h1>' + (раздел ? '<p class="thp-sub">' + esc(раздел) + '</p>' : '') + '<p class="thp-note">Загружаем…</p>';
    найти(список).then(function (пары) {
      var модели = пары.map(function (п) { return п; });
      var имена = [];
      модели.forEach(function (п) { ((п.it && п.it.sp) || []).forEach(function (s) { if (s && s[0] && имена.indexOf(s[0]) < 0) имена.push(s[0]); }); });
      function знач(п, имя) { var v = null; ((п.it && п.it.sp) || []).forEach(function (s) { if (s[0] === имя && s[1] !== "" && s[1] != null) v = String(s[1]); }); return v; }
      var строки = имена.map(function (имя) { var vs = модели.map(function (п) { return знач(п, имя); }); var одинак = vs.every(function (v) { return v === vs[0]; }); return { имя: имя, vs: vs, одинак: одинак }; });
      var скрыто = только && модели.length > 1 ? строки.filter(function (r) { return r.одинак; }).length : 0;
      var видимые = строки.filter(function (r) { return !(только && модели.length > 1 && r.одинак); });
      var n = модели.length;
      var шапка = модели.map(function (п) {
        var z = п.z, it = п.it, имя = it ? (it.nb || it.n) : z.n;
        return '<div class="thp-cc"><button type="button" class="thp-x" data-th-cmp ' + атр(z) + ' aria-label="Убрать из сравнения">' + ИК_КРЕСТ + '</button>'
          + '<div class="thp-cim">' + ((it ? it.i : z.i) ? '<img src="' + esc(урлФото(it ? it.i : z.i)) + '" alt=""' + ПРИ_ОШИБКЕ + '>' : '') + '</div>'
          + '<span class="thp-br">' + esc(it ? it.b : z.b) + (it && /налич/i.test(it.st || "") ? ' <span class="thp-st">В наличии</span>' : '') + '</span><a class="thp-nm" href="' + адресМодели(z) + '">' + esc(имя) + '</a>' + (it && it.s ? '<div class="thp-sku">арт. ' + esc(it.s) + '</div>' : '')
          + '<div class="thp-p">' + (it && it.p ? esc(it.pt || "") : "Цена по запросу") + '</div>'
          + (it && it.p ? '<button type="button" class="thp-btn" data-cart="' + esc(z.g + "/" + z.sl) + '">В корзину</button>' : '') + '</div>';
      }).join("");
      var тело = видимые.map(function (r) {
        return '<div class="thp-lb">' + esc(r.имя) + '</div><div class="thp-row">' + r.vs.map(function (v) { return '<div class="thp-v' + (v == null ? ' thp-nd' : '') + '">' + (v == null ? "нет данных" : esc(v)) + '</div>'; }).join("") + '</div>';
      }).join("") || '<p class="thp-note">Все характеристики этих моделей одинаковы.</p>';
      корень.innerHTML = крошки("Сравнение") + '<h1>Сравнение (' + n + ')</h1>' + (раздел ? '<p class="thp-sub">' + esc(раздел) + '</p>' : '')
        + '<label class="thp-sw"><input type="checkbox" id="thp-only"' + (только ? " checked" : "") + '><span class="thp-tg"></span><b>Только различия</b></label>'
        + (n > 1 ? '<p class="thp-note">' + (только ? "Скрыто одинаковых характеристик: " + скрыто + " из " + строки.length : "Показаны все характеристики: " + строки.length) + '</p>' : '<p class="thp-note">Добавьте ещё модель этого раздела, чтобы увидеть различия.</p>')
        + '<div class="thp-cmp" style="--n:' + n + '"><div class="thp-head">' + шапка + '</div>' + тело + '</div>'
        + '<p class="thp-note">Сравнивать можно модели одного раздела. <button type="button" class="thp-link" id="thp-clear">Очистить сравнение</button></p>';
      document.getElementById("thp-only").addEventListener("change", function (e) { только = e.target.checked; сравнение(корень); });
      document.getElementById("thp-clear").addEventListener("click", function () { window.THFav.очиститьСравнение(); });
      [].forEach.call(корень.querySelectorAll("[data-cart]"), function (б) {
        б.addEventListener("click", function () {
          var k = б.getAttribute("data-cart"), п = модели.filter(function (x) { return x.z.g + "/" + x.z.sl === k; })[0];
          if (п && п.it) { вКорзину(п.it, п.z.g); б.textContent = "В корзине ✓"; }
        });
      });
    });
  }

  function стили() {
    if (document.getElementById("thp-css")) return;
    var s = document.createElement("style"); s.id = "thp-css";
    s.textContent = ".thp{max-width:1280px;margin:0 auto;padding:16px 40px 72px;font-family:Inter,TildaSans,Arial,sans-serif;color:#1A1A1A;box-sizing:border-box}"
      + ".thp h1{margin:8px 0 14px;font:800 clamp(26px,5vw,36px)/1.15 Inter,Arial,sans-serif;color:#0033A0;letter-spacing:-.02em}"
      + ".thp-cr{font-size:14px;color:#606F85}.thp-cr a{color:#606F85;text-decoration:none}.thp-sub{margin:-6px 0 14px;font-size:17px;color:#606F85}"
      + ".thp-note{margin:14px 0;font-size:14px;line-height:20px;color:#606F85}.thp-link{border:0;background:none;color:#0066FF;font:600 14px/20px Inter,Arial,sans-serif;cursor:pointer;padding:0;margin-left:6px}"
      + ".thp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(380px,100%),1fr));gap:16px}"
      + ".thp-card{display:grid;grid-template-columns:150px minmax(0,1fr);grid-template-rows:auto auto;gap:0 16px;padding:16px;background:#fff;border:1px solid #DCE5F0;border-radius:12px}"
      + ".thp-im{grid-row:1;display:flex;align-items:center;justify-content:center;background:#F1F5F9;border-radius:10px;padding:8px;min-height:120px}.thp-im img{max-width:100%;max-height:130px;object-fit:contain}"
      + ".thp-bd{grid-row:1;min-width:0}.thp-top{display:flex;justify-content:space-between;align-items:center}.thp-br{font:600 13px/18px Inter,Arial,sans-serif;color:#606F85}"
      + ".thp-heart{width:32px;height:32px;padding:0;border:0;background:none;cursor:pointer;color:#E81C1C}.thp-heart svg{width:22px;height:22px;fill:#E81C1C;stroke:#E81C1C;stroke-width:1.8;stroke-linejoin:round}"
      + ".thp-nm{display:block;margin:2px 0 8px;font:700 17px/24px Inter,Arial,sans-serif;color:#0033A0;text-decoration:none}"
      + ".thp-r{display:flex;justify-content:space-between;gap:12px;padding:5px 0;border-bottom:1px solid #EEF2F7;font-size:14px;line-height:20px}.thp-r span{color:#606F85}.thp-r b{font-weight:500;text-align:right}"
      + ".thp-st{display:inline-block;margin-left:8px;padding:2px 8px;border:1px solid #BFE6D4;border-radius:999px;background:#fff;color:#178841;font:600 12px/16px Inter,Arial,sans-serif}"
      + ".thp-sku{margin:-4px 0 8px;font:500 12px/16px ui-monospace,Consolas,monospace;color:#606F85}"
      + ".thp-more{display:inline-block;margin-top:8px;font:600 14px/20px Inter,Arial,sans-serif;color:#0066FF;text-decoration:none}"
      + ".thp-ft{grid-column:1/-1;display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:14px;padding-top:14px;border-top:1px solid #DCE5F0}"
      + ".thp-p{font:800 22px/28px Inter,Arial,sans-serif}.thp-np{font:700 16px/22px Inter,Arial,sans-serif;color:#0033A0}"
      + ".thp-btn{display:inline-flex;align-items:center;justify-content:center;height:48px;padding:0 22px;border:0;border-radius:8px;background:#0066FF;color:#fff;font:600 16px/1 Inter,Arial,sans-serif;cursor:pointer;text-decoration:none}.thp-btn:hover{background:#0052D6}"
      + ".thp-empty{max-width:520px;margin:40px auto;text-align:center}.thp-empty h2{font:700 22px/30px Inter,Arial,sans-serif;color:#0033A0;margin:0 0 8px}.thp-empty p{color:#606F85;font-size:16px;line-height:24px;margin:0 0 20px}"
      + ".thp-sw{display:inline-flex;align-items:center;gap:10px;cursor:pointer;margin:2px 0}.thp-sw input{position:absolute;opacity:0}.thp-sw b{font:600 16px/22px Inter,Arial,sans-serif;color:#0033A0}"
      + ".thp-tg{width:46px;height:28px;border-radius:14px;background:#CBD5E1;position:relative;flex:none;transition:.15s}.thp-tg:after{content:'';position:absolute;top:3px;left:3px;width:22px;height:22px;border-radius:50%;background:#fff;transition:.15s}"
      + ".thp-sw input:checked+.thp-tg{background:#0066FF}.thp-sw input:checked+.thp-tg:after{left:21px}.thp-sw input:focus-visible+.thp-tg{outline:3px solid #0066FF;outline-offset:2px}"
      + ".thp-cmp{margin-top:8px}.thp-head,.thp-row{display:grid;grid-template-columns:repeat(var(--n),minmax(0,1fr));gap:12px}"
      + ".thp-cc{position:relative;display:flex;flex-direction:column;gap:4px;padding:14px;background:#fff;border:1px solid #DCE5F0;border-radius:12px}"
      + ".thp-x{position:absolute;top:8px;right:8px;width:28px;height:28px;padding:0;border:0;background:none;cursor:pointer;color:#0033A0}.thp-x svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round}"
      + ".thp-cim{display:flex;align-items:center;justify-content:center;height:110px}.thp-cim img{max-width:100%;max-height:100px;object-fit:contain}"
      + ".thp-cc .thp-p{font-size:19px;margin-top:6px}.thp-cc .thp-btn{height:44px;font-size:15px;margin-top:6px;padding:0 10px}"
      + ".thp-lb{margin:18px 0 6px;font-size:15px;color:#606F85}.thp-v{padding:10px 12px;background:#F1F5F9;border-radius:8px;font-size:15px;line-height:21px;overflow-wrap:anywhere}.thp-nd{color:#8593A6}"
      + "@media(max-width:760px){.thp{padding:12px 16px 96px}.thp-card{grid-template-columns:110px minmax(0,1fr);padding:14px}.thp-head,.thp-row{gap:8px}.thp-cc{padding:10px}.thp-cim{height:90px}.thp-cc .thp-nm{font-size:14px;line-height:19px}.thp-cc .thp-p{font-size:16px}.thp-v{padding:8px;font-size:13.5px;line-height:19px}}";
    document.head.appendChild(s);
  }

  function запуск() {
    стили();
    var ф = document.getElementById("th-fav-page"), с = document.getElementById("th-cmp-page");
    var корень = ф || с;
    if (!корень) return;
    корень.classList.add("thp");
    var нарисовать = function () { if (ф) избранное(ф); else сравнение(с); };
    var ждать = 0;
    (function жди() { if (window.THFav || ждать++ > 40) нарисовать(); else setTimeout(жди, 100); })();
    window.addEventListener("th-fav", нарисовать);
    window.addEventListener("storage", нарисовать);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", запуск); else запуск();
})();
