/* Фирменное написание статусов: МАСТЕР и ПАРТНЕР — всегда прописными. */
(function () {
  "use strict";
  var STATUS = /(^|[^А-Яа-яЁёA-Za-z0-9_])(мастер(?:а|у|ом|е|ы|ов|ам|ами|ах)?|партн[её]р(?:а|у|ом|е|ы|ов|ам|ами|ах)?)(?=$|[^А-Яа-яЁёA-Za-z0-9_])/gi;
  var SKIP = /^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE|TEXTAREA|CODE|PRE)$/;

  function caps(value) {
    return String(value || "").replace(STATUS, function (_, before, word) {
      return before + word.toUpperCase();
    });
  }

  function fixText(node) {
    var parent = node && node.parentElement;
    if (!node || !parent || SKIP.test(parent.tagName)) return;
    var next = caps(node.nodeValue);
    if (next !== node.nodeValue) node.nodeValue = next;
  }

  function fix(root) {
    if (!root) return;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    var node;
    while ((node = walker.nextNode())) fixText(node);
  }

  function start() {
    fix(document.body);
    new MutationObserver(function (changes) {
      changes.forEach(function (change) {
        if (change.type === "characterData") return fixText(change.target);
        change.addedNodes.forEach(function (node) {
          if (node.nodeType === 3) fixText(node);
          else if (node.nodeType === 1 && !SKIP.test(node.tagName)) fix(node);
        });
      });
    }).observe(document.documentElement, { subtree: true, childList: true, characterData: true });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
