---
layout: single
header:
  overlay_color: "#000"
  overlay_filter: "0.5"
excerpt: "Shuai Wang - PhD student, Professional search, Information Retrieval, NLP, Machine Learning"
permalink: /
title: "Shuai Wang (Dylan) UQ"
author_profile: true
redirect_from: 
  - /about/
  - /about.html
---

Shuai Wang is a dedicated PhD student working under the supervision of [Dr. Guido Zuccon](https://ielab.io/people/guido-zuccon.html), [Dr. Bevan Koopman](https://bevankoopman.github.io/) and unofficial supervisor [Dr. Harrisen Scells](https://scells.me/). He earned his Bachelor of Science degree from the University of Western Australia in December 2019 and completed his Master of Engineering Science degree at the University of Queensland in July 2021. Shuai is passionate about exploring various research areas, including information retrieval, natural language processing (NLP), machine learning, and security. You can learn more about his academic background and research projects at [here](https://ielab.io/people/shuai-wang).

### Internship Opportunities

Shuai is actively seeking internship opportunities for 2023, starting from November or December. If you have an opening that aligns with his research interests and expertise, please don't hesitate to reach out by email. Thank you for your consideration!

{% include base_path %}

## News

{% for news in site.data.news reversed %}
<div class="news-item">
  {% if news.status == "travel" %}
  <span class="news-status"><i class="fas fa-plane"></i></span>
  {% else if news.status == "home" %}
  <span class="news-status"><i class="fas fa-home"></i></span>
  {% else %}
  <span class="news-status"><i class="fa-solid fa-party-horn"></i></span>
  {% endif %}
  <span class="news-date">{{ news.date | date: "%B %d, %Y" }}</span>
  <h3 class="news-title">{{ news.title }}</h3>
  {% if news.description %}
  <p class="news-description">{{ news.description }}</p>
  {% endif %}
  {% if news.url %}
  <a href="{{ news.url }}" class="news-link">Read more</a>
  {% endif %}
</div>
{% endfor %}



## Publications

<ul>{% for post in site.publications %}
  {% include archive-single-cv.html %}
{% endfor %}</ul>

