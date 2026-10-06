window.PUB = async function (S) {
  const sl = ms => new Promise(r => setTimeout(r, ms));
  const bs = [...document.querySelectorAll('.tp-record-ui__button-text')].filter(e => e.textContent.trim() === 'Контент');
  let res = 'BTN ' + bs.length;
  for (const b of bs) {
    (b.closest('a,button,[class*=button]') || b).click();
    let e = null;
    for (let i = 0; i < 8 && !e; i++) { await sl(1000); e = document.querySelector('.ace_editor'); }
    if (!e) { res += ' NOACE'; continue; }
    const ed = e.env.editor; const old = ed.getValue();
    if (!old.includes('.thgeo{')) { res += ' skip'; continue; }
    const код = await (await fetch('https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/main/novy-dizayn/_stati_tmp/' + S + '.txt?x=' + Date.now())).text();
    const c = s => (s.match(/class="thgeo-card"/g) || []).length;
    const h1 = s => ((s.match(/<h1[^>]*>(.*?)<\/h1>/s) || [])[1] || '').replace(/<[^>]+>/g, '').trim();
    const faq = s => (s.match(/FAQPage/g) || []).length;
    if (!код.includes('thgeo-cards') || код.includes('Montserrat') || (c(old) > 0 && Math.abs(c(код) - c(old)) > 1) || (h1(old) && h1(код) && h1(код) !== h1(old)) || faq(код) !== faq(old) || код.length > 64000 || код.length < 20000) {
      return 'BADNEW cards ' + c(код) + '/' + c(old) + ' h1 ' + h1(код) + '|' + h1(old) + ' faq ' + faq(код) + '/' + faq(old) + ' len ' + код.length;
    }
    ed.setValue(код, -1); edrec__sendForm('update', 'content'); await sl(5000);
    const r = await tp__fetch({ url: '/page/publish/', body: { comm: 'pagepublish', pageid: window.pageid, csrf: getCSRF(), returnjson: 'yes' }, explanation: 'page publishing', silent: true });
    return S + ' ' + old.length + ' to ' + код.length + ' pub ' + r.includes('pageid');
  }
  return res;
};
'ok'
