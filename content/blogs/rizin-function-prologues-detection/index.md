---
title: "Function Prologues Detection Plugin for Rizin"
date: 2026-08-24
draft: false
image: "cover.png"
description: "GSoC 2026: Function Prologues Detection Plugin for Rizin"
---

TODO: have to update design flowcharts, will do as soon as possible today

GSoC 2026: Function Prologues Generation Plugin for Rizin

In context of Rizin, _Prelude_ and _Prologue_ are used interchangebly. Although Prologue is the more widely used term generally. Hence I have used _Prologues_ terminology for the Plugin and the legacy naming of analysis system (analyze preludes) is kept as it is.

## The problem

A common problem in binary analysis is function detection. One method is searching for function prologues. Prologues are a sequence of instructions commonly found at the beginning of a function. These prologues perform tasks like setting up the stack, or initializing registers to values as defined in the architecture’s ABI. It is very common to hard-code these prologues patterns and match instructions against them. These patterns get outdated, are tedious to update, and have to be written for each architecture. Also because these signatures are generic, they are highly prone to false positives especially on x86/x86_64 binaries. 

This project augments static signature based approach with a dynamic, multi-stage statistical heuristic pipeline. 
So that reverse engineers and researchers can extract function prologues signatures from a binary having symbol information and use them to analyse another stripped binary (does not have symbol information). This provides a good enough baseline for function detections particularly detecting functions not in normal control flow like an orphaned function

## Solution (Design and Algorithm)

This can be split into 2 categories:

1. The mathematical solution and algorithm
2. The system design of the plugin and utility

### Mathematical solution and Algorithm

Let,
$S_{true}$ = Set of true, infinite distribution of all possible function prologues. Where each prelude is a sequence of bytes values (not using assembly instructions and instead using bytes as we need to support most architectures and cant rely on disassembling). L is the length of the sequence. 

Good Binaries = Binaries having symbol information

$S$ = A sample of the true distribution (the input we give to the algorithm; the good binaries giving the function prologues)

$$ S \subset S_{true} $$

The structure of these prologues is such that many prologues share a common prefix or some portion while branching at some points (operand bits or register bits). So they represent a branching data structure (prefix tree).

The language we want in output: Signatures having two fundamental elements:
1. Exact bytes
2. Mask defining the wildcard bits 

`mask[i]=0` means dont care bit, which means the the `ith` bit in the bytes signatures is wildcard (accept 0 or 1 both)

Why generate masks? Why not just save every raw extracted prelude in the database as a static signature?
Because $S$ is not the true population distribution; it is only a sample drawn from the population. It does not reflect the population (eg. operands and varying registers bits). We have to maximise our chance of finding unseen preludes too in the test binary.

On analysing a binary with prologues signatures we need:
- Recall ($R$) = Generalization. We want to be able to finding maximum number of function preludes that are not in $S$ but are in $S_{true}$. Which translates to wildcard at relevant and correct positions.
- FP = False positives (We want minimum false positives).

Wildcarding reduces improves Recall but penalizes on False Positives.

Inspired from the 2012 ML research paper [ByteWeight](https://www.usenix.org/system/files/conference/usenixsecurity14/sec14-paper-bao.pdf), we are using weighted prefix tree (Trie) data structure to store raw prologues buffer as its the best possible data structure to store them for furthur generalization. As bits like register bits are never byte alligned, we cant use byte prefix tree, and have to use bit prefix tree.

#### Build raw Weighted Prefix Tree (Trie)

We take a fixed prologue length for all prologues = Number of bytes to extract from a function start. Let it be $L$.

Hence each function prologue is a bit sequence $S = (b_0, b_1, \dots, b_{m-1})$ of length $m = 8 \times L$, 

We first feed all extracted raw prologues buffers from the binary into the bit prefix tree (each node is single bit). Essentially it becomes binary prefix tree. Each node keeps track of how many times the bit (at that specific prefix state) is hit for all prologues inserted in the trie. The root node of trie is empty/dummy.

If user just wanna use raw prologues extracted (without mask , essentially mask = 0xff...) we stop here and extract the prologues list.
Else after all prologues are fed into the trie, we run the generalization algorithm over the trie.

#### Generalization

Generalization means to “generalise” the prelude pattern which both reduces the prelude database size and also captures the unseen by setting wildcards at correct and most appropriate positions in the prelude sequence.

We traverse the trie and use the `hit_cnt` of each node and child nodes to come to a conclusion whether to declare the node as wildcard OR exact bit. Wildcarding has an inherent problem of giving false positives if done incorrectly as it will allow any byte at that position. Thus we need a correct signal to decide whether the node is actually a wildcard or better to keep 2 distinct signatures (as the maximum childs of a node is 2). That decision is however to be made on the sample (good binaries in hand) instead of population. So we have to make the best decision with the data in hand. And hence it's always better to have a larger number of functions (large binaries) for better results. 

Do DFS traversal and at each node, if the node has 2 childrens, we calculate Shanon Entropy of the Split (`EoS`) for that node. 

Let say we are at node $n$. It has two child nodes $c_1$ and $c_2$. The shanon entropy of split of node $n$:

$$H(n) = -\sum_{i=1}^{2} p(c_i)\log_2 p(c_i)$$

where $p(c_i)$ is the probability of node $c_i$ occuring after node $n$.
$$p(c_i) = \frac{F_{c_i}}{F_n}$$
where $F_i$ is the frequency (hit count) of the node $i$.

Shanon Entropy is good metric for uncertainity, high uncertainty means the bit is highly variable and can be wildcarded.

Let entropy Threshold be $E_c$. If the $EOS(node) > E_c$, we declare the bit at next depth (`d+1`) as wildcard (`mask[d+1]=0`) for the current branch of prologue, where `d` is the depth of node $n$.

Wildcarding the bit implictly means that we now need merge the subtrees at that node `merge(src,dst)`. Because without merging the Entropy calculation for the node in levels below the current one will be wrong. Hence after wildcarding decision we need to merge the the subtrees (adding the `hit_cnt` of the nodes being merged). 
$$\therefore c_0.\text{hit\_cnt} \leftarrow (c_0.\text{hit\_cnt} + c_1.\text{hit\_cnt})$$

During the DFS traversal, upon reaching a terminal node (`is_end`), the active bit and mask buffers are exported as an `RzPrologue` pair.

![Mathematical Flowchart](mathematical_flowchart)
![An Example](Example) 
 <!-- Good example showcasing merging too  -->

### The system design of the plugin and utility

![Old discarded Persistent Session System Design](assets/old_session_architecture.png)
![New Ephemeral System Design]()

## Current State
## Left to do (future)
## Links to relevant work
- [Prefix Tree (Trie) Library](https://github.com/rizinorg/rizin/pull/6638) #Merged
- [Prologues Generation Plugin](https://github.com/rizinorg/rizin/pull/6514) #Under Review
- [Visualizer for exported Prefix tree](https://rz-prelude-visualize.vercel.app/) #not included for main work just an extra thing (needs update for bit trie currently)

## Challenges faced
## Thanks
