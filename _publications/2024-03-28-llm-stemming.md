---
title: "Large Language Models for Stemming: Promises, Pitfalls and Failures"
collection: publications
permalink: /publication/2024-03-28-llm-stemming
excerpt: 
date: 2024-03-28
page_type: "Short"
venue: 'SIGIR-2024'
paperurl: 'https://arxiv.org/abs/2402.11757'
citation: 'Shuai Wang, Shengyao Zhuang and Guido Zuccon. 2024. Large Language Models for Stemming: Promises, Pitfalls and Failures. In Proceedings of the 47th International ACM SIGIR Conference on Research and Development in Information Retrieval (SIGIR 2024).'
---
## Abstract
Text stemming is a natural language processing technique that is used to reduce words to their base form, also known as the root form. The use of stemming in IR has been shown to often improve the effectiveness of keyword-matching models such as BM25. However, traditional stemming methods, focusing solely on individual terms, overlook the richness of contextual information. Recognizing this gap, in this paper, we investigate the promising idea of using large language models (LLMs) to stem words by leveraging its capability of context understanding. With this respect, we identify three avenues, each characterised by different trade-offs in terms of computational cost, effectiveness and robustness : (1) use LLMs to stem the vocabulary for a collection, i.e., the set of unique words that appear in the collection (vocabulary stemming), (2) use LLMs to stem each document separately (contextual stemming), and (3) use LLMs to extract from each document entities that should not be stemmed, then use vocabulary stemming to stem the rest of the terms (entity-based contextual stemming). Through a series of empirical experiments, we compare the use of LLMs for stemming with that of traditional lexical stemmers such as Porter and Krovetz for English text. We find that while vocabulary stemming and contextual stemming fail to achieve higher effectiveness than traditional stemmers, entity-based contextual stemming can achieve a higher effectiveness than using Porter stemmer alone, under specific conditions.