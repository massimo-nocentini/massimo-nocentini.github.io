+++
date = '2016-09-20T10:02:03+01:00'
title = 'BiRank'
subtitle = 'Towards Ranking on Bipartite Graphs'
summary = ' '
author = ['Xiangnan He', 'Ming Gao', 'Min-Yen Kan', 'Dingxian Wang']
categories = ['papers']
+++

{{< bibtex
author="He, Xiangnan and Gao, Ming and Kan, Min-Yen and Wang, Dingxian"
journal="IEEE Transactions on Knowledge and Data Engineering" 
title="BiRank: Towards Ranking on Bipartite Graphs" 
year="2017"
volume="29"
url="https://ieeexplore.ieee.org/document/7572089"
number="1"
pages="57-71"
abstract="The bipartite graph is a ubiquitous data structure that can model the relationship between two entity types: for instance, users and items, queries and webpages. In this paper, we study the problem of ranking vertices of a bipartite graph, based on the graph's link structure as well as prior information about vertices (which we term a query vector). We present a new solution, BiRank, which iteratively assigns scores to vertices and finally converges to a unique stationary ranking. In contrast to the traditional random walk-based methods, BiRank iterates towards optimizing a regularization function, which smooths the graph under the guidance of the query vector. Importantly, we establish how BiRank relates to the Bayesian methodology, enabling the future extension in a probabilistic way. To show the rationale and extendability of the ranking methodology, we further extend it to rank for the more generic n-partite graphs. BiRank's generic modeling of both the graph structure and vertex features enables it to model various ranking hypotheses flexibly. To illustrate its functionality, we apply the BiRank and TriRank (ranking for tripartite graphs) algorithms to two real-world applications: a general ranking scenario that predicts the future popularity of items, and a personalized ranking scenario that recommends items of interest to users. Extensive experiments on both synthetic and real-world datasets demonstrate BiRank's soundness (fast convergence), efficiency (linear in the number of graph edges), and effectiveness (achieving state-of-the-art in the two real-world tasks)."
keywords="Bipartite graph;Bayes methods;Electronic mail;Kernel;Data models;Bridges;Probabilistic logic;Bipartite graph ranking;graph regularization;n-partite graphs;popularity prediction;personalized recommendation"
doi="10.1109/TKDE.2016.2611584"
ISSN="1558-2191"
month="Jan"
>}}

