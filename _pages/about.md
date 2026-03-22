---
layout: single
header:
  overlay_color: "#0f172a"
  overlay_filter: "0.5"
  tagline: "Postdoctoral Researcher · Information Retrieval · NLP"
permalink: /
title: "Dr. Shuai Wang (Dylan)"
author_profile: true
redirect_from:
  - /about/
  - /about.html
---

{% if site.active_lang == 'zh' %}

## 👋 欢迎！

大家好！我是**王率**，现任职于[昆士兰大学 IeLab](https://ielab.io/)的博士后研究员。我在[Prof. Guido Zuccon](https://researchers.uq.edu.au/researcher/22857)、[A/Prof. Bevan Koopman](https://bevankoopman.github.io/)和[Dr. Harrisen Scells](https://scells.me/)的指导下完成了博士学位。

## 🎓 教育背景

- **哲学博士** — 昆士兰大学 (2025) [阅读我的论文](/files/thesis.pdf)
- **工程科学硕士** — 昆士兰大学 (2021)
- **理学学士** — 西澳大利亚大学 (2019)

## 🔬 研究方向

我的研究主要集中在**信息检索**和**自然语言处理（NLP）**领域。博士期间专注于医学系统评价的自动化，包括：

- **自动MeSH术语建议**
- **筛选优先排序**
- **种子驱动方法**
- **布尔查询构建**

此外，我还研究通用信息检索与NLP挑战，包括**联邦RAG**、**搜索与RAG模型效率**以及**有效排序模型**。

## 👨‍🏫 教学与指导

目前担任昆士兰大学INFS7410（信息检索与网络搜索）课程的**课程协调员**。2021至2024年期间曾担任INFS7410、INFS7205及DATA7901/7902/7903等多门课程的助教。

*我热衷于发现优秀人才共同合作——如果您对研究感兴趣，欢迎联系我！*

## 🌍 工业界经历

**研究实习生** 于[Naver Labs Europe](https://europe.naverlabs.com/)（2024年2月至7月），专注于**RAG上下文压缩**研究。

## 💼 求职意向

自2025年2月起在昆士兰大学担任博士后研究员，同时积极寻求学术界和工业界的**优秀机会**。欢迎随时联系！

{% include base_path %}

## 📰 最新动态

{% include news.html %}
<a href="/zh/news/" class="btn btn--primary btn--large" style="margin-top:1rem;">查看所有动态</a>

## 🤝 学术服务

担任以下期刊和会议的**程序委员会成员（审稿人）**：

### 📚 期刊
- **TOIS**：ACM信息系统学报
- **Journal of Data and Information Quality**

### 🏛️ 会议
- **ACM ICTIR** 2023、**SIGIR** 2024、**SIGIR** 2025、**SIGIR** 2026
- **ECIR** 2024、2025
- **WSDM** 2026

## 📝 学术论文

<ul>
{% assign sorted_publications = site.publications | sort: 'date' | reverse %}
{% for post in sorted_publications %}
  {% include archive-single-cv.html %}
{% endfor %}
</ul>

{% else %}

## 👋 Welcome!

Howdy! I'm **Shuai Wang**, a Postdoc at [IeLab, UQ](https://ielab.io/). I completed my PhD under the guidance of [Professor Guido Zuccon](https://researchers.uq.edu.au/researcher/22857), [A.Professor Bevan Koopman](https://bevankoopman.github.io/), and [Dr. Harrisen Scells](https://scells.me/).

## 🎓 Academic Background

- **Doctor of Philosophy** - University of Queensland (2025) [Read My Thesis](/files/thesis.pdf)
- **Master of Engineering Science** - University of Queensland (2021)
- **Bachelor of Science** - University of Western Australia (2019)

## 🔬 Research Focus

My research centers on **information retrieval** and **natural language processing (NLP)**. My PhD work concentrates on automation for medical systematic reviews, including:

- **Automatic Mesh Term Suggestion**
- **Screening Prioritisation**
- **Seed-driven Methods**
- **Boolean Query Formulation**

I also explore general IR and NLP challenges, including **Federated RAG**, **Search and RAG model Efficiency** and **Effective Ranking Models**.

## 👨‍🏫 Teaching & Mentoring

Currently serving as **Course Coordinator** for INFS7410 (Information Retrieval and Web Search) at UQ. Previously tutored multiple courses (2021-2024) including INFS7410, INFS7205, and DATA7901/7902/7903.

*I'm passionate about discovering brilliant minds to collaborate with—if you're interested in research, let's connect and create something amazing together!*

## 🌍 Industry Experience

**Research Intern** at [Naver Lab Europe](https://europe.naverlabs.com/) (Feb-July 2024), focusing on **Context Compression for Retrieval-Augmented Generation (RAG)**.

## 💼 Job Opportunities

Since February 2025, I have been working as a Postdoc at UQ. I'm actively seeking **exciting opportunities** in both academia and industry. If you think I'm a great fit for your team, please feel free to reach out!

{% include base_path %}

## 📰 Latest News

{% include news.html %}
<a href="/news/" class="btn btn--primary btn--large" style="margin-top:1rem;">Read All News</a>

## 🤝 Professional Services

I contribute to the academic community by serving as a **PC/SPC (reviewer) member** for:

### 📚 Journals
- **TOIS**: ACM Transactions on Information Systems
- **Journal of Data and Information Quality**

### 🏛️ Conferences
- **ACM ICTIR** 2023, **SIGIR** 2024, **SIGIR** 2025,  **SIGIR** 2026
- **ECIR** 2024, 2025
- **WSDM** 2026

## 📝 Publications

<ul>
{% assign sorted_publications = site.publications | sort: 'date' | reverse %}
{% for post in sorted_publications %}
  {% include archive-single-cv.html %}
{% endfor %}
</ul>

{% endif %}
