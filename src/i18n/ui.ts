export type Lang = 'en' | 'zh';
export type Localized<T = string> = { en: T; zh: T };

const strings = {
  'nav.home': { en: 'Home', zh: '首页' },
  'nav.research': { en: 'Research', zh: '研究' },
  'nav.publications': { en: 'Publications', zh: '论文' },
  'nav.teaching': { en: 'Teaching', zh: '教学' },
  'nav.cv': { en: 'CV', zh: '简历' },
  'nav.talks': { en: 'Talks', zh: '报告' },
  'nav.awards': { en: 'Awards', zh: '奖项' },
  'nav.news': { en: 'News', zh: '动态' },
  'nav.feed': { en: 'RSS', zh: 'RSS' },
  'nav.menu': { en: 'Menu', zh: '菜单' },
  'nav.switch': { en: '中文', zh: 'EN' },
  'nav.search': { en: 'Search', zh: '搜索' },
  'theme.toggle': { en: 'Toggle dark mode', zh: '切换深色模式' },

  'home.new': { en: 'New', zh: '最新' },
  'home.explore': { en: 'Explore research', zh: '浏览研究' },
  'home.cv': { en: 'Curriculum vitae', zh: '个人简历' },
  'home.scholar': { en: 'Google Scholar', zh: 'Google Scholar' },
  'home.selected': { en: 'Selected work', zh: '代表工作' },
  'home.allpubs': { en: 'All publications', zh: '全部论文' },
  'home.news': { en: 'News', zh: '动态' },
  'home.archive': { en: 'Archive', zh: '全部动态' },
  'home.news.pause': { en: 'Pause news', zh: '暂停滚动' },
  'home.news.play': { en: 'Play news', zh: '继续滚动' },
  'home.search.label': { en: 'Search my papers', zh: '搜索论文' },
  'home.search.go': { en: 'Search', zh: '搜索' },
  'home.teaching': { en: 'Teaching & mentoring', zh: '教学与指导' },
  'home.together': { en: "Let's work together.", zh: '一起开展研究' },
  'home.courses': { en: 'Courses & supervision', zh: '课程与学生指导' },

  'stat.citations': { en: 'Citations', zh: '引用' },
  'stat.hindex': { en: 'h-index', zh: 'h 指数' },
  'stat.i10': { en: 'i10-index', zh: 'i10 指数' },
  'stat.papers': { en: 'Publications', zh: '论文' },

  'research.title': { en: 'Research', zh: '研究' },
  'research.themes': { en: 'Themes', zh: '研究方向' },
  'research.projects': { en: 'Projects', zh: '研究项目' },
  'research.background': { en: 'Background', zh: '背景' },
  'research.education': { en: 'Education', zh: '教育背景' },
  'research.experience': { en: 'Experience', zh: '工作经历' },
  'research.service': { en: 'Professional service', zh: '学术服务' },
  'research.journals': { en: 'Journals', zh: '期刊' },
  'research.conferences': { en: 'Programme committees', zh: '会议程序委员会' },
  'research.opportunities': { en: 'Opportunities', zh: '合作与机会' },
  'research.thesis': { en: 'Read my thesis', zh: '阅读博士论文' },
  'project.papers': { en: 'Papers', zh: '相关论文' },
  'project.back': { en: 'All projects', zh: '全部项目' },
  'project.figure': { en: 'Figure', zh: '图' },
  'project.more': { en: 'Details', zh: '详情' },
  'project.stars': { en: 'stars', zh: '星标' },

  'link.site': { en: 'Project site', zh: '项目网站' },
  'link.code': { en: 'Code', zh: '代码' },
  'link.demo': { en: 'Demo', zh: '演示' },
  'link.paper': { en: 'Paper', zh: '论文' },
  'link.bibtex': { en: 'BibTeX', zh: 'BibTeX' },
  'link.copied': { en: 'Copied', zh: '已复制' },
  'link.citation': { en: 'Copy citation', zh: '复制引用' },

  'pubs.title': { en: 'Publications', zh: '论文' },
  'pubs.lede': { en: 'Papers and preprints, newest first. Also on', zh: '论文与预印本，按时间倒序。也可查看' },
  'pubs.search': { en: 'Search title, author, venue or abstract…', zh: '搜索标题、作者、会议或摘要…' },
  'pubs.all': { en: 'All', zh: '全部' },
  'pubs.allyears': { en: 'All years', zh: '全部年份' },
  'pubs.count': { en: '{n} publications', zh: '{n} 篇论文' },
  'pubs.matching': { en: '{n} matching', zh: '找到 {n} 篇' },
  'pubs.empty': { en: 'No publications match. Try fewer words.', zh: '没有匹配的论文，试试减少关键词。' },
  'pubs.reset': { en: 'Clear filters', zh: '清除筛选' },
  'pubs.leading': { en: 'First & co-first', zh: '第一/共同一作' },
  'pubs.cited': { en: 'cited {n}×', zh: '被引 {n} 次' },
  'pub.abstract': { en: 'Abstract', zh: '摘要' },
  'pub.back': { en: 'All publications', zh: '全部论文' },
  'pub.cite': { en: 'Cite', zh: '引用' },
  'pub.first': { en: 'First author', zh: '第一作者' },
  'pub.cofirst': { en: 'Co-first author', zh: '共同一作' },
  'pub.equal': { en: '* Equal contribution', zh: '* 同等贡献' },
  'research.leading': { en: 'first or co-first author papers', zh: '篇第一或共同一作论文' },
  'pub.project': { en: 'Part of project', zh: '所属项目' },

  'teaching.title': { en: 'Teaching & supervision', zh: '教学与指导' },
  'teaching.history': { en: 'Teaching history', zh: '教学经历' },
  'teaching.supervision': { en: 'PhD supervision', zh: '博士生指导' },
  'teaching.course': { en: 'UQ course information', zh: 'UQ 课程信息' },
  'talks.title': { en: 'Talks', zh: '学术报告' },
  'awards.title': { en: 'Awards', zh: '荣誉与奖项' },
  'news.title': { en: 'News', zh: '动态' },
  'cv.title': { en: 'Curriculum Vitae', zh: '个人简历' },
  'cv.profile': { en: 'Profile', zh: '简介' },
  'cv.supervision': { en: 'Supervision', zh: '学生指导' },
  'cv.print': { en: 'Print / save as PDF', zh: '打印 / 保存为 PDF' },
  'entry.back': { en: 'Back', zh: '返回' },

  'search.placeholder': { en: 'Search papers, projects, news…', zh: '搜索论文、项目、动态…' },
  'search.empty': { en: 'No results', zh: '没有结果' },
  'search.hint': { en: 'to open · ↑↓ to move · esc to close', zh: '打开 · ↑↓ 选择 · esc 关闭' },
  'search.loading': { en: 'Searching…', zh: '搜索中…' },
  'search.dev': { en: 'Search index is built by `npm run build`.', zh: '搜索索引在 `npm run build` 时生成。' },

  'footer.tagline': { en: 'Information retrieval · The University of Queensland', zh: '信息检索 · 昆士兰大学' },
  'notfound.title': { en: 'Page not found', zh: '页面不存在' },
  'notfound.body': { en: 'The page may have moved. Try search or head home.', zh: '页面可能已移动，试试搜索或返回首页。' },
} satisfies Record<string, Localized>;

export type StringKey = keyof typeof strings;

export function t(lang: Lang, key: StringKey, vars: Record<string, string | number> = {}): string {
  let text: string = strings[key][lang];
  for (const [name, value] of Object.entries(vars)) text = text.replace(`{${name}}`, String(value));
  return text;
}

/** Pick the language variant from an `{ en, zh }` object; plain values pass through. */
export function pick<T>(value: Localized<T> | T, lang: Lang): T {
  if (value && typeof value === 'object' && 'en' in (value as object) && 'zh' in (value as object)) {
    return (value as Localized<T>)[lang];
  }
  return value as T;
}

/** Prefix an internal path with /zh for Chinese pages. */
export function localePath(lang: Lang, path: string): string {
  if (lang === 'en' || !path.startsWith('/')) return path;
  return path === '/' ? '/zh/' : `/zh${path}`;
}

/** The same page in the other language. */
export function alternatePath(lang: Lang, path: string): string {
  if (lang === 'zh') return path.replace(/^\/zh(?=\/|$)/, '') || '/';
  return localePath('zh', path);
}

export const TOPIC_LABELS: Record<string, Localized> = {
  agents: { en: 'Search agents', zh: '搜索 Agent' },
  evidence: { en: 'Biomedical evidence', zh: '生物医学证据' },
  rag: { en: 'Efficient RAG', zh: '高效 RAG' },
  memory: { en: 'Agent memory', zh: 'Agent 记忆' },
  retrieval: { en: 'Retrieval & ranking', zh: '检索与排序' },
  security: { en: 'Robustness & security', zh: '鲁棒性与安全' },
};

export function formatMonth(date: Date, lang: Lang): string {
  return lang === 'zh'
    ? `${date.getUTCFullYear()} 年 ${date.getUTCMonth() + 1} 月`
    : date.toLocaleDateString('en-AU', { month: 'short', year: 'numeric', timeZone: 'UTC' });
}
