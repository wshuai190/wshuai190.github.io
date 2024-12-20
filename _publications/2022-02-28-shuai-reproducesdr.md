---
title: "SDR for Systematic Reviews: A Reproducibility Study"
collection: publications
permalink: /publication/2022-02-28-shuai-reproducesdr
excerpt: 
date: 2022-02-28
page_type: "Reproduce"
venue: 'Proceedings of the 44th European Conference on Information Retrieval (ECIR 2022)'
paperurl: 'https://link.springer.com/chapter/10.1007/978-3-030-99736-6_46'
citation: 'Shuai Wang and Harry Scells and Ahmed Mourad and Guido Zuccon. 2022. SDR for Systematic Reviews: A Reproducibility Study. In Proceedings of the 44th European Conference on Information Retrieval (ECIR 2022).'
---
## Abstract
Screening or assessing studies is critical to the quality and outcomes of a systematic review. Typically, a Boolean query retrieves the set of studies to screen. As the set of studies retrieved is unordered, screening all retrieved studies is usually required for high-quality systematic reviews. Screening prioritisation, or in other words, ranking the set of studies, enables downstream activities of a systematic review to begin in parallel. We investigate a method that exploits seed studies -- potentially relevant studies used to seed the query formulation process -- for screening prioritisation. Our investigation aims to reproduce this method to determine if it is generalisable on recently published datasets and determine the impact of using multiple seed studies on effectiveness. We show that while we could reproduce the original methods, we could not replicate their results exactly. However, we believe this is due to minor differences in document pre-processing, not deficiencies with the original methodology. Our results also indicate that our reproduced screening prioritisation method, (1) is generalisable across datasets of similar and different topicality compared to the original implementation, (2) that when using multiple seed studies, the effectiveness of the method increases using our techniques to enable this, (3) and that the use of multiple seed studies produces more stable rankings compared to single seed studies. Finally, we make our implementation and results publicly available at the following URL: https://github.com/ielab/sdr

