---
title: "Search, Inspect, Fetch: Exploiting Structure-Aware Boolean Retrieval for Deep-Research Agents"
collection: publications
permalink: /publication/2026-08-03-search-inspect-fetch
excerpt:
date: 2026-08-03
page_type: "Long"
venue: 'arXiv preprint (2026)'
paperurl: 'https://arxiv.org/abs/2608.02751'
project: 'https://ielab.io/skim-search-agent/'
citation: 'Shuai Wang, Haodong Chen, Yu Yin, Shengyao Zhuang, Bevan Koopman and Guido Zuccon. 2026. Search, Inspect, Fetch: Exploiting Structure-Aware Boolean Retrieval for Deep-Research Agents. arXiv preprint arXiv:2608.02751.'
---
## Abstract
Existing deep-research agents typically follow a search-visit workflow that retrieves whole webpages without using the structure already exposed by titles, headings, sections, and metadata. This limits the agent's ability to target specific parts of a page and often sends unnecessary content into the context window. In this work, we introduce **Sieve**, a search-inspect-fetch strategy built around a Boolean Query Language (BQL). It filters candidates with field-aware Boolean search, ranks them, presents structure-rich inspection cards, and fetches only the selected sections. Across three question-answering collections, Sieve is more accurate than a strong conventional search-visit baseline while using substantially fewer tokens. The implementation is released in the SkimSearchAgent project.
