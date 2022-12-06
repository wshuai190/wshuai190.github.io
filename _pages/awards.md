---
layout: archive
title: "Awards"
permalink: /awards/
author_profile: true
---


{% include base_path %}

{% for post in site.talks reversed %}
  {% include archive-single-talk.html %}
{% endfor %}