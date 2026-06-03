# 🛰️ NASA Route Optimizer

## Overview

During my NASA SEES internship, I encountered a logistical problem affecting environmental field operations.

Research teams needed to visit 37 geographically distributed data collection sites during a single campaign. Existing navigation tools such as Google Maps and Apple Maps generally support only around 10 destinations, forcing researchers to manually split routes and spend significant time planning logistics.

I wanted to determine whether this process could be automated.

## The Challenge

At first glance, route planning appears straightforward:

> Find the shortest route.

In reality, it is a computationally difficult optimization problem.

For 37 destinations, there are approximately **1.38 × 10^43** possible visitation orders. Even if a computer evaluated one trillion routes every second, it would still take more than **400 billion years** to test them all.

The challenge was not simply finding the optimal route. The challenge was designing a system capable of finding high-quality routes under realistic computational constraints.

## Approach

I modeled the routing problem as a weighted graph using real-world travel distances and times retrieved from mapping APIs.

Because exhaustively evaluating every possible route is infeasible, I implemented a heuristic optimization pipeline:

1. Construct an initial route using a nearest-neighbor search strategy.
2. Iteratively improve the route using 2-opt local search, a classic optimization technique that removes inefficient path patterns and reduces total travel distance.
3. Evaluate candidate routes against operational constraints, including field-team Wi-Fi requirements.
4. Return the best route found and visualize it through an interactive web interface.

This approach allowed the system to efficiently search an enormous solution space while maintaining practical runtimes for real-world field operations.

## Impact

* Reduced field-team travel time by approximately **80%**
* Supported environmental research operations across the United States
* Solved routing problems involving up to **37 destinations**
* Enabled more efficient environmental data collection workflows
* Featured on NASA-affiliated GLOBE.gov following recommendation from project mentors

## External Publication

This project was featured in a NASA-affiliated article on GLOBE.gov:

**Saif: SEES Earth System Explorer 2025**

https://www.globe.gov/web/mission-mosquito/overview/science-cafe-posts/-/blogs/saif-sees-earth-system-explorer-2025

## Technical Highlights

* Heuristic search and optimization
* Nearest-neighbor route construction
* 2-opt local search improvement
* Constraint-aware route planning
* Graph-based problem modeling
* Geospatial and mapping APIs
* Full-stack web application development

## Reasoning Under Constraints

This project fundamentally changed how I think about problem solving.

Many important problems cannot be solved through exhaustive search. Instead, progress comes from understanding the structure of a problem, identifying useful approximations, and designing systems that make effective decisions despite limited information and computational resources.

Building this optimizer introduced me to ideas from search, optimization, and decision-making under constraints. Those ideas continue to shape my interest in AI systems, algorithmic reasoning, and building tools that solve real-world problems at scale.
