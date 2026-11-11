import sandbox from './sandbox.js';
import { appHTML, clientJS } from './app.js';
import { cleanProject, renderSite } from './generator.js';

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
