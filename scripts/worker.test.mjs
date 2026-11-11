import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../dist/server/index.js';

test('health and page are served without caching', async () => {
  const response = await worker.fetch(new Request('https://sandbox.test/health'));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).mode, 'sandbox');
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  const page = await worker.fetch(new Request('https://sandbox.test/sandbox'));
  assert.match(await page.text(), /lang="fa" dir="rtl"/);
});
test('webhook accepts JSON and returns no submitted data', async () => {
  const response = await worker.fetch(new Request('https://sandbox.test/mock/webhook', { method: 'POST', headers: {'Content-Type':'application/json'}, body: '{"private":"do-not-return"}' }));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {received:true, mode:'sandbox', stored:false});
});
test('webhook rejects malformed, oversized and incorrect content types', async () => {
  for (const [body, type, status] of [['broken','application/json',400], ['x'.repeat(65537),'application/json',413], ['{}','text/plain',415]]) {
    const response = await worker.fetch(new Request('https://sandbox.test/mock/webhook', {method:'POST',headers:{'Content-Type':type},body}));
    assert.equal(response.status, status);
  }
});
test('unknown routes do not succeed', async () => {
  assert.equal((await worker.fetch(new Request('https://sandbox.test/missing'))).status, 404);
});
