// Tell IndexNow search engines (Bing, Yandex, Seznam, ...) that pages changed, after a deploy
// that touched site content. Daily metric-only updates are skipped. https://www.indexnow.org/
// Usage: node scripts/indexnow.mjs <changed files...>
const HOST = 'shuaiwang.io';
const KEY = '72eff92edaf801d03432edfe0537209f'; // also served at https://shuaiwang.io/72eff92edaf801d03432edfe0537209f.txt
const CONTENT = /^(src\/content\/|src\/data\/(profile|projects|news|authors)\.yml$|src\/(views|components|layouts|pages)\/|public\/(images|files)\/)/;

const changed = process.argv.slice(2);
if (!changed.some((file) => CONTENT.test(file))) {
  console.log('IndexNow: no content changes, nothing to submit.');
  process.exit(0);
}
const sitemap = await (await fetch(`https://${HOST}/sitemap-0.xml`)).text();
const urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const response = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList }),
});
console.log(`IndexNow: submitted ${urlList.length} URLs, HTTP ${response.status}`);
if (response.status >= 400) process.exit(1);
