---
title: "Can It Reach the Generator? Investigating the Survival of Prompt-Injection Attacks in Realistic RAG Settings"
collection: publications
permalink: /publication/2026-07-27-geo-injection-rag-survival
excerpt: 
date: 2026-07-27
page_type: "Long"
venue: 'arXiv preprint (2026)'
paperurl: 'https://arxiv.org/abs/2605.28017'
citation: 'Yu Yin, Shuai Wang, Bevan Koopman and Guido Zuccon. 2026. Can It Reach the Generator? Investigating the Survival of Prompt-Injection Attacks in Realistic RAG Settings. arXiv preprint arXiv:2605.28017.'
---
## Abstract
Recent generative engine optimisation (GEO) research has shown that prompt-injection attacks can push a target product to the top of an LLM's recommendation list, with the strongest attacks reporting very high success rates and raising serious security concerns about RAG-based recommendation. However, these results assume the attacked document is always fed directly to the generator, bypassing the retriever and reranker. This is unrealistic: in deployed RAG systems, the attack modifies the document content, which can in turn change whether the document is retrieved and reranked highly enough to reach the generator at all. In this paper, we re-evaluate seven GEO attacks under a realistic three-stage pipeline (retriever, LLM reranker, LLM generator). We find that prior protocols substantially overstate attack effectiveness: gradient-based and instruction override attacks largely collapse before reaching the generator, and only LLM-driven prompt injections remain effective end-to-end. Our analysis further reveals that current GEO attacks are easily detectable: a lightweight prompt-injection guard finetuned on a small attack dataset already detects every attack. Our code and data are available at https://github.com/ielab/geo_injection_rag_survival.
