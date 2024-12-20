---
title: "Zero-shot Generative Large Language Models for Systematic Review Screening Automation"
collection: publications
permalink: /publication/2024-04-03-sunprompting
excerpt: 
date: 2024-04-03
page_type: "Long"
venue: 'ECIR-2025'
paperurl: 'https://arxiv.org/pdf/2406.14117'
citation: 'Shuoqi Sun, Shengyao Zhuang, Shuai Wang and Guido Zuccon. 2024. Zero-shot Generative Large Language Models for Systematic Review Screening Automation. (Accepted in ECIR 2025).'
---
## Abstract
We provide a systematic understanding of the impact of specific components and wordings used in prompts on the effectiveness of rankers based on zero-shot Large Language Models (LLMs). Several zero-shot ranking methods based on LLMs have recently been proposed. Among many aspects, methods differ across (1) the ranking algorithm they implement, e.g., pointwise vs. listwise, (2) the backbone LLMs used, e.g., GPT3.5 vs. FLAN-T5, (3) the components and wording used in prompts, e.g., the use or not of role-definition (role-playing) and the actual words used to express this. It is currently unclear whether performance differences are due to the underlying ranking algorithm, or because of spurious factors such as better choice of words used in prompts. This confusion risks to undermine future research. Through our large-scale experimentation and analysis, we find that ranking algorithms do contribute to differences between methods for zero-shot LLM ranking. However, so do the LLM backbones -- but even more importantly, the choice of prompt components and wordings affect the ranking. In fact, in our experiments, we find that, at times, these latter elements have more impact on the ranker's effectiveness than the actual ranking algorithms, and that differences among ranking methods become more blurred when prompt variations are considered.