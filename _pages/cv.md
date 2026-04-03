---
layout: archive
title: "Curriculum Vitae"
permalink: /cv/
author_profile: true
redirect_from:
  - /resume
---

{% include base_path %}

{% if site.active_lang == 'zh' %}

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

---

<div class="cv-section">

<h2 class="cv-section__heading">工作经历</h2>

<div class="cv-timeline">
  <div class="cv-timeline__item">
    <div class="cv-timeline__date">2025–至今</div>
    <div class="cv-timeline__body">
      <strong>博士后研究员</strong> — 昆士兰大学 IeLab<br>
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
    <div class="cv-timeline__date">2022–</div>
    <div class="cv-timeline__body">
      <strong>助教</strong> — 昆士兰大学<br>
      <span class="cv-timeline__period">2022年2月起</span><br>
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

---

<div class="cv-section">

<h2 class="cv-section__heading">学术论文</h2>

<ul>{% for post in site.publications %}
  {% include archive-single-cv.html %}
{% endfor %}</ul>

</div>

---

<div class="cv-section">

<h2 class="cv-section__heading">学术报告</h2>

<ul>{% for post in site.talks %}
  {% include archive-single-talk-cv.html %}
{% endfor %}</ul>

</div>

---

<div class="cv-section">

<h2 class="cv-section__heading">教学经历</h2>

<ul>{% for post in site.teaching %}
  {% include archive-single-cv.html %}
{% endfor %}</ul>

</div>

---

<div class="cv-section">

<h2 class="cv-section__heading">荣誉与奖项</h2>

<ul>{% for post in site.awards %}
  {% include archive-single-cv.html %}
{% endfor %}</ul>

</div>

{% else %}

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

---

<div class="cv-section">

<h2 class="cv-section__heading">Work Experience</h2>

<div class="cv-timeline">
  <div class="cv-timeline__item">
    <div class="cv-timeline__date">2025–present</div>
    <div class="cv-timeline__body">
      <strong>Postdoctoral Research Fellow</strong> — University of Queensland, IELab<br>
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
    <div class="cv-timeline__date">2022–2024</div>
    <div class="cv-timeline__body">
      <strong>Teaching Assistant</strong> — University of Queensland<br>
      <span class="cv-timeline__period">From February 2022</span><br>
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

---

<div class="cv-section">

<h2 class="cv-section__heading">Publications</h2>

<ul>{% for post in site.publications %}
  {% include archive-single-cv.html %}
{% endfor %}</ul>

</div>

---

<div class="cv-section">

<h2 class="cv-section__heading">Talks</h2>

<ul>{% for post in site.talks %}
  {% include archive-single-talk-cv.html %}
{% endfor %}</ul>

</div>

---

<div class="cv-section">

<h2 class="cv-section__heading">Teaching</h2>

<ul>{% for post in site.teaching %}
  {% include archive-single-cv.html %}
{% endfor %}</ul>

</div>

---

<div class="cv-section">

<h2 class="cv-section__heading">Awards</h2>

<ul>{% for post in site.awards %}
  {% include archive-single-cv.html %}
{% endfor %}</ul>

</div>

{% endif %}
