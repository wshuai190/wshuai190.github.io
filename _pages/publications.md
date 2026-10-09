---
layout: document
title: "Publications"
permalink: /publications/
---
{% assign zh = false %}{% if site.active_lang == 'zh' %}{% assign zh = true %}{% endif %}
<p class="muted">{% if zh %}完整论文列表，包括已发表论文与预印本。{% else %}Published papers and preprints. Author identity: <a href="{{ site.author.orcid }}">ORCID</a> · <a href="{{ site.author.googlescholar }}">Google Scholar</a>.{% endif %}</p>
<div class="publication-controls">
  <label>{% if zh %}搜索论文{% else %}Search publications{% endif %}<input id="publication-search" type="search" placeholder="{% if zh %}标题、作者、会议…{% else %}Title, author, venue…{% endif %}"></label>
  <label>{% if zh %}年份{% else %}Year{% endif %}<select id="publication-year"><option value="">All years</option>{% assign years = site.publications | sort: 'date' | reverse %}{% assign previous = '' %}{% for post in years %}{% assign year = post.date | date: '%Y' %}{% if year != previous %}<option>{{ year }}</option>{% assign previous = year %}{% endif %}{% endfor %}</select></label>
  <button type="button" id="publication-reset">Reset</button>
</div>
<p id="publication-count" class="muted" role="status">{{ site.publications.size }} publications</p>
<div id="publication-list">
{% assign papers = site.publications | sort: 'date' | reverse %}
{% for paper in papers %}
<article class="paper-row" data-year="{{ paper.date | date: '%Y' }}">
  <p class="paper-meta">{{ paper.date | date: '%Y' }} · {{ paper.venue }}{% if paper.page_type %} · {{ paper.page_type }}{% endif %}</p>
  <h2><a href="{{ paper.url }}">{{ paper.title }}</a></h2>
  <p class="paper-authors">{{ paper.citation | split: '. ' | first }}</p>
  <div class="paper-links">{% if paper.paperurl %}<a href="{{ paper.paperurl }}">Paper ↗</a>{% endif %}{% if paper.project %}<a href="{{ paper.project }}">Project ↗</a>{% endif %}{% if paper.code %}<a href="{{ paper.code }}">Code ↗</a>{% endif %}{% if paper.demo %}<a href="{{ paper.demo }}">Demo ↗</a>{% endif %}{% if paper.citation %}<button type="button" class="copy-citation" data-citation="{{ paper.citation | escape }}">Copy citation</button>{% endif %}</div>
</article>
{% endfor %}
</div>
<p id="publication-empty" hidden>{% if zh %}没有符合条件的论文。{% else %}No matching publications. Try another search or year.{% endif %}</p>
