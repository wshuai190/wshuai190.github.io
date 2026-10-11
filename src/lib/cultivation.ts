/** Google Scholar citations as a xianxia cultivation realm (About page card, llms-full.txt, the twin). */
export const REALMS = [
  { at: 0, en: 'Qi Refining', zh: '练气' },
  { at: 1000, en: 'Foundation Establishment', zh: '筑基' },
  { at: 3000, en: 'Golden Core', zh: '金丹' },
  { at: 6000, en: 'Nascent Soul', zh: '元婴' },
  { at: 10000, en: 'Spirit Severing', zh: '化神' },
  { at: 20000, en: 'Tribulation Transcendence', zh: '渡劫' },
  { at: 50000, en: 'Great Ascension', zh: '大乘' },
];

export function realmOf(citations: number) {
  const level = REALMS.findLastIndex((realm) => citations >= realm.at);
  const realm = REALMS[level];
  const next = REALMS[level + 1];
  const progress = next ? Math.round(((citations - realm.at) / (next.at - realm.at)) * 100) : 100;
  return { level, realm, next, progress, toNext: next ? next.at - citations : 0 };
}
