---
layout: single
header:
  overlay_color: "#000"
  overlay_filter: "0.5"
excerpt: "Shuai Wang - PhD student, Domain-specific search, Information Retrieval, NLP, Machine Learning"
permalink: /
title: "Shuai Wang (Dylan) UQ"
author_profile: true
redirect_from: 
  - /about/
  - /about.html
---

Howdy! I'm Shuai Wang, a PhD student who's been swimming in the deep end of academia for what feels like forever. I'm under the eagle eyes of [Professor. Guido Zuccon](https://researchers.uq.edu.au/researcher/22857), [A.Professor. Bevan Koopman](https://bevankoopman.github.io/), and [Dr. Harrisen Scells](https://scells.me/) (in Germany but still manages to keep tabs on me).

I snagged my Bachelor of Science degree from the University of Western Australia in 2019, then rolled the dice (not really, but it sounds cooler) and leveled up with a Master of Engineering Science degree from the University of Queensland in 2021.

Now, I am in the final-year(3rd-year) of my PhD, exploring the wilds of information retrieval, natural language processing (NLP), and machine learning like a data-loving Indiana Jones. I'm also eyeing security and CV, but I'm still figuring out if I'm ready to dive into that pool.

I'm currently working on automation for medical systematic reviews, where I have been currently focused on the development of Automatic Mesh Term Suggestion, Screening Prioritisation, Seed-drievn methods and Boolean query formulation.

I also moonlight as a tutor at UQ, teaching courses like INFS7410 (information retrieval and web search). I'm not in it for the cash, but for the chance to scout for other brainiacs to collaborate with. So, if you're interested, let's chat and see if we can cook up some research magic together (and yes, you'll get first author credit if we hit the jackpot).


### Internship

I'm currently conducting my internship at [Naver Lab Europe](https://europe.naverlabs.com/), with research focus on Large Language Models.

{% include base_path %}

## News

{% assign max_news = 3 %} <!-- Set maximum number of news items to display -->
{% assign news_count = 0 %}

{% for news in site.data.news reversed %}
  {% if news_count < max_news %}
    <div class="news-item">
      <!-- Display different icons based on news status -->
      {% case news.status %}
        {% when "travel" %}
          <span class="news-status"><i class="fas fa-plane"></i></span>
        {% when "home" %}
          <span class="news-status"><i class="fas fa-home"></i></span>
        {% else %}
          <span class="news-status"><i class="fas fa-wine-glass"></i></span>
      {% endcase %}

      <!-- Display news date -->
      <span class="news-date">{{ news.date | date: "%B %d, %Y" }}</span>

      <!-- Display news title -->
      <h3 class="news-title">{{ news.title }}</h3>

      <!-- Optional news description -->
      {% if news.description %}
        <p class="news-description">{{ news.description }}</p>
      {% endif %}

      <!-- Optional news link -->
      {% if news.url %}
        <a href="{{ news.url }}" class="news-link">Read more</a>
      {% endif %}
    </div>
    {% assign news_count = news_count | plus: 1 %}
  {% endif %}
{% endfor %}

<!-- Link to view all news if there are more than the maximum number displayed -->
{% if site.data.news.size > max_news %}
  <a href="/news/" class="read-more-link">Read all news</a>
{% endif %}



## Services

I serve as a reviewer/PC member for the following journal/conference:

- TOIS: ACM Transactions on Information Systems
- Journal of Data and Information Quality
- ACM ICTIR 2023, SIGIR2024


## Publications

<ul>
{% assign sorted_publications = site.publications | sort: 'date' | reverse %}
{% for post in sorted_publications %}
  {% include archive-single-cv.html %}
{% endfor %}
</ul>


