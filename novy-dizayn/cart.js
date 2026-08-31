/**
 * Корзина сайта: одно состояние на все страницы.
 *
 * Бэкенда у сайта нет, поэтому заказ уходит в WhatsApp — но уходит СОСТАВОМ,
 * а не пустой строкой: артикул, количество, цена, контакты, доставка и оплата.
 * Хранилище — localStorage, ключ th_cart_v1. При запрете хранилища (приватный
 * режим) корзина живёт в памяти вкладки: заказ всё равно можно отправить.
 *
 * Позиция в корзине — снимок карточки на момент добавления:
 *   { sl, s, n, b, g, p, pt, i, st, q }
 * Цена берётся из данных при добавлении и при каждом заходе на страницу корзины
 * сверяется с актуальной: цена в мастере меняется чаще, чем клиент оформляет заказ.
 */
(function () {
  var KEY = "th_cart_v1";
  // Приёмник заявок: тот же /exec, что у отзывов на /brigady и у карточки модели.
  // Второго адреса не заводим — при смене развёртывания менять в одном месте.
  var EXEC = "https://script.google.com/macros/s/AKfycbzqoF8JVLc-OjrSLJbwZ8oBi0MbC5p89VHmLY9di3rcaK0TrTdEEPAduBqbYPRqWPwdgA/exec";

  var DATA = "https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/main/novy-dizayn/data/";
  var mem = null;

  function read() {
    if (mem) return mem;
    try {
      var raw = window.localStorage.getItem(KEY);
      mem = raw ? JSON.parse(raw) : [];
    } catch (e) { mem = []; }
    if (!Array.isArray(mem)) mem = [];
    return mem;
  }

  function write(list) {
    mem = list;
    try { window.localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) {}
    try {
      window.dispatchEvent(new CustomEvent("th-cart", { detail: { count: count() } }));
    } catch (e) {
      var ev = document.createEvent("Event");
      ev.initEvent("th-cart", true, true);
      window.dispatchEvent(ev);
    }
  }

  function key(x) { return String(x && (x.sl || x.s || x.n) || ""); }

  function count() {
    return read().reduce(function (n, x) { return n + (x.q || 1); }, 0);
  }

  function total() {
    return read().reduce(function (n, x) { return n + (x.p || 0) * (x.q || 1); }, 0);
  }

  var CART = {
    list: function () { return read().slice(); },
    count: count,
    total: total,

    /** Добавить позицию каталога. item — объект из data/<группа>.json плюс g. */
    add: function (item, qty) {
      var list = read().slice();
      var k = key(item);
      if (!k) return 0;
      var found = null;
      for (var i = 0; i < list.length; i++) if (key(list[i]) === k) found = list[i];
      if (found) {
        found.q = (found.q || 1) + (qty || 1);
      } else {
        list.push({
          sl: item.sl || "", s: item.s || "", n: item.n || "", b: item.b || "",
          g: item.g || item.group || "", p: item.p || 0, pt: item.pt || "",
          i: item.i || "", st: item.st || "", q: qty || 1
        });
      }
      write(list);
      return count();
    },

    setQty: function (k, q) {
      var list = read().slice();
      for (var i = 0; i < list.length; i++) {
        if (key(list[i]) === String(k)) list[i].q = Math.max(1, q | 0);
      }
      write(list);
    },

    remove: function (k) {
      write(read().filter(function (x) { return key(x) !== String(k); }));
    },

    clear: function () { write([]); },

    has: function (k) {
      return read().some(function (x) { return key(x) === String(k); });
    },

    /**
     * Сверка снимка с текущими данными группы: цена и наличие меняются,
     * и клиент должен увидеть это до отправки заказа, а не в переписке.
     */
    refresh: function () {
      var list = read();
      var groups = {};
      list.forEach(function (x) { if (x.g) groups[x.g] = 1; });
      var names = Object.keys(groups);
      if (!names.length) return Promise.resolve({ list: list, changed: [] });
      return Promise.all(names.map(function (g) {
        return fetch(DATA + g + ".json").then(function (r) {
          return r.ok ? r.json().then(function (items) { return { g: g, items: items, ok: true }; })
                      : { g: g, items: [], ok: false };
        }).catch(function () { return { g: g, items: [], ok: false }; });
      })).then(function (packs) {
        var byGroup = {}, loaded = {};
        packs.forEach(function (p) { byGroup[p.g] = p.items; loaded[p.g] = p.ok; });
        var changed = [];
        var next = list.map(function (x) {
          // группа не загрузилась — молчим. Сказать «позиции больше нет в каталоге»
          // из-за оборванной сети значит соврать клиенту про его же заказ.
          if (!loaded[x.g]) return x;
          var items = byGroup[x.g] || [];
          var cur = null;
          for (var i = 0; i < items.length; i++) {
            if ((items[i].sl && items[i].sl === x.sl) || (items[i].s && items[i].s === x.s)) { cur = items[i]; break; }
          }
          if (!cur) { changed.push({ sl: x.sl, n: x.n, what: "позиции больше нет в каталоге" }); return x; }
          var y = Object.assign({}, x);
          if (cur.p !== x.p) {
            changed.push({ sl: x.sl, n: x.n, what: "цена изменилась", was: x.pt, now: cur.pt });
            y.p = cur.p; y.pt = cur.pt;
          }
          if (cur.st !== x.st) {
            changed.push({ sl: x.sl, n: x.n, what: "наличие изменилось", was: x.st, now: cur.st });
            y.st = cur.st;
          }
          y.i = cur.i || y.i;
          return y;
        });
        if (changed.length) write(next);
        return { list: next, changed: changed };
      });
    },

    /** Текст заказа для WhatsApp: состав, суммы и контакты одной строкой на позицию. */
    orderText: function (form, number) {
      form = form || {};
      var list = read();
      var lines = [];
      // Номер первой строкой: по нему заказ находится и у нас, и у клиента.
      // Нет номера (приёмник не ответил) — просто не пишем: заказ уходит как раньше,
      // терять продажу из-за недоступности таблицы нельзя.
      if (number) { lines.push("Заказ " + number); }
      lines.push(form.company ? "Запрос счёта с сайта." : "Заказ с сайта.");
      list.forEach(function (x, n) {
        var q = x.q || 1;
        lines.push(
          (n + 1) + ". " + (x.b ? x.b + " " : "") + x.n
          + (x.s ? " (арт. " + x.s + ")" : "")
          + " — " + q + " шт."
          + (x.p ? " x " + x.pt + " = " + fmt(x.p * q) + " ₸" : " — цена по запросу")
          + (x.st ? " · " + x.st : "")
        );
      });
      if (list.length) lines.push("Оборудование итого: " + fmt(total()) + " ₸ с НДС.");
      if (form.mount) lines.push("Нужен монтаж под ключ (считается после замера).");
      if (form.kit) lines.push("Нужен соединительный комплект и трасса.");
      if (form.delivery) lines.push("Доставка: " + form.delivery + ".");
      if (form.payment) lines.push("Оплата: " + form.payment + ".");
      var who = [];
      if (form.name) who.push(form.name);
      if (form.phone) who.push("тел. " + form.phone);
      if (form.city) who.push(form.city);
      if (form.address) who.push(form.address);
      if (who.length) lines.push("Контакты: " + who.join(", ") + ".");
      if (form.company) lines.push("Организация: " + form.company + (form.bin ? ", ИИН/БИН " + form.bin : "") + ".");
      if (form.comment) lines.push("Комментарий: " + form.comment);
      return lines.join("\n");
    },

    orderHref: function (form, number) {
      return "https://wa.me/77000369369?text=" + encodeURIComponent(CART.orderText(form, number));
    },

    /** Отправляет заказ в приёмник и обещает номер TH369-ГГММ-NNNN.
     *
     *  Зачем: до 30.08.2026 заказ уходил только в WhatsApp. Состав клиент получал,
     *  а у нас не оставалось ничего — ни строки в таблице, ни номера, который
     *  можно назвать при возврате. Брошенная корзина не оставляла следа вовсе.
     *
     *  Content-Type: text/plain — намеренно. Это «простой» запрос, браузер
     *  не делает preflight (Apps Script на OPTIONS не отвечает), а doPost
     *  приёмника уже разбирает JSON из тела.
     *
     *  Ошибка сети или таблицы возвращает пустой номер, а не исключение:
     *  заказ должен уйти в WhatsApp в любом случае. */
    submitOrder: function (form) {
      form = form || {};
      var items = read().map(function (x) {
        return {
          art: x.s || "", name: x.n || "", brand: x.b || "",
          group: x.g || "", sub: x.sub || "",
          qty: x.q || 1, price: x.p || 0
        };
      });
      if (!items.length) { return Promise.resolve(""); }
      var payload = {
        kind: "order", channel: form.company ? "сайт (счёт юрлицу)" : "сайт",
        name: form.name || "", phone: form.phone || "", city: form.city || "",
        comment: [form.comment, form.address ? "Адрес: " + form.address : "",
                  form.company ? "Организация: " + form.company : "",
                  form.bin ? "ИИН/БИН: " + form.bin : "",
                  form.delivery ? "Доставка: " + form.delivery : "",
                  form.payment ? "Оплата: " + form.payment : "",
                  form.mount ? "Нужен монтаж" : "", form.kit ? "Нужен комплект" : ""]
                 .filter(Boolean).join("; "),
        items: items,
        src: (typeof location !== "undefined" ? location.pathname : ""),
        ua: (typeof navigator !== "undefined" ? navigator.userAgent : "")
      };
      return fetch(EXEC, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
      }).then(function (r) { return r.json(); })
        .then(function (d) { return (d && d.number) ? d.number : ""; })
        .catch(function () { return ""; });
    }
  };

  function fmt(n) {
    return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  }

  CART.fmt = fmt;
  window.CART = CART;
})();
