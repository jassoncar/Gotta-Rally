const $ = id => document.getElementById(id);
const fmt = n => new Intl.NumberFormat('es-NI',{maximumFractionDigits:2}).format(Number(n)||0);
const money = n => `C$ ${Number(n||0).toLocaleString('es-NI',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const esc = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function api(url, options={}) { const res=await fetch(url,{headers:{'Content-Type':'application/json',...(options.headers||{})},...options}); const data=await res.json().catch(()=>({})); if(!res.ok) throw new Error(data.error||'Ocurrió un error en la solicitud.'); return data; }
const currentPage = location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('[data-page]').forEach(a=>{if(a.dataset.page===currentPage)a.classList.add('active')});
(async()=>{try{await api('/api/health');if($('apiStatus')){ $('apiStatus').textContent='● API conectada';$('apiStatus').style.color='#81e6bd';}}catch{if($('apiStatus')){$('apiStatus').textContent='● Error de conexión';$('apiStatus').style.color='#ffaaaa';}}})();
function showNotice(el,message,type='ok'){el.textContent=message;el.className=`notice show ${type}`;}
function hideNotice(el){if(el)el.className='notice';}
