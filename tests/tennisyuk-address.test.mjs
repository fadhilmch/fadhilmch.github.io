import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('the app page lives at /tennisyuk/ and loads its files from tenisyuk/',()=>{
 const h=read('tennisyuk/index.html');
 for(const m of h.matchAll(/(?:src|href)="(\.\.\/tenisyuk\/[^"]+)"/g))assert.ok(existsSync(new URL('../'+m[1].slice(3),import.meta.url)),m[1]);
 assert.doesNotMatch(h,/(?:src|href)="(?:js\/|style\.css|game\.css|config\.js)/);
 assert.match(h,/Created by/);
});
test('the old /tenisyuk/ address redirects and keeps the query and hash',()=>{
 const h=read('tenisyuk/index.html');
 assert.match(h,/location\.replace\('\.\.\/tennisyuk\/' \+ location\.search \+ location\.hash\)/);
 assert.match(h,/http-equiv="refresh"/);
});
test('shared links use the new address',()=>{
 assert.match(read('tenisyuk/config.js'),/siteUrl: 'https:\/\/fadhilmch\.github\.io\/tennisyuk\/'/);
});
