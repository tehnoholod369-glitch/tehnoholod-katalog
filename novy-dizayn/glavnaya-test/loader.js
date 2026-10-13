/* Тестовая страница новой главной: подгружает блоки из home.html и запускает их скрипты. Только для проверки, в боевой сайт не идёт. */
(function () {
  var BASE = "https://cdn.jsdelivr.net/gh/tehnoholod369-glitch/tehnoholod-katalog@b6e4891f67a0193bef425cd3f09f7463a32e6258/novy-dizayn/glavnaya-test/";
  var box = document.getElementById("th-home");
  if (!box) return;
  if (!document.querySelector('link[href*="family=Inter"]')) {
    var l = document.createElement("link"); l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap";
    document.head.appendChild(l);
  }
  fetch(BASE + "home.html?v=" + Date.now()).then(function (r) { return r.text(); }).then(function (txt) {
    var tpl = document.createElement("template");
    tpl.innerHTML = txt;
    Array.prototype.slice.call(tpl.content.childNodes).forEach(function (n) {
      if (n.nodeType === 1 && n.tagName === "SCRIPT") {
        var s = document.createElement("script");
        s.textContent = n.textContent;
        box.appendChild(s);
      } else {
        box.appendChild(n);
      }
    });
    var pp = document.createElement("script");
    pp.src = BASE + "th-popups.js?v=" + Date.now();
    document.head.appendChild(pp);
  });
})();
