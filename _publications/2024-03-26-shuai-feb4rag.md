---
title: "FeB4RAG: Evaluating Federated Search in the Context of Retrieval Augmented Generation"
collection: publications
permalink: /publication/2024-03-26-shuai-feb4rag
excerpt: 
date: 2024-03-26
page_type: "Resource"
venue: 'SIGIR-2024'
paperurl: 'https://arxiv.org/abs/2402.11891'
citation: 'Shuai Wang, Ekaterina Khramtsova, Shengyao Zhuang and Guido Zuccon. 2024. FeB4RAG: Evaluating Federated Search in the Context of Retrieval Augmented Generation. In Proceedings of the 47th International ACM SIGIR Conference on Research and Development in Information Retrieval (SIGIR 2024).'
---
## Abstract
Federated search systems aggregate results from multiple search engines, selecting appropriate sources to enhance result quality and align with user intent. With the increasing uptake of Retrieval-Augmented Generation (RAG) pipelines, federated search can play a pivotal role in sourcing relevant information across heterogeneous data sources to generate informed responses. However, existing datasets, such as those developed in the past TREC FedWeb tracks, predate the RAG paradigm shift and lack representation of modern information retrieval challenges. To bridge this gap, we present FeB4RAG, a novel dataset specifically designed for federated search within RAG frameworks. This dataset, derived from 16 sub-collections of the widely used \beir benchmarking collection, includes 790 information requests (akin to conversational queries) tailored for chatbot applications, along with top results returned by each resource and associated LLM-derived relevance judgements. Additionally, to support the need for this collection, we demonstrate the impact on response generation of a high quality federated search system for RAG compared to a naive approach to federated search. We do so by comparing answers generated through the RAG pipeline through a qualitative side-by-side comparison. Our collection fosters and supports the development and evaluation of new federated search methods, especially in the context of RAG pipelines.