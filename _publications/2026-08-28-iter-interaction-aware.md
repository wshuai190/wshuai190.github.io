---
title: "ITER: Interaction-Aware Retrieval for Agentic Search"
collection: publications
permalink: /publication/2026-08-28-iter-interaction-aware
excerpt:
date: 2026-08-28
page_type: "Long"
venue: 'arXiv preprint (2026)'
paperurl: 'https://arxiv.org/abs/2608.27912'
citation: 'Haodong Chen*, Shuai Wang*, Yu Yin, Shengyao Zhuang, Guido Zuccon and Teerapong Leelanupab. 2026. ITER: Interaction-Aware Retrieval for Agentic Search. arXiv preprint arXiv:2608.27912.'
---
## Abstract
Deep-research agents answer complex user questions through an iterative sequence of search steps, where the agent autonomously formulates sub-queries to retrieve the evidence needed at each stage. However, existing retriever training typically relies only on the sub-query and its corresponding search results at the current step as training signals, leaving the information accumulated from previous interactions largely underutilized. We introduce **iter**, an agent interaction-aware dense retriever trained using agent trajectory learning signals. iter represents each query by incorporating not only the current sub-query, but also the main question and preceding sub-queries, and is trained using trajectory-relative learning signals derived from the agent's interactions. Across six agent backbones from three model families, iter consistently outperforms the existing agent-trajectory-trained dense retriever, LRAT, achieving an average improvement of 7.5% on InfoSeek-Eval and 13.5% on BrowseComp-Plus. iter also demonstrates stronger cross-agent robustness than AgentIR, a deep-research retriever that relies on external LLM-judge signals and the agent's pre-search reasoning. Ablations further show that the main question and previous sub-queries provide the most robust query representation, while previously visited and useful documents, used as redundancy negatives in subsequent searches, provide the strongest trajectory-relative supervision. Code is available at https://github.com/ielab/ITER.
