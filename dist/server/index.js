const sandbox = (() => {
const html = `<!doctype html>
<html lang="fa" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>کوت دیجیتال | آزمایش اتصال</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#0c1423;color:#ecf1fa;font:16px/1.9 Tahoma,Arial,sans-serif}main{max-width:880px;margin:auto;padding:56px 24px}header{border-bottom:1px solid #334156;padding-bottom:28px;margin-bottom:28px}.brand{color:#62d9ce;letter-spacing:3px;font:700 18px Arial}h1{font-size:clamp(26px,5vw,40px);line-height:1.6}p{color:#bbc8db}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px}.card{padding:24px;background:#162136;border:1px solid #334156;border-radius:16px}h2{font-size:19px}button{background:#62d9ce;color:#0c1423;border:0;border-radius:8px;padding:12px 20px;font:700 15px Tahoma;cursor:pointer}button:disabled{opacity:.5}button:focus-visible,a:focus-visible{outline:3px solid white;outline-offset:4px}pre{white-space:pre-wrap;overflow-wrap:anywhere;direction:ltr;text-align:left;background:#08101c;padding:20px;border-radius:12px;min-height:100px}a{color:#62d9ce}.note{font-size:14px}footer{margin-top:28px}
</style><main>
<header><div class="brand" dir="ltr">KOT DIGITAL / SANDBOX</div><h1>محیط آزمایش اتصال</h1><p>یک نشانی ثابت برای بررسی سلامت و دریافت وب‌هوک آزمایشی. این صفحه به سرویس‌های واقعی سایت‌ساز متصل نیست.</p></header>
<div class="grid"><section class="card"><h2>سلامت محیط</h2><p>پاسخ واقعی سرور و زمان پاسخ را بررسی کنید.</p><button data-test="health">بررسی سلامت</button></section>
<section class="card"><h2>وب‌هوک آزمایشی</h2><p>یک پیام ساختگی ارسال کنید. محتوای پیام ذخیره نمی‌شود.</p><button data-test="webhook">ارسال پیام آزمایشی</button></section></div>
<h2>نتیجهٔ آخرین آزمون</h2><div id="status" role="status" aria-live="polite">هنوز آزمونی اجرا نشده است.</div><pre id="result">—</pre>
<p class="note">دسترسی این محیط خصوصی است. اتصال سرویس‌های بیرونی به احراز هویت و پیکربندی جداگانه نیاز دارد. کلید، رمز و اطلاعات مشتری را در پیام آزمایشی وارد نکنید.</p>
<footer><a href="https://github.com/kot587/kot-digital" target="_blank" rel="noopener noreferrer">مخزن کد و راهنمای محیط</a></footer>
</main><script>
const buttons=document.querySelectorAll('button');
for(const button of buttons) button.addEventListener('click',async()=>{
 buttons.forEach(b=>b.disabled=true);
 const status=document.querySelector('#status'),result=document.querySelector('#result');
 status.textContent='در حال بررسی…'; result.textContent='—';
 const start=performance.now();
 try{
  const webhook=button.dataset.test==='webhook';
  const response=await fetch(webhook?'/mock/webhook':'/health',webhook?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({test:true,source:'kot-sandbox'})}:{});
  const data=await response.json();
  status.textContent=(response.ok?'آزمون موفق بود':'آزمون ناموفق بود')+' · '+Math.round(performance.now()-start)+' ms';
  result.textContent=JSON.stringify({http_status:response.status,...data},null,2);
 }catch(error){status.textContent='دریافت پاسخ معتبر ممکن نشد؛ اتصال یا ورود به حساب را بررسی کنید.';result.textContent='Request failed';}
 finally{buttons.forEach(b=>b.disabled=false);}
});
</script></html>`;

function json(data, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
}

return {
  async fetch(request) {
    const path = new URL(request.url).pathname;
    if (request.method === 'GET' && path === '/') {
      return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' } });
    }
    if (request.method === 'GET' && path === '/health') {
      return json({ status: 'ok', service: 'kot-digital', mode: 'sandbox' });
    }
    if (request.method === 'POST' && path === '/mock/webhook') {
      if (!(request.headers.get('Content-Type') || '').toLowerCase().startsWith('application/json')) return json({ error: 'json_required' }, 415);
      const reader = request.body?.getReader();
      if (!reader) return json({ error: 'invalid_json' }, 400);
      let size = 0;
      const chunks = [];
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          size += value.byteLength;
          if (size > 65536) { await reader.cancel(); return json({ error: 'body_size' }, 413); }
          chunks.push(value);
        }
        const body = new Uint8Array(size);
        let offset = 0;
        for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
        JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(body));
      } catch { return json({ error: 'invalid_json' }, 400); }
      return json({ received: true, mode: 'sandbox', stored: false });
    }
    return json({ error: 'not_found' }, 404);
  }
};

})();
const appHTML = `<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>کارخانهٔ سایت‌سازی کوت دیجیتال</title><style>
*{box-sizing:border-box}body{margin:0;background:#f5f5f3;color:#17191d;font:15px/1.9 Tahoma,Arial,sans-serif}button,input,textarea,select{font:inherit}button,a,input,select,textarea{outline-offset:3px}button:focus-visible,a:focus-visible,input:focus-visible,textarea:focus-visible,select:focus-visible{outline:3px solid #2458c9}button{cursor:pointer;border:1px solid #d3d4d7;border-radius:8px;background:white;padding:10px 16px;color:#17191d}button.primary{background:#bd2835;color:white;border-color:#bd2835}button:disabled{opacity:.5;cursor:wait}header{background:#fff;border-bottom:1px solid #ddd;padding:22px 4vw;display:flex;justify-content:space-between;gap:20px;align-items:center;flex-wrap:wrap}.brand{font:800 24px Arial;letter-spacing:3px}small,.muted{color:#60656f}.badge{font-size:12px;border:1px solid #ddd;padding:4px 10px;border-radius:20px}main{padding:28px 4vw;max-width:1500px;margin:auto}h1{font-size:clamp(24px,4vw,36px);margin:8px 0}h2{font-size:19px}.intro{margin-bottom:24px}.layout{display:grid;grid-template-columns:230px minmax(0,1fr);gap:22px}.panel{background:white;border:1px solid #ddd;border-radius:14px;padding:22px}.editor{display:grid;grid-template-columns:minmax(260px,1fr) minmax(300px,1.2fr);gap:24px}.projects{display:flex;flex-direction:column;gap:8px;margin-top:16px}.projects button{text-align:right;overflow-wrap:anywhere}.projects button[aria-current=true]{border-color:#bd2835;background:#fff3f3}.field{display:block;margin-bottom:15px}.field span{display:block;font-weight:bold;margin-bottom:5px}input,select,textarea{width:100%;padding:10px;border:1px solid #cbd0d7;border-radius:7px;background:white;color:#17191d}textarea{resize:vertical;min-height:90px}.row{display:grid;grid-template-columns:1fr 1fr;gap:12px}.actions{display:flex;gap:10px;flex-wrap:wrap;margin:18px 0}.previewbar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:12px}iframe{background:white;border:1px solid #ddd;border-radius:10px;width:100%;height:650px;display:block;margin:auto}.previewwrap{overflow:auto}#status{padding:12px 16px;background:#fff;border:1px solid #ddd;border-radius:8px;margin:18px 0;overflow-wrap:anywhere}#status.error{border-color:#bd2835;color:#9b1723}.empty{color:#60656f;font-size:14px}footer{padding:25px 4vw;color:#60656f}a{color:#9b1723}.danger{color:#a31e2a}.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}@media(max-width:1100px){.editor{grid-template-columns:1fr}.layout{grid-template-columns:200px minmax(0,1fr)}}@media(max-width:700px){.layout{grid-template-columns:1fr}.row{grid-template-columns:1fr}.panel{padding:16px}main{padding:20px 14px}iframe{height:520px}}
</style></head><body><header><div><div class="brand" dir="ltr">KOT DIGITAL<span style="color:#bd2835">••</span></div><small>کارخانهٔ سایت‌سازی</small></div><div class="badge">پنل خصوصی · نسخهٔ اولیه</div></header><main><div class="intro"><h1>از یک ایده، به یک سایت قابل تحویل</h1><p class="muted">قالب را انتخاب کنید، محتوای واقعی را بنویسید و خروجی مستقل HTML بگیرید.</p></div><div id="status" role="status" aria-live="polite">در حال بررسی ذخیره‌سازی…</div><div class="layout"><aside class="panel"><button id="new" class="primary">+ پروژهٔ جدید</button><h2>پروژه‌های ذخیره‌شده</h2><small>۱۰۰ پروژهٔ اخیر</small><div id="projects" class="projects"></div><button id="refresh" style="margin-top:16px">تازه‌سازی فهرست</button></aside><section class="panel"><div class="editor"><form id="editor"><h2 id="editorTitle">پروژهٔ جدید</h2><label class="field"><span>قالب</span><select name="template"><option value="business">شرکتی و خدماتی</option><option value="portfolio">شخصی و نمونه‌کار</option><option value="restaurant">رستوران و کافه</option></select></label><label class="field"><span>نام پروژه / کسب‌وکار</span><input name="name" required maxlength="100" placeholder="نام کسب‌وکار شما"></label><label class="field"><span>عنوان اصلی سایت</span><input name="title" required maxlength="160" placeholder="پیام اصلی شما برای مخاطب"></label><label class="field"><span>توضیح کوتاه</span><textarea name="subtitle" maxlength="600"></textarea></label><label class="field"><span>دربارهٔ کسب‌وکار</span><textarea name="about" maxlength="4000"></textarea></label><label class="field"><span>خدمات یا موارد منو — هر مورد در یک خط</span><textarea name="services" maxlength="2000"></textarea></label><div class="row"><label class="field"><span>تلفن</span><input name="phone" dir="ltr" maxlength="40" type="tel"></label><label class="field"><span>ایمیل</span><input name="email" dir="ltr" type="email" maxlength="160"></label></div><div class="row"><label class="field"><span>متن دکمهٔ تماس</span><input name="cta" maxlength="80" value="ارتباط با ما"></label><label class="field"><span>رنگ اصلی</span><input name="color" type="color" value="#bd2835"></label></div><div class="actions"><button type="submit" class="primary">ذخیره در سرور</button><button type="button" id="preview">به‌روزرسانی پیش‌نمایش</button><button type="button" id="download">دریافت فایل سایت</button><button type="button" id="backup">پشتیبان JSON</button><button type="button" id="import">بازیابی پشتیبان</button></div><input type="file" id="importFile" accept="application/json,.json" hidden><button type="button" id="delete" class="danger" hidden>حذف پروژه</button><p class="muted">خروجی یک سایت ثابت است. فرم دریافت پیام، پرداخت، فروشگاه و تولید با هوش مصنوعی در این نسخه فعال نیست. انتشار عمومی پس از تأیید شما و انتخاب میزبان انجام می‌شود.</p></form><div><div class="previewbar"><h2 style="margin-inline-end:auto">پیش‌نمایش سایت</h2><button id="desktop">تمام عرض</button><button id="mobile">موبایل ۳۹۰</button></div><div class="previewwrap"><iframe id="frame" title="پیش‌نمایش سایت شما" sandbox=""></iframe></div><small>پیش‌نمایش از همان HTML خروجی ساخته می‌شود.</small></div></div></section></div></main><footer><a href="/sandbox">آزمایش سلامت و وب‌هوک</a> · <a href="https://github.com/kot587/kot-digital" target="_blank" rel="noopener noreferrer">کد و راهنما</a></footer><script type="module" src="/app.js"></script></body></html>`;

const clientJS = `
const $=s=>document.querySelector(s),form=$('#editor');
let current=null,revision=null,dirty=false,busy=false;
const keys=['template','name','title','subtitle','about','services','phone','email','cta','color'];
function message(text,error=false){$('#status').textContent=text;$('#status').classList.toggle('error',error)}
function data(){return Object.fromEntries(keys.map(k=>[k,form.elements[k].value]))}
function fill(project){for(const k of keys)form.elements[k].value=project[k]??(k==='color'?'#bd2835':k==='template'?'business':'');dirty=false}
function setCurrent(id,updated){current=id;revision=updated;$('#delete').hidden=!id;$('#editorTitle').textContent=id?'ویرایش پروژه':'پروژهٔ جدید'}
async function api(path,options={}){const response=await fetch(path,{...options,headers:{'Content-Type':'application/json','X-KOT-Client':'factory',...options.headers}});let result;try{result=await response.json()}catch{throw Error('پاسخ سرور معتبر نیست؛ وضعیت ورود به حساب را بررسی کنید.')}if(!response.ok)throw Error(result.message||'انجام درخواست ممکن نشد.');return result}
async function lock(action){if(busy)return;busy=true;document.querySelectorAll('button').forEach(b=>b.disabled=true);try{await action()}catch(e){message(e.message,true)}finally{busy=false;document.querySelectorAll('button').forEach(b=>b.disabled=false)}}
async function list(){const result=await api('/api/projects');const container=$('#projects');container.replaceChildren();if(!result.projects.length){const p=document.createElement('p');p.className='empty';p.textContent='هنوز پروژه‌ای ذخیره نشده است.';container.append(p)}for(const p of result.projects){const b=document.createElement('button');b.textContent=p.name;b.setAttribute('aria-current',String(p.id===current));b.onclick=()=>lock(async()=>{if(dirty&&!confirm('تغییرهای ذخیره‌نشده کنار گذاشته شوند؟'))return;const saved=await api('/api/projects/'+p.id);fill(saved.project);setCurrent(p.id,saved.updated_at);await preview();await list();message('پروژه از سرور بازیابی شد.');});container.append(b)}}
async function preview(){if(!form.reportValidity())throw Error('نام پروژه و عنوان سایت را تکمیل کنید.');const result=await api('/api/render',{method:'POST',body:JSON.stringify(data())});$('#frame').srcdoc=result.html;return result.html}
function download(text,type,name){const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
form.addEventListener('input',()=>dirty=true);
form.addEventListener('submit',e=>{e.preventDefault();lock(async()=>{if(!form.reportValidity())return;const result=await api('/api/projects'+(current?'/'+current:''),{method:current?'PUT':'POST',body:JSON.stringify({...data(),expected_updated_at:revision})});setCurrent(result.id,result.updated_at);dirty=false;await preview();await list();message('پروژه با موفقیت در سرور ذخیره شد.');});});
$('#new').onclick=()=>lock(async()=>{if(dirty&&!confirm('تغییرهای ذخیره‌نشده کنار گذاشته شوند؟'))return;form.reset();setCurrent(null,null);dirty=false;$('#frame').srcdoc='';await list();message('پروژهٔ جدید آمادهٔ ویرایش است.');});
$('#refresh').onclick=()=>lock(async()=>{await list();message('فهرست پروژه‌ها تازه شد.');});
$('#preview').onclick=()=>lock(async()=>{await preview();message('پیش‌نمایش به‌روز شد.');});
$('#download').onclick=()=>lock(async()=>{const html=await preview();download(html,'text/html;charset=utf-8','index.html');message('فایل سایت دریافت شد؛ انتشار عمومی هنوز انجام نشده است.');});
$('#backup').onclick=()=>{download(JSON.stringify({version:1,project:data()},null,2),'application/json','kot-project.json');message('پشتیبان پروژه دریافت شد.');};
$('#import').onclick=()=>$('#importFile').click();
$('#importFile').onchange=()=>lock(async()=>{const file=$('#importFile').files[0];if(!file)return;if(file.size>32768)throw Error('حجم پشتیبان بیش از حد مجاز است.');if(dirty&&!confirm('تغییرهای ذخیره‌نشده کنار گذاشته شوند؟'))return;let backup;try{backup=JSON.parse(await file.text())}catch{throw Error('فایل JSON معتبر نیست.')}if(backup.version!==1||!backup.project)throw Error('ساختار پشتیبان پشتیبانی نمی‌شود.');const result=await api('/api/render',{method:'POST',body:JSON.stringify(backup.project)});fill(backup.project);setCurrent(null,null);dirty=true;$('#frame').srcdoc=result.html;message('پشتیبان بازیابی شد؛ برای نگهداری در سرور، ذخیره را بزنید.');$('#importFile').value='';});
$('#delete').onclick=()=>lock(async()=>{if(!current||!confirm('این پروژه از سرور حذف شود؟ ابتدا پشتیبان بگیرید.'))return;await api('/api/projects/'+current,{method:'DELETE',body:JSON.stringify({expected_updated_at:revision})});form.reset();setCurrent(null,null);dirty=false;$('#frame').srcdoc='';await list();message('پروژه حذف شد.');});
$('#mobile').onclick=()=>$('#frame').style.width='390px';$('#desktop').onclick=()=>$('#frame').style.width='100%';
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue=''}});
lock(async()=>{const health=await api('/api/status');if(!health.storage_ready)throw Error('ذخیره‌سازی سرور هنوز فعال نیست؛ پیش‌نمایش و دریافت فایل در دسترس است.');await list();message('محیط آماده است؛ پروژه‌ها در سرور ذخیره می‌شوند.');});
`;

const templates = ['business', 'portfolio', 'restaurant'];
function cleanProject(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('invalid_project');
  const result = {};
  for (const [key, max] of Object.entries({name:100,title:160,subtitle:600,about:4000,services:2000,phone:40,email:160,cta:80})) {
    if (input[key] !== undefined && typeof input[key] !== 'string') throw new Error('invalid_' + key);
    result[key] = (input[key] || '').trim();
    if (result[key].length > max) throw new Error('too_long_' + key);
  }
  if (!result.name || !result.title) throw new Error('name_and_title_required');
  if (!templates.includes(input.template)) throw new Error('invalid_template');
  result.template = input.template;
  result.phone=result.phone.replace(/[۰-۹]/g,c=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(c))).replace(/[٠-٩]/g,c=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(c)));
  if (result.phone && !/^[+\d\s()-]{3,40}$/.test(result.phone)) throw new Error('invalid_phone');
  if (result.email && !/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(result.email)) throw new Error('invalid_email');
  if (!/^#[0-9a-fA-F]{6}$/.test(input.color || '')) throw new Error('invalid_color');
  result.color = input.color;
  return result;
}
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function renderSite(project) {
  const p = cleanProject(project), e = escapeHTML;
  const services = p.services.split('\n').map(x=>x.trim()).filter(Boolean);
  const label = {business:'خدمات ما',portfolio:'تخصص و تجربه',restaurant:'انتخاب‌های منو'}[p.template];
  const rgb=p.color.slice(1).match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=0.04045?x/12.92:((x+0.055)/1.055)**2.4);
  const foreground=rgb[0]*0.2126+rgb[1]*0.7152+rgb[2]*0.0722>0.179?'#111':'#fff';
  return `<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${e(p.subtitle.slice(0,160))}"><title>${e(p.title)}</title><style>
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:#fff;color:#17191d;font:16px/2 Tahoma,Arial,sans-serif}a{color:inherit}nav,main,footer{max-width:1100px;margin:auto;padding:24px}nav{display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap;border-bottom:1px solid #ddd}nav div{display:flex;gap:20px}.hero{padding:80px 0 64px;max-width:850px}h1{font-size:clamp(32px,6vw,64px);line-height:1.5;margin:16px 0}h2{font-size:28px}.eyebrow{color:${p.color};font-weight:bold}.hero p{max-width:650px;font-size:20px;color:#535862}.cta{display:inline-block;padding:12px 26px;border-radius:8px;background:${p.color};color:${foreground};text-decoration:none;border:2px solid #111}section{padding:36px 0}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:20px}.item{padding:26px;border:1px solid #ddd;border-top:4px solid ${p.color};border-radius:12px;overflow-wrap:anywhere}.text{white-space:pre-wrap;overflow-wrap:anywhere;max-width:800px}footer{border-top:1px solid #ddd;color:#555}.contact{display:flex;flex-wrap:wrap;gap:24px}a:focus-visible{outline:3px solid #111;outline-offset:5px}@media(max-width:500px){.hero{padding-top:40px}nav,main,footer{padding:20px}}
</style></head><body><nav><strong>${e(p.name)}</strong><div><a href="#about">درباره</a><a href="#services">${label}</a><a href="#contact">تماس</a></div></nav><main><header class="hero"><div class="eyebrow">${e(p.name)}</div><h1>${e(p.title)}</h1><p>${e(p.subtitle)}</p><a class="cta" href="#contact">${e(p.cta || 'ارتباط با ما')}</a></header><section id="about"><h2>دربارهٔ ${e(p.name)}</h2><div class="text">${e(p.about)}</div></section><section id="services"><h2>${label}</h2><div class="grid">${services.map((s,i)=>`<article class="item"><small>${String(i+1).padStart(2,'0')}</small><h3>${e(s)}</h3></article>`).join('')}</div></section><section id="contact"><h2>در ارتباط باشیم</h2><div class="contact">${p.phone?`<a dir="ltr" href="tel:${e(p.phone.replace(/[\s()-]/g,''))}">${e(p.phone)}</a>`:''}${p.email?`<a dir="ltr" href="mailto:${e(p.email)}">${e(p.email)}</a>`:''}</div></section></main><footer>${e(p.name)}</footer></body></html>`;
}


const security = {'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
function json(data,status=200){return Response.json(data,{status,headers:security});}
async function body(request){
  const reader=request.body?.getReader();
  if(!reader)throw new Error('invalid_json');
  let size=0;const chunks=[];
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>32768){await reader.cancel();throw new Error('body_size');}chunks.push(value);}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
  try{return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{throw new Error('invalid_json');}
}
function changed(result){return (result.meta?.changes||0)>0;}
export default {
  async fetch(request,env={}){
    const url=new URL(request.url),path=url.pathname;
    if(path==='/sandbox'){return sandbox.fetch(new Request(url.origin+'/',request));}
    if(path==='/health'||path==='/mock/webhook')return sandbox.fetch(request);
    if(request.method==='GET'&&path==='/')return new Response(appHTML,{headers:{...security,'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; frame-src 'self' about:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"}});
    if(request.method==='GET'&&path==='/app.js')return new Response(clientJS,{headers:{...security,'Content-Type':'text/javascript; charset=utf-8'}});
    if(!path.startsWith('/api/'))return json({error:'not_found'},404);
    const mutating=!['GET','HEAD'].includes(request.method);
    if(mutating&&(request.headers.get('X-KOT-Client')!=='factory'||(request.headers.get('Origin')&&request.headers.get('Origin')!==url.origin)))return json({message:'درخواست از مبدأ مجاز ارسال نشده است.'},403);
    if(mutating&&!(request.headers.get('Content-Type')||'').startsWith('application/json'))return json({message:'نوع محتوا باید JSON باشد.'},415);
    try{
      if(request.method==='POST'&&path==='/api/render')return json({html:renderSite(await body(request))});
      if(request.method==='GET'&&path==='/api/status'){
        if(!env.DB)return json({storage_ready:false});
        try{await env.DB.prepare('SELECT id FROM projects LIMIT 1').all();return json({storage_ready:true});}catch{return json({storage_ready:false});}
      }
      if(!env.DB)return json({message:'ذخیره‌سازی سرور هنوز فعال نشده است.'},503);
      if(request.method==='GET'&&path==='/api/projects'){
        const result=await env.DB.prepare('SELECT id, name, template, created_at, updated_at FROM projects ORDER BY updated_at DESC LIMIT 100').all();
        return json({projects:result.results});
      }
      if(request.method==='POST'&&path==='/api/projects'){
        const project=cleanProject(await body(request)),id=crypto.randomUUID(),now=new Date().toISOString();
        await env.DB.prepare('INSERT INTO projects (id, name, template, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)').bind(id,project.name,project.template,JSON.stringify(project),now,now).run();
        return json({id,updated_at:now},201);
      }
      const match=path.match(/^\/api\/projects\/([0-9a-f-]{36})$/);
      if(match){
        const id=match[1];
        if(request.method==='GET'){
          const row=await env.DB.prepare('SELECT content, updated_at FROM projects WHERE id = ?').bind(id).first();
          if(!row)return json({message:'پروژه پیدا نشد.'},404);
          return json({project:JSON.parse(row.content),updated_at:row.updated_at});
        }
        if(request.method==='PUT'||request.method==='DELETE'){
          const input=await body(request);
          if(typeof input?.expected_updated_at!=='string')return json({message:'نسخهٔ پروژه مشخص نیست؛ آن را دوباره باز کنید.'},400);
          if(request.method==='DELETE'){
            const result=await env.DB.prepare('DELETE FROM projects WHERE id = ? AND updated_at = ?').bind(id,input.expected_updated_at).run();
            return changed(result)?json({deleted:true}):json({message:'نسخهٔ پروژه تغییر کرده یا حذف شده است؛ فهرست را تازه کنید.'},409);
          }
          const project=cleanProject(input);
          const previous=Date.parse(input.expected_updated_at);
          if(!Number.isFinite(previous))return json({message:'نسخهٔ پروژه معتبر نیست.'},400);
          const now=new Date(Math.max(Date.now(),previous+1)).toISOString();
          const result=await env.DB.prepare('UPDATE projects SET name = ?, template = ?, content = ?, updated_at = ? WHERE id = ? AND updated_at = ?').bind(project.name,project.template,JSON.stringify(project),now,id,input.expected_updated_at).run();
          return changed(result)?json({id,updated_at:now}):json({message:'نسخهٔ پروژه تغییر کرده است؛ آن را دوباره باز کنید.'},409);
        }
      }
      return json({message:'مسیر پیدا نشد.'},404);
    }catch(error){
      if(/^(invalid_|too_long_|name_and_title_required|body_size)/.test(error.message))return json({message:'محتوای ورودی معتبر نیست؛ طول متن، نام، عنوان، رنگ، تلفن و ایمیل را بررسی کنید.'},error.message==='body_size'?413:400);
      return json({message:'عملیات ذخیره‌سازی انجام نشد؛ وضعیت محیط را بررسی کنید.'},503);
    }
  }
};
