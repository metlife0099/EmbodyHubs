import { cp,mkdir,rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=path.join(root,'dist');
if(path.dirname(output)!==root||path.basename(output)!=='dist')throw new Error('Refusing to assemble outside the project dist directory.');
await rm(output,{recursive:true,force:true});
await mkdir(output,{recursive:true});
await cp(path.join(root,'frontend','dist'),output,{recursive:true});
await cp(path.join(root,'admin','dist'),path.join(output,'admin'),{recursive:true});
console.log('Assembled storefront and admin production assets in dist/.');
