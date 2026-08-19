---
layout: single
header:
  overlay_color: "#0f172a"
  overlay_filter: "0.5"
  title: "Dr. Shuai Wang"
  tagline: "Search agents · Biomedical evidence search · Efficient RAG systems"
permalink: /
title: "Dr. Shuai Wang (Dylan)"
author_profile: true
redirect_from:
  - /about/
  - /about.html
---

{% if site.active_lang == 'zh' %}

<div class="researcher-summary" markdown="1">

**王率博士**现任澳大利亚昆士兰大学 [IELab](https://ielab.io/) 研究员（Research Fellow）。研究方向为**信息检索（IR）**、**search agents**、**生物医学证据检索** 与**高效 RAG systems**。相关成果发表于 **SIGIR、WSDM、WWW、ECIR、EMNLP、EACL** 等会议，Google Scholar 引用累计 **{{ site.data.scholar_metrics.citations }}+**。他于 2025 年在 [Prof. Guido Zuccon](https://researchers.uq.edu.au/researcher/22857)、[A/Prof. Bevan Koopman](https://bevankoopman.github.io/) 与 [Dr. Harrisen Scells](https://scells.me/) 指导下完成昆士兰大学博士学位，现任 INFS7410（信息检索与网络搜索）课程**主讲教师与课程协调员**。

</div>

## 🎓 教育背景

- **哲学博士** — 昆士兰大学 (2025) [阅读我的论文](/files/thesis.pdf)
- **工程科学硕士** — 昆士兰大学 (2021)
- **理学学士** — 西澳大利亚大学 (2019)

## 🔬 研究重点

我目前主要做以下几类工作：

- **Search agents 与 deep-research workflows**：task decomposition、Boolean retrieval、structured inspect cards、section-level fetch 与 tool-using agents
- **医学证据检索与 systematic review**：MeSH suggestion、screening prioritisation、Boolean query generation、seed-driven retrieval 与 clinical evidence workflows
- **高效 RAG 与 LLM systems**：context embeddings、retrieval-generation interfaces、KV-cache / memory optimisation，以及更高效的 inference pipelines
- **自适应检索与排序**：2D Matryoshka retrieval、routing、prompt variation studies 与更稳健的 LLM-based rankers
- **评测与基础设施**：RAG、federated search 与 agent workflows 的 benchmarks、tooling 与 reproducible evaluation

## 👨‍🏫 教学与指导

目前担任昆士兰大学 INFS7410（信息检索与网络搜索）课程的**课程协调员与主讲教师**，面向 120+ 名硕士生讲授 classical IR、dense retrieval、LLMs for search、RAG 和 evaluation。2021 至 2024 年期间曾担任 INFS7410、INFS7205 及 DATA7901/7902/7903 等多门课程的助教。

我也指导学生开展 retrieval、RAG 与 biomedical NLP 研究；已有学生获得博士奖学金并发表 SIGIR/ECIR 相关论文。如果您对研究合作感兴趣，欢迎联系我。

## 🌍 工业界经历

**研究实习生** 于[Naver Labs Europe](https://europe.naverlabs.com/)（2024年2月至7月）。我共同主导 COCOM，从方法设计、实现、实验到 WSDM 2025 论文发表，最终在接近基线质量的情况下实现 **5.69x RAG 推理加速**。

## 💼 求职意向

自 2025 年 2 月起在昆士兰大学任职，现为研究员（Research Fellow）。我对学术界和工业界机会保持开放，尤其是围绕 **search agents、retrieval systems、efficient RAG、trustworthy evaluation** 与 **biomedical evidence technologies** 的岗位。欢迎随时联系。

{% include base_path %}

## 📰 最新动态

{% include news.html %}
<a href="/zh/news/" class="btn btn--primary btn--large" style="margin-top:1rem;">查看所有动态</a>

## 🏆 主要荣誉

<ul class="selected-awards">
{% assign featured_awards = site.awards | where: 'featured', true | sort: 'date' | reverse %}
{% for post in featured_awards %}
  <li class="selected-awards__item">
    <span class="selected-awards__year">{{ post.date | date: "%Y" }}</span>
    <span class="selected-awards__title">
      {% if post.link %}
        <a href="{{ post.link }}" target="_blank" rel="noopener">{{ post.title }}</a>
      {% else %}
        {{ post.title }}
      {% endif %}
    </span>
    {% if post.excerpt %}<span class="selected-awards__desc">{{ post.excerpt | strip_html }}</span>{% endif %}
  </li>
{% endfor %}
</ul>
<a href="/zh/awards/" class="btn btn--primary btn--large" style="margin-top:1rem;">查看全部荣誉 →</a>

## 🤝 学术服务

曾担任 **SIGIR 2026 Publicity Chair**，并持续为以下期刊和会议担任**程序委员会成员（审稿人）**：

### 📚 期刊
- **TOIS**：ACM信息系统学报
- **Journal of Data and Information Quality**

### 🏛️ 会议
- **ACM ICTIR** 2023、**SIGIR** 2024、**SIGIR** 2025、**SIGIR** 2026
- **ECIR** 2024、2025
- **WSDM** 2026
- **ACL 滚动审稿（ARR）** 2026（面向 ACL / EMNLP / NAACL / EACL 会议）

## 📝 学术论文

<p class="author-disambiguation"><em>本人论文均以 <strong>Shuai Wang</strong> 署名。学术界存在多位同名研究者，请通过我的 <a href="https://orcid.org/0000-0002-0726-5250" target="_blank" rel="noopener">ORCID（0000-0002-0726-5250）</a>、<a href="https://scholar.google.com/citations?user=JDKYomkAAAAJ&hl=en" target="_blank" rel="noopener">Google Scholar</a> 或 <a href="https://www.semanticscholar.org/author/Shuai-Wang/2113801108" target="_blank" rel="noopener">Semantic Scholar</a> 主页区分我与其他同名学者的成果。</em></p>

<ul>
{% assign type_order = "Long,Journal,Resource,Reproduce,Short,Notebook" | split: "," %}
{% assign date_sorted = site.publications | sort: 'date' | reverse %}
{% for type in type_order %}
  {% assign group = date_sorted | where: 'page_type', type %}
  {% for post in group %}
    {% include archive-single-cv.html %}
  {% endfor %}
{% endfor %}
</ul>

{% else %}

<div class="researcher-summary" markdown="1">

**Dr. Shuai Wang** is a Research Fellow at the [IELab](https://ielab.io/), University of Queensland, Australia. He works on **Information Retrieval (IR)**, **search agents**, **biomedical evidence search**, and **efficient RAG systems**. His papers appear at **SIGIR, WSDM, WWW, ECIR, EMNLP, and EACL**, with **{{ site.data.scholar_metrics.citations }}+ citations** on Google Scholar. He completed his PhD at the University of Queensland in 2025 under the supervision of [Professor Guido Zuccon](https://researchers.uq.edu.au/researcher/22857), [Associate Professor Bevan Koopman](https://bevankoopman.github.io/), and [Dr. Harrisen Scells](https://scells.me/), and now serves as **Course Coordinator and Lecturer** for INFS7410 (Information Retrieval and Web Search) at UQ.

</div>

## 🎓 Academic Background

- **Doctor of Philosophy** - University of Queensland (2025) [Read My Thesis](/files/thesis.pdf)
- **Master of Engineering Science** - University of Queensland (2021)
- **Bachelor of Science** - University of Western Australia (2019)

## 🔬 Research Focus

My current work is organised around a few concrete themes:

- **Search agents and deep-research workflows**: task decomposition, Boolean retrieval, structured inspect cards, section-level fetching, and tool-using agents
- **Biomedical evidence search and systematic reviews**: MeSH suggestion, screening prioritisation, Boolean query generation, seed-driven retrieval, and clinical evidence workflows
- **Efficient RAG and LLM systems**: context embeddings, retrieval-generation interfaces, KV-cache / memory optimisation, and more efficient inference pipelines
- **Adaptive retrieval and ranking**: 2D Matryoshka retrieval, routing, prompt variation studies, and more robust LLM-based rankers
- **Evaluation and infrastructure**: benchmarks, tooling, and reproducible evaluation for RAG, federated search, and agent workflows

## 👨‍🏫 Teaching & Mentoring

I serve as **Course Coordinator and Lecturer** for INFS7410 (Information Retrieval and Web Search) at UQ, teaching 120+ Master's students across classical IR, dense retrieval, LLMs for search, RAG, and evaluation. Previously, I tutored INFS7410, INFS7205, and DATA7901/7902/7903.

I mentor students on retrieval, RAG, and biomedical NLP projects; several have progressed to PhD scholarships and SIGIR/ECIR papers. If you are interested in research collaboration, please reach out.

## 🌍 Industry Experience

**Research Intern** at [Naver Labs Europe](https://europe.naverlabs.com/) (Feb-July 2024). I co-led COCOM from method design and implementation to experiments and WSDM 2025 publication, reducing RAG inference cost by **5.69x** at near-baseline answer quality.

## 💼 Job Opportunities

Since February 2025, I have been working at UQ — currently as a Research Fellow. I am open to academic and industry roles where **search agents, retrieval systems, efficient RAG, trustworthy evaluation**, or **biomedical evidence technologies** are central. If this matches your team, please feel free to reach out.

{% include base_path %}

## 📰 Latest News

{% include news.html %}
<a href="/news/" class="btn btn--primary btn--large" style="margin-top:1rem;">Read All News</a>

## 🏆 Selected Awards

<ul class="selected-awards">
{% assign featured_awards = site.awards | where: 'featured', true | sort: 'date' | reverse %}
{% for post in featured_awards %}
  <li class="selected-awards__item">
    <span class="selected-awards__year">{{ post.date | date: "%Y" }}</span>
    <span class="selected-awards__title">
      {% if post.link %}
        <a href="{{ post.link }}" target="_blank" rel="noopener">{{ post.title }}</a>
      {% else %}
        {{ post.title }}
      {% endif %}
    </span>
    {% if post.excerpt %}<span class="selected-awards__desc">{{ post.excerpt | strip_html }}</span>{% endif %}
  </li>
{% endfor %}
</ul>
<a href="/awards/" class="btn btn--primary btn--large" style="margin-top:1rem;">See all awards →</a>

## 🤝 Professional Services

I previously served as **Publicity Chair for SIGIR 2026**, and I contribute to the academic community as a **PC/SPC (reviewer) member** for:

### 📚 Journals
- **TOIS**: ACM Transactions on Information Systems
- **Journal of Data and Information Quality**

### 🏛️ Conferences
- **ACM ICTIR** 2023, **SIGIR** 2024, **SIGIR** 2025,  **SIGIR** 2026
- **ECIR** 2024, 2025
- **WSDM** 2026
- **ACL Rolling Review (ARR)** 2026 (feeds ACL / EMNLP / NAACL / EACL)

## 📝 Publications

<p class="author-disambiguation"><em>My publications are authored under the name <strong>Shuai Wang</strong>. As this is a common name in academia, please refer to my <a href="https://orcid.org/0000-0002-0726-5250" target="_blank" rel="noopener">ORCID (0000-0002-0726-5250)</a>, <a href="https://scholar.google.com/citations?user=JDKYomkAAAAJ&hl=en" target="_blank" rel="noopener">Google Scholar</a>, or <a href="https://www.semanticscholar.org/author/Shuai-Wang/2113801108" target="_blank" rel="noopener">Semantic Scholar</a> profile to disambiguate my work from other researchers with the same name.</em></p>

<ul>
{% assign type_order = "Long,Journal,Resource,Reproduce,Short,Notebook" | split: "," %}
{% assign date_sorted = site.publications | sort: 'date' | reverse %}
{% for type in type_order %}
  {% assign group = date_sorted | where: 'page_type', type %}
  {% for post in group %}
    {% include archive-single-cv.html %}
  {% endfor %}
{% endfor %}
</ul>

{% endif %}
