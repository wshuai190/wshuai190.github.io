---
layout: single
header:
  overlay_color: "#000000"
  overlay_filter: "0.5"
excerpt: "🎓 博士后研究员 & 在读博士生 • 🔍 信息检索 • 🤖 自然语言处理 • 📊 机器学习"
permalink: /zh/
title: "王率 (Dylan)"
author_profile: true
lang: zh
navigation: main_zh
redirect_from: 
  - /zh/about/
  - /zh/about.html
---

## 👋 欢迎！

您好！我是**王率**，昆士兰大学IeLab的博士后研究员和即将毕业的博士生。我在[Guido Zuccon教授](https://researchers.uq.edu.au/researcher/22857)、[Bevan Koopman副教授](https://bevankoopman.github.io/)和[Harrisen Scells博士](https://scells.me/)的指导下进行研究。

## 🎓 学术背景

- **博士学位** (即将毕业) - 昆士兰大学 (2021-2025)
- **工程科学硕士** - 昆士兰大学 (2021)
- **理学学士** - 西澳大利亚大学 (2019)

## 🔬 研究方向

我的研究重点是**信息检索**和**自然语言处理**，特别专注于领域特定应用。我的博士研究专注于医学系统综述的自动化，包括：

- **自动Mesh术语推荐**
- **筛选优先级排序** 
- **种子驱动方法**
- **布尔查询构建**

我也探索一般性IR和NLP挑战，包括**联合搜索RAG系统**和**排序器融合**。

## 👨‍🏫 教学与指导

目前担任昆士兰大学INFS7410（信息检索与网络搜索）课程的**讲师和课程负责人**。曾在2021-2024年期间担任多门课程的助教，包括INFS7410、INFS7205和DATA7901/7902/7903。

*我热衷于发现优秀的人才进行合作研究——如果您对研究感兴趣，让我们联系并一起创造精彩的成果！*


## 🌍 行业经验

**研究实习生** 在[Naver Lab Europe](https://europe.naverlabs.com/)（2024年2月-7月），专注于**检索增强生成(RAG)的上下文压缩**研究。

## 💼 工作机会

从2025年2月开始，我在昆士兰大学担任博士后研究员；我也在积极寻找学术界和工业界的**精彩机会**。如果您认为我非常适合您的团队，请随时与我联系！

##  🎮 爱好 

有时候打游戏：p社四萌都打，战锤纯新手，菜但爱玩；每天早上固定追修仙小说，上班摸鱼时候会看房子改造类视频。

{% include base_path %}

## 📰 最新动态
<div class="news-section">
{% include news.html %}
<a href="/zh/news/" class="btn btn--primary btn--large">📖 查看所有动态</a>
</div>

## 🤝 学术服务

我通过担任以下期刊/会议的**审稿人/程序委员会成员**为学术社区做贡献：

### 📚 期刊
- **TOIS**: ACM信息系统汇刊
- **数据与信息质量期刊**

### 🏛️ 会议  
- **ACM ICTIR** 2023, **SIGIR** 2024, **SIGIR** 2025
- **ECIR** 2024, 2025
- 

## 📝 学术论文

<ul>
{% assign sorted_publications = site.publications | sort: 'date' | reverse %}
{% for post in sorted_publications %}
  {% include archive-single-cv.html %}
{% endfor %}
</ul>