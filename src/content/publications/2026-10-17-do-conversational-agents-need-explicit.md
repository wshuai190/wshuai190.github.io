---
title: 'Do Conversational Agents Need Explicit Memory? A Controlled Comparison with Raw-History Retrieval'
collection: publications
permalink: /publication/2026-10-17-do-conversational-agents-need-explicit
date: 2026-10-17
venue: 'arXiv preprint arXiv:2610.24671'
paperurl: 'https://arxiv.org/abs/2610.24671'
citation: 'Yongjie Zhou, Shuai Wang, Bevan Koopman and Guido Zuccon. 2026. Do Conversational Agents Need Explicit Memory? A Controlled Comparison with Raw-History Retrieval. arXiv preprint arXiv:2610.24671.'
topic: 'memory'
arxiv: '2610.24671'
auto: true
---
## Abstract
Explicit memory systems transform conversation history into persistent representations intended to improve future access, often at substantial construction cost. Yet it remains unclear whether this added complexity yields better answer accuracy than retrieving directly from raw history. This study compares six state-of-the-art explicit memory systems with raw-history RAG on LongMemEval-S and BEAM-100K under original and controlled retrieval settings. We find only localized gains for particular question types and tight run-time context budgets, with no consistent advantage over strong raw-history RAG baselines. Oracle retrieval shows that some systems fail to preserve answer-supporting information during explicit memory construction, while others preserve it but fail to retrieve it effectively, despite construction costs reaching hours per conversation. Our findings suggest that while many existing memory systems for AI agents emphasize increasingly elaborate explicit memory construction, they are often evaluated without strong controlled comparisons to raw-history RAG and may underemphasize retrieval. Retrieval remains a major bottleneck when useful information is preserved, suggesting that improving access to existing information may be at least as important as constructing richer explicit memory.
