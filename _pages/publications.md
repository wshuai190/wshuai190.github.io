---
layout: archive
title: "Publications"
permalink: /publications/
author_profile: true
---

{% if site.active_lang == 'zh' %}

您也可以在<u><a href="https://scholar.google.com/citations?user=JDKYomkAAAAJ&hl=zh-CN">我的谷歌学术页面</a></u>查看我的论文。

{% include base_path %}

{% assign pub_count = site.publications | size %}
<p class="publications__count">共 {{ pub_count }} 篇论文</p>

{% assign sorted_pubs = site.publications | sort: 'date' | reverse %}
{% assign current_year = "" %}
{% for post in sorted_pubs %}{% assign post_year = post.date | date: "%Y" %}{% if post_year != current_year %}{% assign current_year = post_year %}
<h2 class="publications__year-header">{{ current_year }}</h2>
{% endif %}{% include archive-single.html %}{% endfor %}

{% else %}

{% if author.googlescholar %}
  You can also find my articles on <u><a href="{{author.googlescholar}}">my Google Scholar profile</a>.</u>
{% endif %}

{% include base_path %}

{% assign pub_count = site.publications | size %}
<p class="publications__count">{{ pub_count }} publications total</p>

{% assign sorted_pubs = site.publications | sort: 'date' | reverse %}
{% assign current_year = "" %}
{% for post in sorted_pubs %}{% assign post_year = post.date | date: "%Y" %}{% if post_year != current_year %}{% assign current_year = post_year %}
<h2 class="publications__year-header">{{ current_year }}</h2>
{% endif %}{% include archive-single.html %}{% endfor %}

{% endif %}
