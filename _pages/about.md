---
layout: single
header:
  overlay_color: "#000"
  overlay_filter: "0.5"
excerpt: "Shuai Wang - Postdoc and Finishing PhD Student, Domain-specific search, Information Retrieval, NLP, Machine Learning"
permalink: /
title: "Shuai Wang (Dylan) UQ"
author_profile: true
redirect_from: 
  - /about/
  - /about.html
---

Howdy! I'm Shuai Wang, a Postdoc and a finishing PhD student at IeLab, UQ. I'm under the eagle eyes of [Professor. Guido Zuccon](https://researchers.uq.edu.au/researcher/22857), [A.Professor. Bevan Koopman](https://bevankoopman.github.io/), and [Dr. Harrisen Scells](https://scells.me/).

I received my Bachelor of Science degree from the University of Western Australia in 2019, then obtained a Master of Engineering Science degree from the University of Queensland in 2021.

My research is strongly related to information retrieval and natural language processing (NLP). My PhD topic focuses on domain-specific applications (automation for medical systematic reviews), where I have been currently focused on the development of Automatic Mesh Term Suggestion, Screening Prioritisation, Seed-driven methods and Boolean query formulation. I also do some side projects on general IR and NLP tasks, such as Federated RAG, Fusion of Rankers etc.

I'm also a tutor at UQ, teaching courses like INFS7410 (information retrieval and web search). I'm not in it for the cash but for the chance to scout for other brainiacs to collaborate with. So, if you're interested, let's chat and see if we can cook up some research magic together!

I conducted my internship at [Naver Lab Europe](https://europe.naverlabs.com/) Feb-July 2024, with a research focus on Context Compression on Retrieval-augmented generation (RAG).

### Job Opportunities

I'm currently working as a Postdoc at UQ, starting from Feb, 2025; I'm also looking for continued job opportunities in academia and industry. If you think I'm a good fit for your team, please feel free to contact me.

{% include base_path %}


## News
<ul>
{% include news.html %}
<a href="/news/" class="read-more-link">Read all news</a>
</ul>



## Services

I serve as a reviewer/PC member for the following journal/conference:

- TOIS: ACM Transactions on Information Systems
- ACM ICTIR 2023, SIGIR2024, SIGIR2025
- ECIR2024
- Campbell Systematic Reviews
- Journal of Data and Information Quality



## Publications

<ul>
{% assign sorted_publications = site.publications | sort: 'date' | reverse %}
{% for post in sorted_publications %}
  {% include archive-single-cv.html %}
{% endfor %}
</ul>


