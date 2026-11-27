(function (root) {
  'use strict';
  const allowedBrands = new Set(['ELECTROLUX', 'GREE', 'HISENSE', 'BALLU', 'CHERBROOKE', 'THAICON', 'TCL']);
  const dates = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Almaty', year: 'numeric', month: '2-digit', day: '2-digit'
  });

  function eligible(product, ownerApproved, now = new Date()) {
    if (ownerApproved !== true || product?.skuApproved !== true || product.category !== 'bytovye') return false;
    const brand = String(product.brand ?? '').trim().toUpperCase();
    const parts = Object.fromEntries(dates.formatToParts(now).map(({ type, value }) => [type, value]));
    const day = parts.year + '-' + parts.month + '-' + parts.day;
    return allowedBrands.has(brand) && day >= '2026-12-01' && day <= '2027-01-31';
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = eligible;
  else root.newYearIcicleEligible = eligible;
})(globalThis);
window.newYearCatalogCampaign = {
  "ownerApproved": true,
  "approvalRef": "TEST-ONLY: тестовые данные, не коммерческое подтверждение",
  "discountKzt": 10000,
  "start": "2026-12-01",
  "end": "2027-01-31",
  "stackingText": "Дополнительная скидка 10 000 ₸ вычитается из действующей цены участвующего бытового кондиционера, включая действующую акционную цену.",
  "approvedScope": {
    "category": "Бытовые кондиционеры",
    "brands": [
      "Electrolux",
      "GREE",
      "Hisense",
      "Ballu",
      "CHERBROOKE",
      "THAICON",
      "TCL"
    ],
    "scopeApprovedOn": "2026-11-27"
  },
  "items": [
    {
      "sku": "TAC-FR09HSV/P7W",
      "test": true
    }
  ]
};

// ТОЛЬКО ТЕСТ: дата сценария из адреса (?ny_now=2026-12-01T00:00:00+06:00)
(function () {
  const raw = new URLSearchParams(location.search).get('ny_now');
  const d = raw ? new Date(raw) : null;
  const testNow = d && !isNaN(d) ? d : null;
  const base = window.newYearIcicleEligible;
  if (testNow) window.newYearIcicleEligible = (p, ok) => base(p, ok, testNow);
  const label = (testNow ? new Intl.DateTimeFormat('ru-RU', { timeZone: 'Asia/Almaty', dateStyle: 'long', timeStyle: 'short' }).format(testNow) + ' (Алматы)' : 'текущая') + ' · ny_now=' + (raw || '—');
  const put = () => { const e = document.getElementById('ny-test-date'); if (e) e.textContent = label; else setTimeout(put, 200); };
  put();
})();
