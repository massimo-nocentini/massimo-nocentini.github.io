+++
date = '2013-08-09T18:33:23+01:00'
title = "Axioms for Centrality"
author = ['Paolo Boldi', 'Sebastiano Vigna']
tags = [ "centralities" ]
categories = [ 'papers']
summary = ' '
+++

{{< bibtex
  title="Axioms for Centrality"
  author="Paolo Boldi and Sebastiano Vigna"
  journal="Internet Mathematics"
  year="2013"
  volume="10"
  pages="222 - 262"
  abstract="Abstract Given a social network, which of its nodes are more central? This question has been asked many times in sociology, psychology, and computer science, and a whole plethora of centrality measures (a.k.a. centrality indices, or rankings) were proposed to account for the importance of the nodes of a network. In this study, we try to provide a mathematically sound survey of the most important classic centrality measures known from the literature and propose an axiomatic approach to establish whether they are actually doing what they have been designed to do. Our axioms suggest some simple, basic properties that a centrality measure should exhibit. Surprisingly, only a new simple measure based on distances, harmonic centrality, turns out to satisfy all axioms; essentially, harmonic centrality is a correction to Bavelas’s classic closeness centrality [Bavelas 50] designed to take unreachable nodes into account in a natural way. As a sanity check, we examine in turn each measure under the lens of information retrieval, leveraging state-of-the-art knowledge in the discipline to measure the effectiveness of the various indices in locating webpages that are relevant to a query. Although there are some examples of such comparisons in the literature, here, for the first time, we also take into consideration centrality measures based on distances, such as closeness, in an information-retrieval setting. The results closely match the data we gathered using our axiomatic approach. Our results suggest that centrality measures based on distances, which in recent years have been neglected in information retrieval in favor of spectral centrality measures, do provide high-quality signals; moreover, harmonic centrality pops up as an excellent general-purpose centrality index for arbitrary directed graphs."
  url="https://api.semanticscholar.org/CorpusID:10140116"
>}}