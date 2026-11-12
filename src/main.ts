import {createIcons, Search, Sparkles, ChartNoAxesColumnIncreasing, Quote, ArrowUpRight, ArrowRight, Copy, Check, LoaderCircle, CircleAlert, ExternalLink, CodeXml, X} from 'lucide';
import './style.css';
type Mode = 'gp'|'ngram'|'example';
const modes: Mode[]=['gp','ngram','example'];
const names={gp:'文法搭配',ngram:'詞組頻率',example:'例句'};
const defaults={gp:'ability to',ngram:'ability to v.',example:'ability to make'};
const state:Record<Mode,{query:string;data:unknown;error:string}>={gp:{query:defaults.gp,data:null,error:''},ngram:{query:defaults.ngram,data:null,error:''},example:{query:defaults.example,data:null,error:''}};
let mode:Mode='gp',controller:AbortController|undefined,busy=false;
const icon=(name:string)=>`<i data-lucide="${name}" aria-hidden="true"></i>`;
const esc=(s:unknown)=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const app=document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML=`<main><header><a class="brand" href="./">${icon('sparkles')}<span>Linggle</span></a><a class="icon-button" href="https://github.com/weifish0/linggle-lab" aria-label="GitHub" title="GitHub">${icon('code-xml')}</a></header><section class="workspace"><div class="toolbar"><div role="tablist" aria-label="API">${modes.map((m,i)=>`<button id="tab-${m}" role="tab" aria-controls="results" aria-selected="${i===0}" tabindex="${i===0?0:-1}" data-mode="${m}" title="${names[m]}" aria-label="${names[m]}">${icon(['sparkles','chart-no-axes-column-increasing','quote'][i])}</button>`).join('')}</div><a class="icon-button source" href="https://search.linggle.com/" target="_blank" rel="noopener" aria-label="Linggle" title="Linggle">${icon('external-link')}</a></div><form><label class="sr-only" for="query">查詢</label><input id="query" autocomplete="off" spellcheck="false" maxlength="240" placeholder="ability to" required><button type="button" class="clear icon-button" aria-label="清除" title="清除">${icon('x')}</button><button class="submit" aria-label="搜尋" title="搜尋">${icon('arrow-right')}</button></form><div class="result-meta"><span id="count" aria-label="結果筆數"></span></div><div id="results" role="tabpanel" aria-labelledby="tab-gp" tabindex="0"></div><div id="announcement" class="sr-only" role="status" aria-live="polite"></div></section></main>`;
const input=document.querySelector<HTMLInputElement>('#query')!;
const results=document.querySelector<HTMLDivElement>('#results')!;
const icons=()=>createIcons({icons:{Search,Sparkles,ChartNoAxesColumnIncreasing,Quote,ArrowUpRight,ArrowRight,Copy,Check,LoaderCircle,CircleAlert,ExternalLink,CodeXml,X}});
function setMode(next:Mode){
 state[mode].query=input.value; controller?.abort();busy=false;mode=next;
 input.value=state[mode].query;input.placeholder=defaults[mode];
 document.querySelectorAll<HTMLButtonElement>('[role=tab]').forEach(b=>{const active=b.dataset.mode===mode;b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1});
 results.setAttribute('aria-labelledby',`tab-${mode}`);render();
}
function render(){
 const s=state[mode];document.querySelector('#count')!.textContent='';results.setAttribute('aria-busy',String(busy));
 const submit=document.querySelector<HTMLButtonElement>('.submit')!;submit.disabled=busy;submit.innerHTML=icon(busy?'loader-circle':'arrow-right');submit.classList.toggle('loading',busy);
 if(busy) results.innerHTML=`<div class="empty loading">${icon('loader-circle')}</div>`;
 else if(s.error)results.innerHTML=`<div class="error">${icon('circle-alert')}<span>${esc(s.error)}</span><button class="icon-button retry" aria-label="重試" title="重試">${icon('arrow-right')}</button></div>`;
 else if(s.data===null)results.innerHTML=`<div class="empty"><button class="sample icon-button" aria-label="試試 ${esc(defaults[mode])}" title="試試 ${esc(defaults[mode])}">${icon('arrow-up-right')}</button></div>`;
 else {
  const data:any=s.data;
  const rows:any[]=mode==='gp'?data:mode==='ngram'?data.ngrams:data.examples;
  document.querySelector('#count')!.textContent=String(rows.length);
  if(!rows.length)results.innerHTML='<div class="empty">查無結果</div>';
  else if(mode==='gp')results.innerHTML=`<div class="suggestions">${rows.map((r,i)=>`<button class="suggestion" data-query="${esc(r[1])}"><span class="row-index">${String(i+1).padStart(2,'0')}</span><span><strong>${esc(r[0])}</strong>${r[2]?`<small>${esc(r[2])}</small>`:''}</span>${icon('arrow-up-right')}</button>`).join('')}</div>`;
  else if(mode==='ngram'){
   const total=rows.reduce((sum,r)=>sum+Number(r[1]),0);
   results.innerHTML=`<div class="table-head"><span>Phrase</span><span>%</span><span>Count</span><span></span></div>${rows.map(r=>{const pct=total?Number(r[1])/total*100:0;return `<button class="phrase" data-phrase="${esc(r[0])}"><span class="phrase-word">${esc(r[0])}<span class="bar" style="--width:${pct}%"></span></span><span>${pct.toFixed(1)}</span><span>${Number(r[1]).toLocaleString()}</span>${icon('arrow-up-right')}</button>`}).join('')}`;
  } else results.innerHTML=`<ol class="examples">${rows.map((r,i)=>`<li><span class="row-index">${String(i+1).padStart(2,'0')}</span><p>${highlight(r,s.query)}</p><button class="icon-button copy" data-text="${esc(r)}" title="複製" aria-label="複製例句 ${i+1}">${icon('copy')}</button></li>`).join('')}</ol>`;
 }
 icons();
}
function highlight(text:string,term:string){const index=text.toLowerCase().indexOf(term.toLowerCase());return index<0?esc(text):esc(text.slice(0,index))+'<mark>'+esc(text.slice(index,index+term.length))+'</mark>'+esc(text.slice(index+term.length));}
async function search(){
 const q=input.value.trim();if(!q){input.focus();return;}controller?.abort();const current=new AbortController();controller=current;
 const requestedMode=mode;state[mode].query=q;state[mode].error='';busy=true;render();
 const timeout=setTimeout(()=>current.abort('timeout'),25000);
 try{
  const url=new URL('https://linggle-api-bridge.vercel.app/api/query');url.searchParams.set('kind',requestedMode);if(requestedMode!=='example')url.searchParams.set('q',q);
  const res=await fetch(url,{signal:current.signal,...(requestedMode==='example'?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ngram:q})}:{})});
  if(!res.ok)throw Error(`連線失敗 (${res.status})，請重試`);
  const data=await res.json();
  if(requestedMode==='gp' ? !Array.isArray(data) || !data.every((r:any)=>Array.isArray(r)&&typeof r[0]==='string'&&typeof r[1]==='string') : requestedMode==='ngram' ? !Array.isArray(data.ngrams) || !data.ngrams.every((r:any)=>Array.isArray(r)&&typeof r[0]==='string'&&typeof r[1]==='number') : !Array.isArray(data.examples)||!data.examples.every((r:any)=>typeof r==='string'))throw Error('回傳格式異常，請重試');
  state[requestedMode].data=data;document.querySelector('#announcement')!.textContent='查詢完成';
 }catch(e){if(!current.signal.aborted||current.signal.reason==='timeout')state[requestedMode].error=current.signal.reason==='timeout'?'連線逾時，請重試':e instanceof Error?e.message:'連線失敗，請重試';}
 finally{clearTimeout(timeout);if(controller===current){busy=false;render();}}
}
document.querySelector('form')!.addEventListener('submit',e=>{e.preventDefault();void search()});
document.querySelector('.clear')!.addEventListener('click',()=>{input.value='';input.focus()});
document.querySelector('[role=tablist]')!.addEventListener('keydown',(e)=>{const k=e as KeyboardEvent;let i=modes.indexOf(mode);if(k.key==='ArrowRight')i=(i+1)%3;else if(k.key==='ArrowLeft')i=(i+2)%3;else if(k.key==='Home')i=0;else if(k.key==='End')i=2;else return;k.preventDefault();setMode(modes[i]);document.querySelector<HTMLButtonElement>(`#tab-${mode}`)!.focus()});
app.addEventListener('click',async e=>{const b=(e.target as HTMLElement).closest<HTMLButtonElement>('button');if(!b)return;if(b.dataset.mode)setMode(b.dataset.mode as Mode);else if(b.classList.contains('sample')){input.value=defaults[mode];await search()}else if(b.classList.contains('retry'))await search();else if(b.dataset.query){setMode('ngram');input.value=b.dataset.query;await search()}else if(b.dataset.phrase){setMode('example');input.value=b.dataset.phrase;await search()}else if(b.dataset.text){try{await navigator.clipboard.writeText(b.dataset.text);b.innerHTML=icon('check');icons();setTimeout(()=>{b.innerHTML=icon('copy');icons()},1500)}catch{document.querySelector('#announcement')!.textContent='無法複製，請選取例句複製'}}});
setMode('gp');
