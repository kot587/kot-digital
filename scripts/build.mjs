import { mkdir, readFile, writeFile } from 'node:fs/promises';
let worker=await readFile('worker/index.js','utf8');
worker=worker.replace("import sandbox from './sandbox.js';",'const sandbox = (() => {\n'+(await readFile('worker/sandbox.js','utf8')).replace('export default {','return {')+'\n})();');
worker=worker.replace("import { appHTML, clientJS } from './app.js';",(await readFile('worker/app.js','utf8')).replaceAll('export const ','const '));
worker=worker.replace("import { cleanProject, renderSite } from './generator.js';",(await readFile('worker/generator.js','utf8')).replaceAll('export const ','const ').replaceAll('export function ','function '));
await mkdir('dist/server',{recursive:true});
await writeFile('dist/server/index.js',worker);
console.log('Built dependency-free Worker');
