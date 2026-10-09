// Copy the onnxruntime-web CPU (WASM) runtime into public/ort so site search can load it
// from the site itself. Runs before `astro dev` and `astro build`.
import { copyFileSync, mkdirSync } from 'node:fs';

const files = ['ort.wasm.min.mjs', 'ort-wasm-simd-threaded.mjs', 'ort-wasm-simd-threaded.wasm'];
mkdirSync('public/ort', { recursive: true });
for (const file of files) copyFileSync(`node_modules/onnxruntime-web/dist/${file}`, `public/ort/${file}`);
console.log(`copied ${files.length} onnxruntime-web files to public/ort`);
