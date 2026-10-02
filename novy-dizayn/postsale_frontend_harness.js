const fs = require('fs');
const htmlPath = 'C:/Users/tehno/OneDrive/Документы/Claude/Projects/Оптимизация сайта/САЙТ_НОВЫЙ_ДИЗАЙН//brigady';
const html = fs.readFileSync(htmlPath, 'utf8');
const m = html.match(/<script type="text\/x-dc"[^>]*>([\s\S]*?)<\/script>/);
if (!m) throw new Error('DC script not found');

global.window = {
  location: { search: '?postsale=1&karta=369-02-AC-TEST-2609-9999&zakaz=TH369-2609-0099&brigada=369-BR-02-001', hash:'', pathname:'/brigady' },
  history: { replaceState(){} }, pageYOffset:0, scrollTo(){}
};
global.sessionStorage = { _d:{}, getItem(k){return this._d[k]||null;}, setItem(k,v){this._d[k]=v;} };
global.navigator = { userAgent:'HARNESS', sendBeacon:null };
global.document = { referrer:'https://tehnoholod369.kz/test', getElementById(){ return null; } };
global.setTimeout = () => 0;
global.clearTimeout = () => {};
let posted = null;
global.fetch = (url, opts={}) => {
  if (opts && opts.method === 'POST') { posted = {url, body:opts.body}; }
  return Promise.resolve({ ok:false, json:()=>Promise.resolve(null) });
};
class DCLogic { setState(p){ this.state = Object.assign({}, this.state, p); } }
global.DCLogic = DCLogic;
new Function(m[1] + '\n;globalThis.__Component = Component;')();
const Component = global.__Component;
let failures = 0;
function check(name, cond, detail='') {
  if (cond) console.log('✓', name); else { console.log('✗', name, detail); failures++; }
}
const c = new Component();
c.componentDidMount();
check('post-sale режим распознан', c.postSale && c.postSale.active === true);
check('карта взята из URL', c.postSale.card === '369-02-AC-TEST-2609-9999');
check('заказ взят из URL', c.postSale.order === 'TH369-2609-0099');
check('бригада взята из URL', c.postSale.brigade === '369-BR-02-001');
check('карта предзаполнена в форме', c.form('369-BR-02-001').card === '369-02-AC-TEST-2609-9999');

c.state.form['369-BR-02-001'] = {
  score:5, name:'Тест', card:'369-02-AC-TEST-2609-9999', text:'Работа выполнена аккуратно',
  tovar:4, tovarText:'Оборудование работает тихо',
  needsHelp:false, issueText:'', publicConsent:false
};
c.sendReview('369-BR-02-001');
check('POST сформирован', !!posted);
const params = new URLSearchParams(posted ? posted.body : '');
check('postsale=1 уходит в backend', params.get('postsale') === '1');
check('order_id уходит в backend', params.get('order_id') === 'TH369-2609-0099');
check('needs_help=0 уходит явно', params.get('needs_help') === '0');
check('public_consent=0 уходит явно', params.get('public_consent') === '0');
posted = null;
c.state.form['369-BR-02-001'] = {
  score:5, name:'Тест', card:'369-02-AC-TEST-2609-9999', text:'Нужна проверка',
  tovar:5, tovarText:'', needsHelp:true, issueText:'Появился посторонний шум', publicConsent:true
};
c.sendReview('369-BR-02-001');
const p2 = new URLSearchParams(posted ? posted.body : '');
check('проблемный сценарий отправляется', !!posted);
check('needs_help=1 уходит', p2.get('needs_help') === '1');
check('описание проблемы уходит', p2.get('issue_text') === 'Появился посторонний шум');
check('согласие на публикацию уходит', p2.get('public_consent') === '1');

posted = null;
c.state.form['369-BR-02-001'] = {
  score:5, name:'Тест', card:'369-02-AC-TEST-2609-9999', text:'Работа выполнена',
  tovar:0, tovarText:'', needsHelp:false, issueText:'', publicConsent:false
};
c.sendReview('369-BR-02-001');
check('без оценки оборудования post-sale не отправляется', posted === null);

console.log(failures ? 'FAILURES='+failures : 'ALL POST-SALE FRONTEND TESTS PASS');
process.exit(failures ? 1 : 0);