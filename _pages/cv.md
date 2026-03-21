---
layout: archive
title: "Curriculum Vitae"
permalink: /cv/
author_profile: true
redirect_from:
  - /resume
---

{% include base_path %}

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
    <div class="cv-timeline__date">2021</div>
    <div class="cv-timeline__body">
      <strong>Research Assistant</strong> — University of Queensland<br>
      <span class="cv-timeline__period">July – September 2021</span><br>
      Participated in the TREC Competition and worked on Neural Information Retrieval projects.<br>
      Supervisor: A. Professor Guido Zuccon
    </div>
  </div>
  <div class="cv-timeline__item">
    <div class="cv-timeline__date">2022–</div>
    <div class="cv-timeline__body">
      <strong>Teaching Assistant</strong> — University of Queensland<br>
      <span class="cv-timeline__period">From February 2022</span><br>
      Courses: INFS7205, INFS7410, DATA7901 &amp; 7902/7903<br>
      Course Coordinators: Professor Helen Huang, A. Professor Guido Zuccon, Dr. Miao Xu
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

