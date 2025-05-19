---
title: "Corpus Subsampling: Estimating the Effectiveness of Neural Retrieval Models on Large Corpora"
collection: publications
permalink: /publication/2025-01-01-corpus_subsampling
excerpt: 
date: 2025-01-01
page_type: "Long"
venue: 'ECIR-2025'
paperurl: 'https://link.springer.com/chapter/10.1007/978-3-031-88708-6_29'
citation: 'Maik Fröbe, Andrew Parry, Harrisen Scells, Shuai Wang, Shengyao Zhuang, Guido Zuccon, Martin Potthast and Matthias Hagen. 2025. Corpus Subsampling: Estimating the Effectiveness of Neural Retrieval Models on Large Corpora. In: Hauff, C., et al. Advances in Information Retrieval. ECIR 2025. Lecture Notes in Computer Science, vol 15572. Springer, Cham. https://doi.org/10.1007/978-3-031-88708-6_29.'
---
## Abstract
Due to their low efficiency, neural retrieval models are usually evaluated on small corpora (e.g. MS MARCO or BEIR subsets) or in re-ranking scenarios using a more efficient first-stage retriever. To estimate their effectiveness on larger corpora independently of a first-stage retriever, we propose a new corpus subsampling strategy based on the top-k results of the pooled systems that contributed to the relevance judgments of a corpus. Our experiments on nine TREC tasks covering different corpus sizes show that using the top-1,000 or even only the top-100 pools provides a reliable effectiveness estimate for neural models. This reduces the required experimental resources for large corpora by a factor of up to 1,000 and enables a “green” IR evaluation.