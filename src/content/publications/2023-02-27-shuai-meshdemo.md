---
title: "MeSH Suggester: A Library and System for MeSH Term Suggestion for Systematic Review Boolean Query Construction"
collection: publications
permalink: /publication/2023-02-27-shuai-meshdemo
excerpt: 
date: 2023-02-27
page_type: "Demo"
venue: "Proceedings of the Sixteenth ACM International Conference on Web Search and Data Mining (WSDM 2023)"
paperurl: 'https://dl.acm.org/doi/abs/10.1145/3539597.3573025'
demo: 'https://huggingface.co/spaces/ielabgroup/mesh-suggester'
citation: 'Shuai Wang and Hang Li and Guido Zuccon. 2023. MeSH Suggester: A Library and System for MeSH Term Suggestion for Systematic Review Boolean Query Construction. In Proceedings of the Sixteenth ACM International Conference on Web Search and Data Mining (WSDM 2023).'
topic: 'evidence'
doi: '10.1145/3539597.3573025'
arxiv: '2212.09018'
---

## Abstract
Boolean query construction is often critical for medical systematic review literature search. To create an effective Boolean query, systematic review researchers typically spend weeks coming up with effective query terms and combinations. One challenge to creating an effective systematic review Boolean query is the selection of effective MeSH Terms to include in the query. In our previous work, we created neural MeSH term suggestion methods and compared them to state-of-the-art MeSH term suggestion methods. We found neural MeSH term suggestion methods to be highly effective.

In this demonstration, we build upon our previous work by creating (1) a Web-based MeSH term suggestion prototype system that allows users to obtain suggestions from a number of underlying methods and (2) a Python library that implements ours and others’ MeSH term suggestion methods and that is aimed at researchers who want to further investigate, create or deploy such type of methods. We describe the architecture of the web-based system and how to use it for the MeSH term suggestion task. For the Python library, we describe how the library can be used for advancing further research and experimentation, and we validate the results of the methods contained in the library on standard datasets. Our web-based prototype system is available at http://ielab-mesh-suggest.uqcloud.net, while our Python library is at https://github.com/ielab/meshsuggestlib.