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

export default {
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
