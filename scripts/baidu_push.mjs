// Push site URLs to Baidu (百度搜索资源平台 普通收录 API) after a deploy that changed content.
// Baidu does not support IndexNow. Needs the BAIDU_PUSH_TOKEN secret; skipped without it.
// Usage: BAIDU_PUSH_TOKEN=... node scripts/baidu_push.mjs <changed files...>
const SITE = 'https://shuaiwang.io';
const CONTENT = /^(src\/content\/|src\/data\/(profile|projects|news|authors)\.yml$|src\/(views|components|layouts|pages)\/|public\/(images|files)\/)/;
const token = process.env.BAIDU_PUSH_TOKEN;
if (!token) {
  console.log('Baidu push: BAIDU_PUSH_TOKEN not set, skipping.');
  process.exit(0);
}
if (!process.argv.slice(2).some((file) => CONTENT.test(file))) {
  console.log('Baidu push: no content changes, nothing to submit.');
  process.exit(0);
}
const sitemap = await (await fetch(`${SITE}/sitemap-0.xml`)).text();
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
// New sites have a small daily quota; send the most important pages first.
const priority = (u) => (/\/(zh\/)?$/.test(u) ? 0 : /\/(research|publications|cv|teaching)\/$/.test(u) ? 1 : /\/publication\//.test(u) ? 2 : 3);
urls.sort((a, b) => priority(a) - priority(b));
const response = await fetch(`http://data.zz.baidu.com/urls?site=${SITE}&token=${token}`, {
  method: 'POST',
  headers: { 'Content-Type': 'text/plain' },
  body: urls.join('\n'),
});
console.log(`Baidu push: ${urls.length} URLs, HTTP ${response.status}: ${await response.text()}`);
