import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import worker from '../dist/server/index.js';
import { renderSite } from '../worker/generator.js';

const project={name:'کوت',title:'سایت آزمایشی',template:'business',subtitle:'سلام',about:'درباره',services:'طراحی\nتوسعه',phone:'+989121234567',email:'test@example.com',cta:'تماس',color:'#bd2835'};
function database(){
  const db=new DatabaseSync(':memory:');
  db.exec(readFileSync(new URL('../drizzle/0000_projects.sql',import.meta.url),'utf8'));
  return {close:()=>db.close(),prepare(sql){let args=[];return {bind(...values){args=values;return this},async all(){return {results:db.prepare(sql).all(...args)}},async first(){return db.prepare(sql).get(...args)},async run(){return {meta:db.prepare(sql).run(...args)}}}}};
}
function req(path,method='GET',data,extra={}){return new Request('https://factory.test'+path,{method,headers:{'Content-Type':'application/json','X-KOT-Client':'factory',...extra},...(data===undefined?{}:{body:JSON.stringify(data)})});}
test('project lifecycle uses SQL and detects stale edits',async()=>{
  const DB=database(),env={DB};
  try{
    assert.equal((await (await worker.fetch(req('/api/status'),env)).json()).storage_ready,true);
    const response=await worker.fetch(req('/api/projects','POST',project),env);assert.equal(response.status,201);
    const created=await response.json(),path='/api/projects/'+created.id;
    assert.equal((await (await worker.fetch(req('/api/projects'),env)).json()).projects.length,1);
    assert.equal((await (await worker.fetch(req(path),env)).json()).project.name,'کوت');
    assert.equal((await worker.fetch(req(path,'PUT',{...project,expected_updated_at:'stale'}),env)).status,400);
    assert.equal((await worker.fetch(req(path,'PUT',{...project,expected_updated_at:'2000-01-01T00:00:00.000Z'}),env)).status,409);
    const updated=await worker.fetch(req(path,'PUT',{...project,title:'عنوان تازه',expected_updated_at:created.updated_at}),env);assert.equal(updated.status,200);
    const revision=(await updated.json()).updated_at;
    assert.notEqual(revision,created.updated_at);
    assert.equal((await worker.fetch(req(path,'PUT',{...project,expected_updated_at:created.updated_at}),env)).status,409);
    assert.equal((await worker.fetch(req(path,'DELETE',{expected_updated_at:revision}),env)).status,200);
    assert.equal((await worker.fetch(req(path),env)).status,404);
  }finally{DB.close()}
});
test('cross-origin writes and oversized inputs are rejected',async()=>{
  assert.equal((await worker.fetch(req('/api/projects','POST',project,{Origin:'https://attacker.test'}))).status,403);
  assert.equal((await worker.fetch(req('/api/render','POST',{...project,about:'x'.repeat(33000)}))).status,413);
  assert.equal((await worker.fetch(req('/api/render','POST',{...project,phone:'javascript:alert(1)'}))).status,400);
});
test('export escapes markup, validates colors and supports all templates',()=>{
  for(const template of ['business','portfolio','restaurant']){
    const html=renderSite({...project,template,title:'<script>alert(1)</script>'});
    assert.ok(html.includes('&lt;script&gt;'));assert.ok(!html.includes('<script>'));
    assert.ok(html.includes('lang="fa" dir="rtl"'));assert.ok(html.includes('tel:+989121234567'));
  }
  assert.throws(()=>renderSite({...project,color:'red;display:none'}));
});
test('missing database is reported honestly while rendering stays available',async()=>{
  assert.equal((await(await worker.fetch(req('/api/status'))).json()).storage_ready,false);
  assert.equal((await worker.fetch(req('/api/projects'))).status,503);
  assert.equal((await worker.fetch(req('/api/render','POST',project))).status,200);
});
