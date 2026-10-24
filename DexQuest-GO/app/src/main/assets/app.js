/* DexQuest GO v1.0. Standalone, offline-first tracker. No network calls. */
'use strict';
(() => {
  const POKEMON = Array.isArray(window.DEXQUEST_SPECIES) ? window.DEXQUEST_SPECIES : [];
  const KEY = 'dexquest.go.v1';
  const $ = id => document.getElementById(id);
  const byId = new Map(POKEMON.map(p => [p.id, p]));
  const safe = text => String(text ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const generations = ['','Kanto','Johto','Hoenn','Sinnoh','Unova','Kalos','Alola','Galar / Hisui','Paldea'];
  const limits = {min: 0, max: 1000000};
  const EXAMPLES = {
    1: ['Ivysaur',25], 2: ['Venusaur',100], 4: ['Charmeleon',25], 5: ['Charizard',100],
    7: ['Wartortle',25], 8: ['Blastoise',100], 10: ['Metapod',12], 13: ['Kakuna',12],
    16: ['Pidgeotto',12], 17: ['Pidgeot',50], 25: ['Raichu',50], 92: ['Haunter',25],
    93: ['Gengar',100], 129: ['Gyarados',400], 133: ['Vaporeon / Jolteon / Flareon',25],
    147: ['Dragonair',25], 148: ['Dragonite',100], 179: ['Flaaffy',25], 180: ['Ampharos',100],
    246: ['Pupitar',25], 247: ['Tyranitar',100], 252: ['Grovyle',25], 253: ['Sceptile',100],
    255: ['Combusken',25], 256: ['Blaziken',100], 258: ['Marshtomp',25], 259: ['Swampert',100],
    320: ['Wailord',400], 333: ['Altaria',400], 371: ['Shelgon',25], 372: ['Salamence',100],
    374: ['Metang',25], 375: ['Metagross',100], 387: ['Grotle',25], 388: ['Torterra',100],
    390: ['Monferno',25], 391: ['Infernape',100], 393: ['Prinplup',25], 394: ['Empoleon',100],
    443: ['Gabite',25], 444: ['Garchomp',100], 495: ['Servine',25], 496: ['Serperior',100],
    498: ['Pignite',25], 499: ['Emboar',100], 501: ['Dewott',25], 502: ['Samurott',100],
    650: ['Quilladin',25], 651: ['Chesnaught',100], 653: ['Braixen',25], 654: ['Delphox',100],
    656: ['Frogadier',25], 657: ['Greninja',100]
  }; // Illustrative, editable defaults only, not authoritative for all GO species/forms.
  let state = readState();
  let screen = 'home';
  let pageSize = {dex: 48, shiny: 48};
  let editId = null;
  let toastTimeout = null;

  function cleanIds(array) {
    return [...new Set((Array.isArray(array) ? array : []).filter(x => Number.isInteger(x) && x >= 1 && x <= POKEMON.length))].sort((a,b) => a-b);
  }
  function cleanGoals(array) {
    if (!Array.isArray(array)) return [];
    return array.slice(0,250).filter(x => x && typeof x === 'object' && Number.isInteger(x.speciesId) && byId.has(x.speciesId))
      .map((x,i) => ({
        id: typeof x.id === 'string' && x.id.length < 70 ? x.id : `restored-${i}`,
        speciesId: x.speciesId,
        target: String(x.target ?? '').slice(0,80),
        cost: Math.min(limits.max, Math.max(0, Number.isFinite(Number(x.cost)) ? Math.round(Number(x.cost)) : 0)),
        have: Math.min(limits.max, Math.max(0, Number.isFinite(Number(x.have)) ? Math.round(Number(x.have)) : 0)),
        note: String(x.note ?? '').slice(0,300)
      }));
  }
  function readState() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || '{}');
      return {caught: cleanIds(raw.caught), shiny: cleanIds(raw.shiny), goals: cleanGoals(raw.goals)};
    } catch (_) { return {caught:[],shiny:[],goals:[]}; }
  }
  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (error) { showToast('Unable to save local data. Export a backup.'); }
  }
  function showToast(text) {
    const el = $('toast'); el.textContent = text; el.classList.add('show');
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => el.classList.remove('show'), 3200);
  }
  function countSet(name) { return new Set(state[name]); }
  function setFlag(name, id) {
    const values = countSet(name);
    if (values.has(id)) values.delete(id); else values.add(id);
    if (name === 'shiny') {
      if (values.has(id)) state.caught = cleanIds([...state.caught,id]);
    } else if (!values.has(id) && state.shiny.includes(id)) {
      // A shiny is by definition caught; avoid contradictory states.
      values.add(id); showToast('Remove the shiny first to mark this species uncaught.');
    }
    state[name] = [...values].sort((a,b) => a-b);
    persist(); refresh();
  }
  function page(name) {
    if (!['home','dex','shiny','planner','storage','settings'].includes(name)) return;
    screen = name;
    document.querySelectorAll('.page').forEach(el => el.classList.toggle('active',el.id === `page-${name}`));
    document.querySelectorAll('[data-page]').forEach(el => el.classList.toggle('selected',el.dataset.page === name));
    const title = {home:'dashboard',dex:'national pokédex',shiny:'shiny collection',planner:'candy planner',storage:'storage cleaner',settings:'backup & settings'}[name];
    $('breadcrumb-page').textContent = title.toUpperCase();
    if (name === 'dex' || name === 'shiny') renderList(name);
    if (name === 'planner') renderGoals();
    if (name === 'storage') renderStorage();
    window.scrollTo(0,0);
  }
  window.dexquestGoBack = () => {
    if (screen !== 'home') { page('home'); return true; }
    return false;
  };
  function refresh() {
    stats();
    if (screen === 'dex' || screen === 'shiny') renderList(screen);
    if (screen === 'planner') renderGoals();
  }
  function stats() {
    const caught = countSet('caught'), shiny = countSet('shiny');
    $('stat-caught').innerHTML = `${caught.size} <small>/ ${POKEMON.length}</small>`;
    $('progress-caught').style.width = `${caught.size / POKEMON.length * 100}%`;
    $('stat-shiny').textContent = shiny.size;
    $('shiny-total').textContent = shiny.size;
    $('shiny-progress').textContent = `${(shiny.size / POKEMON.length * 100).toFixed(1)}%`;
    $('stat-goals').textContent = state.goals.length;
    $('stat-goals-foot').textContent = `${state.goals.filter(x=>x.have >= x.cost).length} ready based on entered candy`;
    const lines = [];
    for(let gen=1;gen<=9;gen++) {
      const all=POKEMON.filter(p=>p.gen===gen); const have=all.filter(p=>caught.has(p.id)).length;
      lines.push(`<div class="region-line"><div class="region-top"><span>${generations[gen]}</span><span>${have} / ${all.length}</span></div><div class="region-track"><div style="width:${have/all.length*100}%"></div></div></div>`);
    }
    $('region-progress').innerHTML = lines.join('');
  }
  function filtered(section) {
    const query = $(section+'-search').value.trim().toLocaleLowerCase('en-US');
    const gen = $(section+'-gen').value;
    const status = $(section+'-status').value;
    const caught = countSet('caught'), shiny = countSet('shiny');
    return POKEMON.filter(p => (gen === 'all' || +gen === p.gen) &&
      (!query || p.name.toLocaleLowerCase('en-US').includes(query) || String(p.id).includes(query.replace(/^#/,''))) &&
      (status === 'all' || (status === 'caught' && caught.has(p.id)) || (status === 'shiny' && shiny.has(p.id)) ||
      (status === 'missing' && !(section === 'shiny' ? shiny : caught).has(p.id))));
  }
  function card(p,caught,shiny) {
    const name=safe(p.name);const normal=caught.has(p.id), sparkle=shiny.has(p.id);
    const url=`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`;
    return `<article class="poke-card"><div class="poke-top"><div class="poke-sprite" aria-hidden="true"><span>${String(p.id).padStart(3,'0')}</span><img loading="lazy" alt="" data-sprite="${p.id}" src="${url}"></div><div><div class="poke-id">#${String(p.id).padStart(4,'0')}</div><div class="poke-name">${name}</div><div class="poke-region">${generations[p.gen]}</div></div></div><div class="poke-buttons"><button data-flag="caught" data-id="${p.id}" class="${normal?'active-caught':''}" aria-label="${normal?'Remove caught for':'Mark caught'} ${name}" aria-pressed="${normal}">✓ ${normal?'Caught':'Catch'}</button><button data-flag="shiny" data-id="${p.id}" class="${sparkle?'active-shiny':''}" aria-label="${sparkle?'Remove shiny for':'Mark shiny'} ${name}" aria-pressed="${sparkle}">✦ ${sparkle?'Shiny':'Shiny?'}</button></div></article>`;
  }
  function renderList(section) {
    const list=filtered(section);
    $(section+'-count').textContent=`${list.length} Pokémon`;
    const shown=list.slice(0,pageSize[section]);
    const grid=$(section+'-grid');
    const caught=countSet('caught'), shiny=countSet('shiny');
    grid.innerHTML = shown.length ? shown.map(p=>card(p,caught,shiny)).join('') : '<div class="empty">No Pokémon match this search.</div>';
    grid.querySelectorAll('img[data-sprite]').forEach(img=>{img.addEventListener('error',()=>{img.hidden=true;});});
    $(section+'-more').classList.toggle('hidden',shown.length>=list.length);
  }
  function normalizeName(s) { return String(s||'').trim().toLocaleLowerCase('en-US').replace(/[^a-z0-9]/g,''); }
  function speciesFromInput(raw) {
    const text=String(raw||'').trim();
    const num=/(?:#)(\d{1,4})/.exec(text);
    if (num && byId.has(+num[1])) return byId.get(+num[1]);
    if (/^\d+$/.test(text) && byId.has(+text)) return byId.get(+text);
    return POKEMON.find(p=>normalizeName(p.name)===normalizeName(text)) || null;
  }
  function exampleFor(id) {
    const ex=EXAMPLES[id];
    if(!ex) return;
    if(!$('goal-target').value.trim()) $('goal-target').value=ex[0];
    if(!$('goal-cost').value.trim()) $('goal-cost').value=ex[1];
  }
  function resetForm() {
    editId=null; $('goal-form').reset();$('goal-have').value='0';
    $('goal-form-title').textContent='New evolution goal';$('goal-submit').textContent='Add evolution goal';
    $('cancel-edit').classList.add('hidden');
  }
  function formSubmit(e) {
    e.preventDefault();
    const p=speciesFromInput($('goal-species').value);
    if (!p) { showToast('Choose a Pokémon from the suggested list or enter its Dex number.'); return; }
    const target=$('goal-target').value.trim();
    const cost=Number($('goal-cost').value), have=Number($('goal-have').value);
    if (!target || target.length>80 || !Number.isInteger(cost) || !Number.isInteger(have) || cost<0 || have<0 || cost>limits.max || have>limits.max) {
      showToast('Enter a valid target and Candy amounts (0–1,000,000).');return;
    }
    const goal={id:editId||`${Date.now()}-${Math.random().toString(36).slice(2,9)}`,speciesId:p.id,target,cost,have,note:$('goal-note').value.trim().slice(0,300)};
    if (editId) {state.goals=state.goals.map(x=>x.id===editId?goal:x);} else {
      if (state.goals.length>=250) {showToast('250 goals maximum — remove a goal first.');return;}
      state.goals.push(goal);
    }
    persist();resetForm();refresh();showToast('Evolution goal saved.');
  }
  function renderGoals() {
    const count=state.goals.length;
    $('goals-summary').textContent=count?`${count} goal${count===1?'':'s'} · ${state.goals.filter(x=>x.have>=x.cost).length} ready`:'No goals yet — add your first one';
    $('goals-list').innerHTML=count?state.goals.map(x=>{
      const p=byId.get(x.speciesId);const remaining=Math.max(0,x.cost-x.have),ready=remaining===0;
      return `<article class="goal-card"><div class="goal-head"><div><div class="goal-name">${safe(p.name)} → ${safe(x.target)}</div><div class="goal-sub">#${x.speciesId} · ${safe(generations[p.gen])}</div></div><span class="goal-tag ${ready?'ready':''}">${ready?'✓ Candy ready':`${remaining} needed`}</span></div><div class="goal-track"><div style="width:${x.cost===0?100:Math.min(100,x.have/x.cost*100)}%"></div></div><div class="goal-count"><span>${x.have} / ${x.cost} Candy</span><strong>${remaining ? `${remaining} to go` : 'Target reached'}</strong></div>${x.note?`<p class="goal-note">${safe(x.note)}</p>`:''}<div class="goal-controls"><button data-goal="add" data-goal-id="${safe(x.id)}">+10 Candy</button><button data-goal="edit" data-goal-id="${safe(x.id)}">Edit</button><button data-goal="remove" data-goal-id="${safe(x.id)}" class="danger">Remove</button></div></article>`;
    }).join(''):'<div class="panel-hint">Tip: start with Magikarp → Gyarados. You can add any Pokémon and edit the cost shown in your game.</div>';
  }
  function onGoalAction(action, id) {
    const x=state.goals.find(g=>g.id===id);if(!x)return;
    if(action==='add') {x.have=Math.min(limits.max,x.have+10);persist();refresh();}
    if(action==='remove') {if(!confirm(`Remove goal for ${byId.get(x.speciesId).name}?`))return;state.goals=state.goals.filter(g=>g.id!==id);persist();resetForm();refresh();}
    if(action==='edit') {
      editId=id;$('goal-species').value=byId.get(x.speciesId).name;$('goal-target').value=x.target;
      $('goal-cost').value=x.cost;$('goal-have').value=x.have;$('goal-note').value=x.note;
      $('goal-form-title').textContent='Edit evolution goal';$('goal-submit').textContent='Save changes';
      $('cancel-edit').classList.remove('hidden');$('goal-form').scrollIntoView({behavior:'smooth',block:'start'});
    }
  }
  const EXCLUDE = ['shiny','legendary','mythical','lucky','favorite','shadow','costume','defender'];
  function storageText() {
    const t=[];
    if($('storage-recent').checked) t.push('age0');
    if($('storage-low').checked) t.push('!3*','!4*');
    EXCLUDE.forEach(name=>{if($('ex-'+name).checked)t.push('!'+name);});
    // GO '&' means AND, '!' excludes; conjunctive negatives avoid ambiguous OR grouping.
    return t.length?t.join('&'):'age0';
  }
  function renderStorage() { $('storage-query').textContent=storageText(); }
  async function copyText(value) {
    try {
      if (window.AndroidDexQuest && typeof window.AndroidDexQuest.copyText==='function') {
        window.AndroidDexQuest.copyText(value);showToast('Copied to clipboard.');return;
      }
      if(navigator.clipboard && navigator.clipboard.writeText) {await navigator.clipboard.writeText(value);showToast('Copied to clipboard.');return;}
      const box=document.createElement('textarea');box.value=value;document.body.appendChild(box);box.select();
      const worked=document.execCommand('copy');box.remove();showToast(worked?'Copied to clipboard.':'Long-press the result to copy.');
    }catch(_){showToast('Could not copy. Select the text and copy it manually.');}
  }
  function shareText(value) {
    if(window.AndroidDexQuest && typeof window.AndroidDexQuest.shareText==='function'){
      window.AndroidDexQuest.shareText(value);return;
    }
    if(navigator.share) navigator.share({text:value}).catch(()=>{});
    else copyText(value);
  }
  function exportData() {
    const body=JSON.stringify({app:'DexQuestGO',version:1,exportedAt:new Date().toISOString(),caught:state.caught,shiny:state.shiny,goals:state.goals},null,2);
    if(window.AndroidDexQuest && typeof window.AndroidDexQuest.exportJson==='function'){
      window.AndroidDexQuest.exportJson('dexquest-go-backup.json',body);return;
    }
    const blob=new Blob([body],{type:'application/json'}),url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download='dexquest-go-backup.json';document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);showToast('Backup download started.');
  }
  function validateImported(raw) {
    if(!raw || raw.app!=='DexQuestGO' || raw.version!==1 || !Array.isArray(raw.caught) || !Array.isArray(raw.shiny) || !Array.isArray(raw.goals)) throw Error('Not a DexQuest GO v1 backup.');
    if(raw.caught.length>POKEMON.length || raw.shiny.length>POKEMON.length || raw.goals.length>250) throw Error('Backup exceeds supported limits.');
    if (![...raw.caught,...raw.shiny].every(n=>Number.isInteger(n)&&n>=1&&n<=POKEMON.length)) throw Error('Invalid Pokémon number in backup.');
    if (!raw.goals.every(g=>g && Number.isInteger(g.speciesId)&&byId.has(g.speciesId)&&typeof g.target==='string'&&g.target.length<=80 && Number.isInteger(g.cost)&&g.cost>=0&&g.cost<=limits.max && Number.isInteger(g.have)&&g.have>=0&&g.have<=limits.max && (g.note===undefined||(typeof g.note==='string'&&g.note.length<=300)))) throw Error('Invalid Candy goal in backup.');
    const shiny=cleanIds(raw.shiny);
    return {caught:cleanIds([...raw.caught,...shiny]),shiny,goals:cleanGoals(raw.goals)};
  }
  async function importFile(event) {
    const file=event.target.files && event.target.files[0];if(!file)return;
    try {
      if(file.size>1024*1024) throw Error('Backup is larger than 1 MB.');
      const imported=validateImported(JSON.parse(await file.text()));
      if(!confirm(`Import ${imported.caught.length} caught species, ${imported.shiny.length} shinies and ${imported.goals.length} Candy goals? This REPLACES your current DexQuest GO data.`))return;
      state=imported;persist();resetForm();stats();renderGoals();showToast('DexQuest GO backup restored.');
    } catch(error) {alert('Import failed: '+error.message);}
    finally {event.target.value='';}
  }
  function resetStorage() {
    $('storage-low').checked=true;$('storage-recent').checked=false;
    EXCLUDE.forEach(name=>{$('ex-'+name).checked=true;});renderStorage();
  }
  function bind() {
    document.addEventListener('click',event=>{
      const button=event.target.closest('button');if(!button)return;
      if(button.dataset.page){page(button.dataset.page);return;}
      if(button.dataset.flag){setFlag(button.dataset.flag,+button.dataset.id);return;}
      if(button.dataset.goal){onGoalAction(button.dataset.goal,button.dataset.goalId);return;}
      if(button.dataset.query){copyText(button.dataset.query);return;}
    });
    for(const section of ['dex','shiny']){
      for(const suffix of ['search','gen','status']) {
        $(section+'-'+suffix).addEventListener(suffix==='search'?'input':'change',()=>{pageSize[section]=48;renderList(section);});
      }
      $(section+'-more').addEventListener('click',()=>{pageSize[section]+=48;renderList(section);});
    }
    $('goal-species').addEventListener('change',()=>{const p=speciesFromInput($('goal-species').value);if(p && editId===null) exampleFor(p.id);});
    $('goal-form').addEventListener('submit',formSubmit);
    $('cancel-edit').addEventListener('click',resetForm);
    ['storage-low','storage-recent',...EXCLUDE.map(x=>'ex-'+x)].forEach(id=>$(id).addEventListener('change',renderStorage));
    $('storage-reset').addEventListener('click',resetStorage);
    $('copy-query').addEventListener('click',()=>copyText(storageText()));
    $('share-query').addEventListener('click',()=>shareText(storageText()));
    $('export-button').addEventListener('click',exportData);
    $('import-button').addEventListener('click',()=> $('import-file').click());
    $('import-file').addEventListener('change',importFile);
    $('reset-button').addEventListener('click',()=>{
      if(!confirm('Delete ALL local DexQuest GO progress? This cannot be undone without a JSON backup.'))return;
      state={caught:[],shiny:[],goals:[]};persist();resetForm();stats();renderGoals();showToast('Local GO progress cleared.');
    });
  }
  function init() {
    if(POKEMON.length!==1025) {alert('DexQuest GO species data is missing.');return;}
    $('species-options').innerHTML=POKEMON.map(p=>`<option value="${safe(p.name)} (#${p.id})"></option>`).join('');
    // Correct any older backup with a shiny marked but an unset caught mark.
    state.caught=cleanIds([...state.caught,...state.shiny]);
    bind();stats();renderStorage();renderGoals();page('home');
  }
  init();
})();