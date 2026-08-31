/**
 * Заявка с витрины — одна дорога в приёмник для всех форм.
 *
 * Зачем понадобилось. До 31.08.2026 формы на /kontakty, /proekt и /uslugi
 * умели ровно одно: открыть WhatsApp. Заявка существовала, только если человек
 * дожал отправку в мессенджере; заполненная и брошенная форма не оставляла
 * следа нигде, и в листе «Заявки» приёмника не было ни одной настоящей строки.
 * Та же дыра была у корзины и закрыта 30.08.2026 — здесь то же лечение.
 *
 * Приёмник трогать не потребовалось: doPost уже принимает обычный лид
 * (kind:"lead" либо телефон из 10+ цифр) и пишет строку в лист «Заявки»
 * колонками LEAD_COLS. Поэтому отсюда шлём ровно те поля, которые он знает,
 * а не свои выдуманные.
 *
 * Content-Type: text/plain — намеренно. Это «простой» запрос, браузер
 * не делает preflight; Apps Script на OPTIONS не отвечает вовсе.
 *
 * Ошибка сети или таблицы возвращает false, а не исключение: WhatsApp должен
 * открыться в любом случае — терять обращение из-за недоступной таблицы нельзя.
 */
(function () {
  // Приёмник заявок: тот же /exec, что у корзины, отзывов на /brigady
  // и карточки модели. Второго адреса не заводим — при смене развёртывания
  // менять в одном месте.
  var EXEC = "https://script.google.com/macros/s/AKfycbzqoF8JVLc-OjrSLJbwZ8oBi0MbC5p89VHmLY9di3rcaK0TrTdEEPAduBqbYPRqWPwdgA/exec";

  var PHONE = "77000369369";

  /** Метка сессии — та же, что у отзывов: по ней видно, что заявка и просмотры
   *  каталога принадлежат одному человеку. Приватный режим её запрещает —
   *  тогда просто пусто, а не падение. */
  function ses() {
    try {
      var s = window.sessionStorage.getItem("th_ses");
      if (!s) {
        s = Math.random().toString(36).slice(2, 10);
        window.sessionStorage.setItem("th_ses", s);
      }
      return s;
    } catch (e) { return ""; }
  }

  window.TH_LEAD = {
    /** Ссылка на WhatsApp с готовым текстом. Один формат номера на весь сайт. */
    wa: function (text) {
      return "https://wa.me/" + PHONE + (text ? "?text=" + encodeURIComponent(text) : "");
    },

    /** Пишет заявку в лист «Заявки». Возвращает Promise<boolean>: true —
     *  строка записана, false — не дошло (и тогда единственный след обращения
     *  остаётся в WhatsApp).
     *
     *  Телефон НЕ обязателен: `kind:"lead"` заставляет приёмник записать строку
     *  даже без него — иначе проектный запрос, где контакт бывает почтой, ушёл бы
     *  в «События» или не сохранился вовсе. Но совсем пустое обращение не шлём:
     *  без телефона и без контакта строка ничем не поможет и только мусорит лист. */
    send: function (p) {
      p = p || {};
      var phone = String(p.phone || "").trim();
      var contact = String(p.contact || "").trim();
      if (!phone && !contact) { return Promise.resolve(false); }
      // Контакт, который не является телефоном (почта, ник), кладём в комментарий:
      // колонки под него в листе нет, а терять его нельзя — это единственный способ
      // ответить человеку.
      var comment = String(p.comment || "");
      if (!phone && contact) {
        comment = comment ? ("Контакт: " + contact + ". " + comment) : ("Контакт: " + contact);
      }
      var body = {
        kind: "lead",
        channel: p.channel || "сайт",
        name: p.name || "",
        phone: phone,
        city: p.city || "",
        room: p.room || "",
        area: p.area || "",
        height: p.height || "",
        corr: p.corr || "",
        watt: p.watt || "",
        btu: p.btu || "",
        budget: p.budget || "",
        install: p.install || "",
        comment: comment,
        unknown: p.unknown || "",
        src: (typeof location !== "undefined" ? location.pathname : ""),
        ses: ses(),
        ua: (typeof navigator !== "undefined" ? navigator.userAgent : "").slice(0, 260)
      };
      return fetch(EXEC, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(body)
      }).then(function (r) { return r.text(); })
        .then(function (t) { return String(t).indexOf("OK") === 0; })
        .catch(function () { return false; });
    },

    /** Событие без контактов — строка в лист «События», а не в «Заявки».
     *  Нужно там, где человек что-то посчитал и ушёл в WhatsApp, не оставив
     *  ни телефона, ни почты: заявкой это называть нельзя, но спрос по площадям
     *  и классам виден. Приёмник сам уводит в «События» всё, где нет телефона
     *  и не сказано kind:"lead". Ответа не ждём — это фон, а не действие. */
    event: function (p) {
      p = p || {};
      try {
        fetch(EXEC, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({
            channel: p.channel || "сайт",
            ev: p.ev || "", val: p.val || "",
            area: p.area || "", height: p.height || "", corr: p.corr || "",
            brand: p.brand || "", type: p.type || "", model: p.model || "",
            src: (typeof location !== "undefined" ? location.pathname : ""),
            ses: ses(),
            ua: (typeof navigator !== "undefined" ? navigator.userAgent : "").slice(0, 260)
          }),
          keepalive: true
        }).catch(function () {});
      } catch (e) { /* фоновой записи не даём ломать переход в WhatsApp */ }
    },

    /** Полный ход кнопки «отправить»: окно WhatsApp открывается СРАЗУ, до
     *  ожидания ответа приёмника, иначе браузер блокирует его как попап
     *  (та же грабля, что в корзине). Возвращает Promise<boolean> — записалась
     *  ли заявка; страница по нему решает, что показать под формой. */
    submit: function (p, text) {
      var w = null;
      try { w = window.open("", "_blank"); } catch (e) { w = null; }
      var href = this.wa(text);
      return this.send(p).then(function (ok) {
        if (w) { w.location.href = href; } else { window.location.href = href; }
        return ok;
      });
    }
  };
})();
