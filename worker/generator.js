export const templates = ['business', 'portfolio', 'restaurant'];
export function cleanProject(input) {
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
export function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
export function renderSite(project) {
  const p = cleanProject(project), e = escapeHTML;
  const services = p.services.split('\n').map(x=>x.trim()).filter(Boolean);
  const label = {business:'خدمات ما',portfolio:'تخصص و تجربه',restaurant:'انتخاب‌های منو'}[p.template];
  const rgb=p.color.slice(1).match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=0.04045?x/12.92:((x+0.055)/1.055)**2.4);
  const foreground=rgb[0]*0.2126+rgb[1]*0.7152+rgb[2]*0.0722>0.179?'#111':'#fff';
  return `<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${e(p.subtitle.slice(0,160))}"><title>${e(p.title)}</title><style>
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:#fff;color:#17191d;font:16px/2 Tahoma,Arial,sans-serif}a{color:inherit}nav,main,footer{max-width:1100px;margin:auto;padding:24px}nav{display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap;border-bottom:1px solid #ddd}nav div{display:flex;gap:20px}.hero{padding:80px 0 64px;max-width:850px}h1{font-size:clamp(32px,6vw,64px);line-height:1.5;margin:16px 0}h2{font-size:28px}.eyebrow{color:${p.color};font-weight:bold}.hero p{max-width:650px;font-size:20px;color:#535862}.cta{display:inline-block;padding:12px 26px;border-radius:8px;background:${p.color};color:${foreground};text-decoration:none;border:2px solid #111}section{padding:36px 0}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:20px}.item{padding:26px;border:1px solid #ddd;border-top:4px solid ${p.color};border-radius:12px;overflow-wrap:anywhere}.text{white-space:pre-wrap;overflow-wrap:anywhere;max-width:800px}footer{border-top:1px solid #ddd;color:#555}.contact{display:flex;flex-wrap:wrap;gap:24px}a:focus-visible{outline:3px solid #111;outline-offset:5px}@media(max-width:500px){.hero{padding-top:40px}nav,main,footer{padding:20px}}
</style></head><body><nav><strong>${e(p.name)}</strong><div><a href="#about">درباره</a><a href="#services">${label}</a><a href="#contact">تماس</a></div></nav><main><header class="hero"><div class="eyebrow">${e(p.name)}</div><h1>${e(p.title)}</h1><p>${e(p.subtitle)}</p><a class="cta" href="#contact">${e(p.cta || 'ارتباط با ما')}</a></header><section id="about"><h2>دربارهٔ ${e(p.name)}</h2><div class="text">${e(p.about)}</div></section><section id="services"><h2>${label}</h2><div class="grid">${services.map((s,i)=>`<article class="item"><small>${String(i+1).padStart(2,'0')}</small><h3>${e(s)}</h3></article>`).join('')}</div></section><section id="contact"><h2>در ارتباط باشیم</h2><div class="contact">${p.phone?`<a dir="ltr" href="tel:${e(p.phone.replace(/[\s()-]/g,''))}">${e(p.phone)}</a>`:''}${p.email?`<a dir="ltr" href="mailto:${e(p.email)}">${e(p.email)}</a>`:''}</div></section></main><footer>${e(p.name)}</footer></body></html>`;
}
