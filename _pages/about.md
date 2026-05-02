---
layout: single
header:
  overlay_color: "#0f172a"
  overlay_filter: "0.5"
  tagline: "Postdoctoral Researcher · Efficient LLM & Retrieval Systems · RAG"
permalink: /
title: "Dr. Shuai Wang (Dylan)"
author_profile: true
redirect_from:
  - /about/
  - /about.html
---

{% if site.active_lang == 'zh' %}

<div class="researcher-summary" markdown="1">

**王率博士（Dr. Shuai Wang / Dylan Wang）**现任澳大利亚昆士兰大学 [IELab](https://ielab.io/) 博士后研究员。研究方向为**信息检索（IR）**、**自然语言处理（NLP）**和**检索增强生成（RAG）**，致力于构建高效、可靠、可复现的 AI 搜索系统。已在 **SIGIR、WSDM、WWW、ECIR、EMNLP、EACL** 等顶级会议发表 **20 余篇同行评审论文**，Google Scholar 引用累计 **{{ site.data.scholar_metrics.citations }} 余次**，h-index 为 **{{ site.data.scholar_metrics.h_index }}**。2025 年于昆士兰大学完成博士学位，现担任 INFS7410（信息检索与网络搜索）课程**主讲教师与课程协调员**，以及 **SIGIR 2026 的 Communications Chair**。代表性工作包括 COCOM（RAG 推理 5.69 倍加速）、AutoBool（基于强化学习的医学系统综述 Boolean query 生成）以及 BERGEN/FeB4RAG（可复现 RAG 评测工具）。

</div>

## 👋 欢迎！

大家好，我是**王率（Dylan）**，现任[昆士兰大学 IeLab](https://ielab.io/)博士后研究员，研究高效、可靠的 AI 搜索系统，方向涵盖信息检索、LLM 与检索增强生成（RAG）。我关注的不只是模型效果，也关注系统在真实场景中的速度、成本、可复现性和可信度。

我在[Prof. Guido Zuccon](https://researchers.uq.edu.au/researcher/22857)、[A/Prof. Bevan Koopman](https://bevankoopman.github.io/)和[Dr. Harrisen Scells](https://scells.me/)的指导下完成了博士学位。

## 🎓 教育背景

- **哲学博士** — 昆士兰大学 (2025) [阅读我的论文](/files/thesis.pdf)
- **工程科学硕士** — 昆士兰大学 (2021)
- **理学学士** — 西澳大利亚大学 (2019)

## 🔬 研究方向

我的研究重点是把检索与生成结合成可部署的系统：

- **高效 RAG 与 LLM 推理**：context embeddings、KV-cache/内存优化，以及检索与生成共享表示
- **医学证据检索**：MeSH 术语建议、筛选优先排序、种子驱动方法、Boolean query 构建和临床问答
- **评测与基准**：面向 RAG 与联邦搜索的可复现实验工具，包括 BERGEN 和 FeB4RAG
- **自适应检索与排序**：2D Matryoshka retrieval、prompt variation 研究和更稳健的 LLM rankers

## 👨‍🏫 教学与指导

目前担任昆士兰大学 INFS7410（信息检索与网络搜索）课程的**课程协调员与主讲教师**，面向 120+ 名硕士生讲授 classical IR、dense retrieval、LLMs for search、RAG 和 evaluation。2021 至 2024 年期间曾担任 INFS7410、INFS7205 及 DATA7901/7902/7903 等多门课程的助教。

我也指导学生开展 retrieval、RAG 与 biomedical NLP 研究；已有学生获得博士奖学金并发表 SIGIR/ECIR 相关论文。如果您对研究合作感兴趣，欢迎联系我。

## 🌍 工业界经历

**研究实习生** 于[Naver Labs Europe](https://europe.naverlabs.com/)（2024年2月至7月）。我共同主导 COCOM，从方法设计、实现、实验到 WSDM 2025 论文发表，最终在接近基线质量的情况下实现 **5.69x RAG 推理加速**。

## 💼 求职意向

自 2025 年 2 月起在昆士兰大学担任博士后研究员。我对学术界和工业界机会保持开放，尤其是 efficient LLM systems、search/RAG、trustworthy evaluation 和 biomedical evidence technologies 相关岗位。欢迎随时联系。

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

**Dr. Shuai Wang (Dylan Wang)** is a Postdoctoral Research Fellow at the [IELab](https://ielab.io/), University of Queensland, Australia. His research lies in **Information Retrieval (IR)**, **Natural Language Processing (NLP)**, and **Retrieval-Augmented Generation (RAG)**, with a focus on building efficient, reliable, and reproducible AI search systems. Dr. Wang has authored **20+ peer-reviewed papers** in top-tier venues including **SIGIR, WSDM, WWW, ECIR, EMNLP, and EACL**, accumulating **{{ site.data.scholar_metrics.citations }}+ citations** with an **h-index of {{ site.data.scholar_metrics.h_index }}**. He completed his PhD at the University of Queensland in 2025 and currently serves as **Course Coordinator and Lecturer** for INFS7410 (Information Retrieval and Web Search) at UQ, and as the **Communications Chair for SIGIR 2026**. Representative work includes COCOM (a 5.69× RAG inference speedup), AutoBool (reinforcement-learned Boolean query generation for medical systematic reviews), and BERGEN/FeB4RAG (reproducible RAG evaluation tooling).

</div>

## 👋 Welcome!

I'm **Shuai Wang (Dylan)**, a Postdoctoral Researcher at [IeLab, UQ](https://ielab.io/) working on efficient LLM and retrieval systems. I build search and RAG methods that make AI systems faster, cheaper, and easier to evaluate, especially for evidence-based medicine and other high-stakes information work.

I completed my PhD under the guidance of [Professor Guido Zuccon](https://researchers.uq.edu.au/researcher/22857), [Associate Professor Bevan Koopman](https://bevankoopman.github.io/), and [Dr. Harrisen Scells](https://scells.me/).

## 🎓 Academic Background

- **Doctor of Philosophy** - University of Queensland (2025) [Read My Thesis](/files/thesis.pdf)
- **Master of Engineering Science** - University of Queensland (2021)
- **Bachelor of Science** - University of Western Australia (2019)

## 🔬 Research Focus

My work connects information retrieval, NLP, and AI systems:

- **Efficient RAG and LLM inference**: context embeddings, KV-cache/memory optimisation, and unified retrieval-generation representations
- **Evidence-based medicine search**: MeSH suggestion, screening prioritisation, seed-driven methods, Boolean query generation, and clinical question answering
- **Evaluation infrastructure**: benchmarks and open-source tools for RAG and federated search, including BERGEN and FeB4RAG
- **Adaptive retrieval and ranking**: 2D Matryoshka retrieval, prompt variation studies, and robust LLM-based rankers

## 👨‍🏫 Teaching & Mentoring

I serve as **Course Coordinator and Lecturer** for INFS7410 (Information Retrieval and Web Search) at UQ, teaching 120+ Master's students across classical IR, dense retrieval, LLMs for search, RAG, and evaluation. Previously, I tutored INFS7410, INFS7205, and DATA7901/7902/7903.

I mentor students on retrieval, RAG, and biomedical NLP projects; several have progressed to PhD scholarships and SIGIR/ECIR papers. If you are interested in research collaboration, please reach out.

## 🌍 Industry Experience

**Research Intern** at [Naver Labs Europe](https://europe.naverlabs.com/) (Feb-July 2024). I co-led COCOM from method design and implementation to experiments and WSDM 2025 publication, reducing RAG inference cost by **5.69x** at near-baseline answer quality.

## 💼 Job Opportunities

Since February 2025, I have been working as a Postdoctoral Researcher at UQ. I am open to academic and industry roles where efficient LLM systems, search/RAG, trustworthy evaluation, or biomedical evidence technologies are central. If this matches your team, please feel free to reach out.

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
