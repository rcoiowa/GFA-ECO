import { readFile, writeFile } from 'node:fs/promises';
const shell=await readFile(new URL('./shell.html',import.meta.url),'utf8');
const core=(await readFile(new URL('./core.mjs',import.meta.url),'utf8')).replace(/^export /gm,'');
const app=await readFile(new URL('./app.js',import.meta.url),'utf8');
await writeFile(new URL('./index.html',import.meta.url),shell.replace('/* CORE_SOURCE */',core).replace('/* APP_SOURCE */',app));
console.log('Built standalone synthetic prototype index.html');
