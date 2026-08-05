---
title: "DiffRetriever: Parallel Representative Tokens for Retrieval with Diffusion Language Models"
collection: publications
permalink: /publication/2026-07-08-diffretriever
excerpt: 
date: 2026-07-08
page_type: "Long"
venue: 'arXiv preprint (2026)'
paperurl: 'https://arxiv.org/abs/2605.07210'
citation: 'Shuai Wang, Yu Yin, Shengyao Zhuang, Bevan Koopman and Guido Zuccon. 2026. DiffRetriever: Parallel Representative Tokens for Retrieval with Diffusion Language Models. arXiv preprint arXiv:2605.07210.'
---
## Abstract
This paper shows how diffusion language models (DLMs) can be used as effective and efficient retrievers. Existing DLM-based retrievers (e.g., DiffEmbed) follow BERT-style encoding, representing each query or passage as a single mean-pooled vector. This ignores how DLMs are trained to generate responses through masked-position prediction under bidirectional attention, a capability that can provide stronger retrieval signals. We propose DiffRetriever, which uses the DLM's native masked-position prediction directly for retrieval. For each query or passage, DiffRetriever appends one or more masked positions, using the outputs as retrieval representations in a single forward pass. With one masked position, single-representation DiffRetriever already improves over DiffEmbed on the same backbones. DiffRetriever also naturally extends to multi-representation retrieval: DLMs process multiple masked positions jointly, enabling ColBERT-style fine-grained matching with little additional encoding latency. In autoregressive LLM retrievers, the same multi-representation strategy requires sequential decoding and therefore incurs much higher latency. DiffRetriever obtains the strongest aggregate effectiveness within our matched comparison, outperforming DiffEmbed, PromptReps, and RepLLaMA. Masked-position counts selected on training data transfer well across datasets, while per-query variation suggests headroom for adaptive allocation. Code is available at https://github.com/ielab/diffretriever.
