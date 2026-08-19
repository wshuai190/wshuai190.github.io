---
layout: archive
title: "Curriculum Vitae"
permalink: /cv/
author_profile: false
hide_title: true
redirect_from:
  - /resume
---

{% include base_path %}

{% if site.active_lang == 'zh' %}

<div class="cv-page">

<header class="cv-document-header">
  <div class="cv-document-header__identity">
    <p class="cv-document-header__label">个人简历</p>
    <h1 class="cv-document-header__name">王率博士（Dylan）<span class="cv-document-header__life-range">{{ site.author_zh.life_range }}</span></h1>
    <p class="cv-document-header__role">昆士兰大学 IElab 研究员</p>
    <p class="cv-document-header__summary">研究方向包括 information retrieval、efficient LLM systems、retrieval-augmented generation、search agents 与医学证据检索；以第一作者在 SIGIR、WSDM、WWW、ECIR 和 EACL 发表论文。</p>
    <p class="cv-document-header__contact">
      <span>Brisbane, Australia</span>
      <span><a href="mailto:shuai.wang2@uq.edu.au">shuai.wang2@uq.edu.au</a></span>
      <span><a href="https://scholar.google.com/citations?user=JDKYomkAAAAJ&hl=en" target="_blank" rel="noopener">Google Scholar</a></span>
      <span><a href="https://github.com/wshuai190" target="_blank" rel="noopener">GitHub</a></span>
      <span><a href="https://ielab.io/skim-search-agent/" target="_blank" rel="noopener">SkimSearchAgent</a></span>
    </p>
  </div>
  <figure class="cv-document-header__photo">
    <img src="{{ site.baseurl }}/images/profile/animated-dylan.png" alt="王率的插画头像" class="cv-document-header__image">
  </figure>
</header>

<div class="cv-section">

<h2 class="cv-section__heading">简介</h2>

<p class="cv-profile">专注于构建高效、可检视、可落地的检索与生成系统，尤其面向深度研究流程、系统综述检索与高风险信息场景。</p>

</div>

<div class="cv-section">

<h2 class="cv-section__heading">教育背景</h2>

<div class="cv-timeline">
  <div class="cv-timeline__item">
    <div class="cv-timeline__date">2025</div>
    <div class="cv-timeline__body">
      <strong>哲学博士</strong> — 昆士兰大学，昆士兰州<br>
      <a href="/files/thesis.pdf">阅读我的论文</a>
    </div>
  </div>
  <div class="cv-timeline__item">
    <div class="cv-timeline__date">2021</div>
    <div class="cv-timeline__body">
      <strong>工程科学硕士</strong> — 昆士兰大学，昆士兰州
    </div>
  </div>
  <div class="cv-timeline__item">
    <div class="cv-timeline__date">2019</div>
    <div class="cv-timeline__body">
      <strong>理学学士</strong> — 西澳大利亚大学，西澳州
    </div>
  </div>
</div>

</div>

<hr>

<div class="cv-section">

<h2 class="cv-section__heading">工作经历</h2>

<div class="cv-timeline">
  <div class="cv-timeline__item">
    <div class="cv-timeline__date">2025–至今</div>
    <div class="cv-timeline__body">
      <strong>研究员（Research Fellow）</strong> — 昆士兰大学 IeLab<br>
      导师：Prof. Guido Zuccon
    </div>
  </div>
  <div class="cv-timeline__item">
    <div class="cv-timeline__date">2024</div>
    <div class="cv-timeline__body">
      <strong>研究实习生</strong> — Naver Labs Europe (Grenoble, France)<br>
      <span class="cv-timeline__period">2024年2月 – 7月</span><br>
      研究方向：检索增强生成（RAG）的上下文压缩
    </div>
  </div>
  <div class="cv-timeline__item">
    <div class="cv-timeline__date">2022–2025</div>
    <div class="cv-timeline__body">
      <strong>助教</strong> — 昆士兰大学<br>
      <span class="cv-timeline__period">2022年2月 – 2025年7月</span><br>
      课程：INFS7205、INFS7410、DATA7901及7902/7903<br>
      课程负责人：Prof. Helen Huang、A/Prof. Guido Zuccon、Dr. Miao Xu
    </div>
  </div>
  <div class="cv-timeline__item">
    <div class="cv-timeline__date">2021</div>
    <div class="cv-timeline__body">
      <strong>研究助理</strong> — 昆士兰大学<br>
      <span class="cv-timeline__period">2021年7月 – 9月</span><br>
      参与TREC竞赛及神经信息检索项目<br>
      导师：A/Prof. Guido Zuccon
    </div>
  </div>
</div>

</div>

<hr>

<div class="cv-section">

<h2 class="cv-section__heading">学术论文</h2>

<ul>{% for post in site.publications %}
  {% include archive-single-cv.html %}
{% endfor %}</ul>

</div>

<hr>

<div class="cv-section">

<h2 class="cv-section__heading">学术报告</h2>

<ul>{% for post in site.talks %}
  {% include archive-single-talk-cv.html %}
{% endfor %}</ul>

</div>

<hr>

<div class="cv-section">

<h2 class="cv-section__heading">教学经历</h2>

<ul>{% for post in site.teaching %}
  {% include archive-single-cv.html %}
{% endfor %}</ul>

</div>

<hr>

<div class="cv-section">

<h2 class="cv-section__heading">荣誉与奖项</h2>

<ul>{% for post in site.awards %}
  {% include archive-single-cv.html %}
{% endfor %}</ul>

</div>

</div>

{% else %}

<div class="cv-page">

<header class="cv-document-header">
  <div class="cv-document-header__identity">
    <p class="cv-document-header__label">Curriculum Vitae</p>
    <h1 class="cv-document-header__name">Dr. Shuai Wang (Dylan)<span class="cv-document-header__life-range">{{ site.author.life_range }}</span></h1>
    <p class="cv-document-header__role">Research Fellow, IElab, The University of Queensland</p>
    <p class="cv-document-header__summary">Research in information retrieval, efficient LLM systems, retrieval-augmented generation, search agents, and evidence-based medicine search, with first-author work at SIGIR, WSDM, WWW, ECIR, and EACL.</p>
    <p class="cv-document-header__contact">
      <span>Brisbane, Australia</span>
      <span><a href="mailto:shuai.wang2@uq.edu.au">shuai.wang2@uq.edu.au</a></span>
      <span><a href="https://scholar.google.com/citations?user=JDKYomkAAAAJ&hl=en" target="_blank" rel="noopener">Google Scholar</a></span>
      <span><a href="https://github.com/wshuai190" target="_blank" rel="noopener">GitHub</a></span>
      <span><a href="https://ielab.io/skim-search-agent/" target="_blank" rel="noopener">SkimSearchAgent</a></span>
    </p>
  </div>
  <figure class="cv-document-header__photo">
    <img src="{{ site.baseurl }}/images/profile/animated-dylan.png" alt="Illustrated portrait of Shuai Wang" class="cv-document-header__image">
  </figure>
</header>

<div class="cv-section">

<h2 class="cv-section__heading">Profile</h2>

<p class="cv-profile">I build search and LLM systems that are effective, efficient, and inspectable for expert workflows, with a focus on deep-research agents, systematic review search, and evidence-grounded generation.</p>

</div>

<div class="cv-section">

<h2 class="cv-section__heading">Education</h2>

<div class="cv-timeline">
  <div class="cv-timeline__item">
    <div class="cv-timeline__date">2025</div>
    <div class="cv-timeline__body">
      <strong>Doctor of Philosophy</strong> — University of Queensland, QLD<br>
      <a href="/files/thesis.pdf">Read My Thesis</a>
    </div>
  </div>
  <div class="cv-timeline__item">
    <div class="cv-timeline__date">2021</div>
    <div class="cv-timeline__body">
      <strong>Master of Science</strong> — University of Queensland, QLD
    </div>
  </div>
  <div class="cv-timeline__item">
    <div class="cv-timeline__date">2019</div>
    <div class="cv-timeline__body">
      <strong>Bachelor of Science</strong> — University of Western Australia, WA
    </div>
  </div>
</div>

</div>

<hr>

<div class="cv-section">

<h2 class="cv-section__heading">Work Experience</h2>

<div class="cv-timeline">
  <div class="cv-timeline__item">
    <div class="cv-timeline__date">2025–present</div>
    <div class="cv-timeline__body">
      <strong>Research Fellow</strong> — University of Queensland, IELab<br>
      Supervisor: Prof. Guido Zuccon
    </div>
  </div>
  <div class="cv-timeline__item">
    <div class="cv-timeline__date">2024</div>
    <div class="cv-timeline__body">
      <strong>Research Intern</strong> — Naver Labs Europe, Grenoble, France<br>
      <span class="cv-timeline__period">February – July 2024</span><br>
      Research on context compression for Retrieval-Augmented Generation (RAG)
    </div>
  </div>
  <div class="cv-timeline__item">
    <div class="cv-timeline__date">2022–2025</div>
    <div class="cv-timeline__body">
      <strong>Teaching Assistant</strong> — University of Queensland<br>
      <span class="cv-timeline__period">February 2022 – July 2025</span><br>
      Courses: INFS7205, INFS7410, DATA7901 &amp; 7902/7903<br>
      Course Coordinators: Professor Helen Huang, A. Professor Guido Zuccon, Dr. Miao Xu
    </div>
  </div>
  <div class="cv-timeline__item">
    <div class="cv-timeline__date">2021</div>
    <div class="cv-timeline__body">
      <strong>Research Assistant</strong> — University of Queensland<br>
      <span class="cv-timeline__period">July – September 2021</span><br>
      Participated in the TREC Competition and worked on Neural Information Retrieval projects.<br>
      Supervisor: A. Professor Guido Zuccon
    </div>
  </div>
</div>

</div>

<hr>

<div class="cv-section">

<h2 class="cv-section__heading">Publications</h2>

<ul>{% for post in site.publications %}
  {% include archive-single-cv.html %}
{% endfor %}</ul>

</div>

<hr>

<div class="cv-section">

<h2 class="cv-section__heading">Talks</h2>

<ul>{% for post in site.talks %}
  {% include archive-single-talk-cv.html %}
{% endfor %}</ul>

</div>

<hr>

<div class="cv-section">

<h2 class="cv-section__heading">Teaching</h2>

<ul>{% for post in site.teaching %}
  {% include archive-single-cv.html %}
{% endfor %}</ul>

</div>

<hr>

<div class="cv-section">

<h2 class="cv-section__heading">Awards</h2>

<ul>{% for post in site.awards %}
  {% include archive-single-cv.html %}
{% endfor %}</ul>

</div>

</div>

{% endif %}
