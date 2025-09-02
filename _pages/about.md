---
layout: single
header:
  overlay_color: "#000000"
  overlay_filter: "0.5"
excerpt: "🎓 Postdoc & PhD Student • 🔍 IR • 🤖 NLP • 📊 ML"
permalink: /
title: "Shuai Wang (Dylan)"
author_profile: true
redirect_from: 
  - /about/
  - /about.html
---

## 👋 Welcome!

Howdy! I'm **Shuai Wang**, a Postdoc and finishing PhD student at [IeLab, UQ](https://ielab.io/). I'm under the guidance of [Professor Guido Zuccon](https://researchers.uq.edu.au/researcher/22857), [A.Professor Bevan Koopman](https://bevankoopman.github.io/), and [Dr. Harrisen Scells](https://scells.me/).

## 🎓 Academic Background

- **PhD** (finishing) - University of Queensland (2021-2025)
- **Master of Engineering Science** - University of Queensland (2021)
- **Bachelor of Science** - University of Western Australia (2019)

## 🔬 Research Focus

My research centers on **information retrieval** and **natural language processing (NLP)**, with a particular focus on domain-specific applications. My PhD work concentrates on automation for medical systematic reviews, including:

- **Automatic Mesh Term Suggestion**
- **Screening Prioritisation** 
- **Seed-driven Methods**
- **Boolean Query Formulation**

I also explore general IR and NLP challenges, including **Federated RAG** and **Fusion of Rankers**.

## 👨‍🏫 Teaching & Mentoring

Currently serving as **Course Coordinator** for INFS7410 (Information Retrieval and Web Search) at UQ. Previously tutored multiple courses (2021-2024) including INFS7410, INFS7205, and DATA7901/7902/7903.

*I'm passionate about discovering brilliant minds to collaborate with—if you're interested in research, let's connect and create something amazing together!*

## 🌍 Industry Experience

**Research Intern** at [Naver Lab Europe](https://europe.naverlabs.com/) (Feb-July 2024), focusing on **Context Compression for Retrieval-Augmented Generation (RAG)**.

## 💼 Job Opportunities

Starting February 2025, I work as a Postdoc at UQ. I'm actively seeking **exciting opportunities** in both academia and industry. If you think I'm a great fit for your team, please feel free to reach out!

{% include base_path %}

## 📰 Latest News
<div class="news-section">
{% include news.html %}
<a href="/news/" class="btn btn--primary btn--large">📖 Read All News</a>
</div>

## 🤝 Professional Services

I contribute to the academic community by serving as a **reviewer/PC member** for:

### 📚 Journals
- **TOIS**: ACM Transactions on Information Systems
- **Journal of Data and Information Quality**

### 🏛️ Conferences  
- **ACM ICTIR** 2023, **SIGIR** 2024, **SIGIR** 2025
- **ECIR** 2024, 2025

## 📝 Publications

<ul>
{% assign sorted_publications = site.publications | sort: 'date' | reverse %}
{% for post in sorted_publications %}
  {% include archive-single-cv.html %}
{% endfor %}
</ul>



