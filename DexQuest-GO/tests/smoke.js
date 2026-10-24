/* Headless interaction smoke test using fake DOM elements; no npm packages. */
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const base=path.resolve(__dirname,'../app/src/main/assets');
const els=new Map(),docHandlers={};
function el(id){if(!els.has(id)){
  const events={},classes=new Set();
  els.set(id,{id,value:'',checked:false,innerHTML:'',textContent:'',dataset:{},style:{},files:[],
    classList:{add(x){classes.add(x)},remove(x){classes.delete(x)},contains(x){return classes.has(x)},toggle(x,b){if(b)classes.add(x);else classes.delete(x)}},
    addEventListener(name,fn){events[name]=fn},dispatch(name,arg){if(events[name]) return events[name](arg||{})},
    querySelectorAll(){return []},scrollIntoView(){},click(){},reset(){this.value='';},
    get _events(){return events}
  });
}return els.get(id)}
const store=new Map();const ctx={
  console,Math,Date,JSON,Set,Map,Number,String,Array,RegExp,Error,Promise,
  window:{scrollTo(){},DEXQUEST_SPECIES:undefined},
  document:{getElementById:el,querySelectorAll(){return []},addEventListener(type,fn){docHandlers[type]=fn},createElement(){return {value:'',select(){},remove(){},click(){}}},body:{appendChild(){}}},
  localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},
  navigator:{clipboard:{writeText:async v=>{ctx._copied=v}}},
  alert:msg=>{ctx._alert=msg},confirm:()=>true,setTimeout:()=>1,clearTimeout:()=>{},
  URL:{createObjectURL:()=> 'blob:fake',revokeObjectURL:()=>{}},Blob:class {}
};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(base,'species.js'),'utf8'),ctx,{timeout:1000});
for(const field of ['dex-gen','shiny-gen','dex-status','shiny-status'])el(field).value='all';
for(const field of ['goal-have'])el(field).value='0';
for(const field of ['storage-low',...['shiny','legendary','mythical','lucky','favorite','shadow','costume','defender'].map(x=>'ex-'+x)])el(field).checked=true;
vm.runInContext(fs.readFileSync(path.join(base,'app.js'),'utf8'),ctx,{timeout:4000});
assert(el('stat-caught').innerHTML.includes('/ 1025'));
assert(el('region-progress').innerHTML.includes('Paldea'));
function click(dataset){ docHandlers.click({target:{closest:()=>({dataset})}}); }
click({page:'dex'});
assert(el('dex-grid').innerHTML.includes('Bulbasaur'));
click({flag:'caught',id:'25'});
assert(JSON.parse(store.get('dexquest.go.v1')).caught.includes(25));
click({flag:'shiny',id:'129'});
const data=JSON.parse(store.get('dexquest.go.v1'));
assert(data.shiny.includes(129)&&data.caught.includes(129));
click({page:'planner'});
el('goal-species').value='Magikarp (#129)';
el('goal-species').dispatch('change');
assert.strictEqual(el('goal-cost').value,400);
assert.strictEqual(el('goal-target').value,'Gyarados');
el('goal-have').value='150';
el('goal-form').dispatch('submit',{preventDefault(){}});
assert(JSON.parse(store.get('dexquest.go.v1')).goals.length===1);
assert(el('goals-list').innerHTML.includes('250 needed'));
click({page:'storage'});
assert(el('storage-query').textContent.includes('!4*'));
assert(el('storage-query').textContent.includes('!shiny'));
click({page:'shiny'});
el('shiny-status').value='shiny'; el('shiny-status').dispatch('change');
assert(el('shiny-grid').innerHTML.includes('Magikarp'));
assert(el('shiny-total').textContent===1);
assert(ctx.window.dexquestGoBack()===true);
assert(ctx.window.dexquestGoBack()===false);
console.log('DexQuest GO interactive JS smoke tests passed.');