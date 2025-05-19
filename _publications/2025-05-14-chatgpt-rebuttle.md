---
title: "Reassessing Large Language Model Boolean Query Generation for Systematic Reviews"
collection: publications
permalink: /publication/2025-05-14-chatgpt-rebuttle
excerpt: 
date: 2025-05-14
page_type: "Reproduce"
venue: 'Accepted SIGIR-2025'
paperurl: 'https://arxiv.org/abs/2505.07155'
citation: 'Shuai Wang, Harrisen Scells, Bevan Koopman and Guido Zuccon. 2025. Reassessing Large Language Model Boolean Query Generation for Systematic Reviews. (Accepted SIGIR-2025).'
---
## Abstract
Systematic reviews are comprehensive literature reviews that address highly focused research questions and represent the highest form of evidence in medicine. A critical step in this process is the development of complex Boolean queries to retrieve relevant literature. Given the difficulty of manually constructing these queries, recent efforts have explored Large Language Models (LLMs) to assist in their formulation. One of the first studies,Wang et al., investigated ChatGPT for this task, followed by Staudinger et al., which evaluated multiple LLMs in a reproducibility study. However, the latter overlooked several key aspects of the original work, including (i) validation of generated queries, (ii) output formatting constraints, and (iii) selection of examples for chain-of-thought (Guided) prompting. As a result, its findings diverged significantly from the original study. In this work, we systematically reproduce both studies while addressing these overlooked factors. Our results show that query effectiveness varies significantly across models and prompt designs, with guided query formulation benefiting from well-chosen seed studies. Overall, prompt design and model selection are key drivers of successful query formulation. Our findings provide a clearer understanding of LLMs' potential in Boolean query generation and highlight the importance of model- and prompt-specific optimisations. The complex nature of systematic reviews adds to challenges in both developing and reproducing methods but also highlights the importance of reproducibility studies in this domain.