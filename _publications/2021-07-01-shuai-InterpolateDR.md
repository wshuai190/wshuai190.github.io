---
title: "BERT-based Dense Retrievers Require Interpolation with BM25 for Effective Passage Retrieval"
collection: publications
permalink: /publication/2021-07-01-shuai-InterpolateDR
excerpt: 
date: 2021-07-01
page_type: "Short"
venue: 'The Proceedings of the 2021 ACM SIGIR on International Conference on Theory of Information Retrieval (ICTIR 2021)'
paperurl: 'https://dl.acm.org/doi/abs/10.1145/3471158.3472233'
citation: 'Shuai Wang and Shengyao Zhuang and Guido Zuccon. 2021. BERT-based Dense Retrievers Require Interpolation with BM25 for Effective Passage Retrieval. In The Proceedings of the 2021 ACM SIGIR on International Conference on Theory of Information Retrieval (ICTIR 2021).'
---
## Abstract
The integration of deep, pre-trained language models, such as BERT, into retrieval and ranking pipelines has shown to provide large effectiveness gains over traditional bag-of-words models in the passage retrieval task. However, the best setup for integrating such deep language models is still unclear.

When BERT is used to re-rank passages, previous work has empirically shown that, while in practice BERT cannot act as initial retriever due to BERT’s high query time costs, and thus a bagof-words model such as BM25 is required, it is not necessary to interpolate BERT and bag-of-words scores to generate the final ranking. In fact, the BERT scores alone can be used by the reranker: the BERT score appears to already capture the relevance signal provided by BM25.

In this paper, we further investigate the topic of interpolating BM25 and BERT-based methods. Unlike previous work that considered the original BERT model, however, here we consider BERTbased dense retrievers (RepBERT and ANCE). Dense retrievers encode queries and documents into low dimensional BERT-based embeddings. These methods overcome BERT’s high computational costs at query time, and can thus be feasibly used in practice as whole-collection retrievers, rather than just as re-rankers.

Our novel empirical findings suggest that, unlike for BERT, interpolation with BM25 is necessary for BERT-based dense retrievers to perform effectively; and the gains provided by the interpolation are significant. Further analysis reveals why this is so: dense retrievers are very effective at encoding strong relevance signals, but they fail in identifying weaker relevance signals – a task that the interpolation with BM25 is able to make up for.
