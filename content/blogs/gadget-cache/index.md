---
title: "Caching ROP Gadgets in C"
date: 2026-05-27
draft: false
image: "cover.png"
description: "Full technical insights on implementation of gadget search cache."
---

[Draft]

Recently I have being working a lot on the Gadget search (ROP Gadget including COP and JOP search) before my GSoC coding period started. 

In this blog I will be detailing about how I implemented the Gadget Caching and all the architectural and systems decisions that were taken along the way. Hope it will be a nice read and not boring :)

## Prelude ♫
ROP = **Return-Oriented Programming** (a computer security exploit technique), in which attacker uses a chain of blocks of instruction (ending with return instruction like `ret`) **already in the loaded program** called **ROP Gadgets** to run any operations of his intentions. This technique is used to bypass the hardware's defense for [buffer overflow attack](https://en.wikipedia.org/wiki/Buffer_overflow) by marking certain areas in memory as executable so that the attacker cannot execute his code from data storage area. See [NX_bit wiki article](https://en.wikipedia.org/wiki/NX_bit) 

See this wikipedia article for more details on [Return-oriented programming](https://en.wikipedia.org/wiki/Return-oriented_programming)
>In this technique, an attacker gains control of the call stack to hijack program control flow and then executes carefully chosen machine instruction sequences that are already present in the machine's memory, called "gadgets". Each gadget typically ends in a return instruction and is located in a [subroutine](https://en.wikipedia.org/wiki/Subroutine "Subroutine") within the existing program and/or shared library code. Chained together, these gadgets allow an attacker to perform arbitrary operations on a machine employing defenses that catch simpler attacks.

I had completed several PRs resulting in the improvement and bug fixes in the core gadget search code so far. As a result it is much better now and some more features are also included.

All the related PRs so far: 
- Previously all 3 types of gadgets , ROP/COP/JOP were included in the gadget search, now they are separate and linked to respective new commands (`/R`,`/C`, `/J` commands)
- This required some refactoring for generalizing, details in PR description if interested: [#6130](https://github.com/rizinorg/rizin/pull/6130)
- Fixed invalid 32-bit stack change output ([#6242](https://github.com/rizinorg/rizin/pull/6242)).
- Added JOP and COP support linked to `/J` and `/C` search commands ([#6257](https://github.com/rizinorg/rizin/pull/6257)).
- Highlight conditional gadgets in all search modes ([#6324](https://github.com/rizinorg/rizin/pull/6324)).
- Implemented gadget cache - what this whole blog is all about :) ([#6328](https://github.com/rizinorg/rizin/pull/6328)).


## WHY to cache

Up until now when you search for, let say, ROP gadgets using `/R` command in rizin session the whole search algorithm ran "from scratch" going through all of the process from, Iterating over map boundaries --- building end gadget list --- then iterating over each potential end gadget --- disassembling backwards upto a depth and try to build gadget --- and then append the gadget in list. More about it below. 

[Turns out em dashes exist outside of LLMs too :0. First time using em dashes in my life! Saw them in 1930s Dale Carnegie book I am currently reading].

This whole process does take significant time. You might not see the lag on small binaries, but it definitely can be observed on a "14MB" unstriped `libstdc++.so` file roughly taking around 10 seconds to build the whole list of gadgets.

So my task was to implement "a cache" to somehow store the gadgets and use cache instead of rebuiling from scratch and reduce the time bottleneck.

Rizin also allows you to search for gadgets using regex patterns. You mention the instruction you want to be in the gadgets, like for x86 `libstdc++.so` file `/R push rsp` or ` /R/ mov e[abcd]x` (`/R/` command for regex search). It returns all the gadgets having instructions that matches the regex.

The example i just gave you about 10s lag, clearly tells the need for cache, i mean who wanna wait for 10 seconds when you just changed the regex search pattern which clearly does not impact (or i would say SHOULD NOT, as you will later find out)  affect how the gadgets are build, it should be quick filtering instead of rebuilding all gadgets.

But we need to first understand WHY there is that much time delay in building gadgets and what are the core components responsible for the time complexity. You may have guessed where we are heading! 

Yep we are entering the Big O world!

## The Big O World

To find out time complexity of the algorithm, we first need to dissect and have a clear model of algorithm.

### The Current Architecture


### Big O Calculations

## HOW to Cache?

### Data Structure Choice
Actually there **was** a field for this caching in the main `RzAnalysis` struct (which stores the main analysis related data in rizin session), with no implementation for caching.

The field was "Hash Table". Seems fine right, the best one for caching? 

Well... No. 

There is one very specific reason why we can't use hashtable (map) here. See... the majority of queries for ROP search is "give me ROP gadgets in this binary" or "give me ROP gadgets between `start_address` to `end_address`". The query "give me ROP gadget **at** `address`" is super infrequent.

So a key-value data structure is not suitable for this purpose. The core operation here is "ITERATION" over all gadgets in a range. So we need a fast iteration based data structure.

Options:
1. Vector
2. Tree

I chose Tree (specifically Red-Black Tree).  Why not vector + Binary Search for range queries?

It turns out to be quite debatable and both could have been used.

Several Points:
- gadgets are not discovered in address sorted order, so inserting into vector makes vector unsorted. 
    - Insert sorted -> $O(n^2)$. 
    - Sort at last -> well... can be done but would require much more restructuring of the build path. Because currently the cache is populated **while simultaneously printing gadgets**.
- Vector is a growable array. When it fills its capacity, it `realloc`s (usually 2x). During cache build for a large binary section, we insert thousands of gadgets. That means:
    - Multiple reallocations + copies, RBTree node are allocated independently
    - Potential memory fragmentation
- If the cache was built once and queried millions of times, a sorted array would give better cache-line locality (contiguous memory vs pointer-chasing in tree nodes)

Well... i chose RBTree, doesnt matter as much, we are not building a HFT trading system here ;). You are free to criticise this decision in comments >.<

### The New Architecture

[TODO: Write about refactoring and little about algo...]

## Results

[TODO: write the calc then do performance analysis - Left]

...

Well...that's it.

Thanks for sticking up with me so far (or so i assume ;P ).

Leave your thoughts in the comment box below :)

Have a nice day (or night) (>.<)

## References

1. [Implementation of Gadget Cache - Pull Request](https://github.com/rizinorg/rizin/pull/6328)

==**Also code blocks does not look good in dark mode (inline atleast!)**==
==***next- Why LLMs output chinese tokens sometimes? add screenshot too==***