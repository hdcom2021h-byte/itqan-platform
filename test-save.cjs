const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const src = fs.readFileSync(__dirname + '/index.html', 'utf8');
for (const match of src.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
  if (!/\bsrc=/.test(match[1])) new vm.Script(match[2]);
}
const template = src.slice(src.indexOf("      case 'tp-save': {"), src.indexOf("      case 'ad-save': {"));
const modalStart = src.indexOf("        const btn = ev.target.querySelector('button[type=submit]');");
const modalEnd = src.indexOf('\n      }\n      return;', modalStart);
const modal = src.slice(modalStart, modalEnd);
async function templateTest(saved) {
  const draft = [{id:'a', name:' Edited ', weight:100}];
  const UI = {tplDraft:{teacher:draft}};
  const DB = {templates:{teacher:{items:[{id:'a',name:'Old',weight:100}]}}};
  const f = new Function('UI','DB','commit','render','toast','clone','nowIso', 'return (async()=>{const d={role:"teacher"};switch("tp-save"){'+template+'}})()');
  await f(UI,DB,async(fn)=>{if(saved)fn(DB);return saved;},()=>{},()=>{},structuredClone,()=> 'now');
  assert.equal(UI.tplDraft.teacher[0].name,saved?'Edited':' Edited ');
}
async function modalTest(kind) {
  const btn={disabled:false};let errors=0,closed=0;
  const handler=kind==='sync'?()=>{throw Error('failure');}:kind==='async'?async()=>{throw Error('failure');}:async()=>kind==='close';
  const f=new Function('ev','modalHandler','FormData','closeModal','toast','CLOUD','C','console','return (async()=>{'+modal+'})()');
  await f({target:{querySelector:()=>btn}},handler,class {},()=>closed++,()=>errors++,false,{}, {error(){}});
  assert.equal(btn.disabled,false);
  assert.equal(errors,['sync','async'].includes(kind)?1:0);
  assert.equal(closed,kind==='close'?1:0);
}
(async()=>{
  await templateTest(false);await templateTest(true);
  for(const kind of ['sync','async','close','keep'])await modalTest(kind);
  console.log('PASS: inline script syntax; template success/failure; modal sync/async errors and close/keep');
})().catch(e=>{console.error(e);process.exitCode=1;});
