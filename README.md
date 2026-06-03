# 🛰️ NASA Route Optimizer

## Overview

During my NASA SEES internship, I encountered a surprisingly difficult operational problem.

Environmental field teams needed to visit 37 geographically distributed data collection sites during a single campaign. Existing navigation tools such as Google Maps and Apple Maps generally support only around 10 destinations, forcing researchers to manually split routes and spend significant time planning logistics.

I wanted to determine whether this process could be automated.

## The Challenge

At first glance, route planning appears straightforward:

> Find the shortest route.

However, for 37 destinations, there are approximately **1.38 × 10^43** possible visitation orders.

This is a classic example of combinatorial explosion. Even if a computer evaluated one trillion routes every second, it would still take more than **400 billion years** to test them all.

The project became an exercise in reasoning under computational constraints: how can we identify high-quality solutions when finding the perfect solution is effectively impossible?

## Approach

I built a web-based route optimization platform that combines real-world road-network data with optimization algorithms.

The system:

* Retrieves travel distances and times from mapping APIs
* Represents destinations as weighted route networks
* Searches for efficient visitation sequences without enumerating every possibility
* Visualizes optimized routes through an interactive web interface

Rather than attempting exhaustive search, the platform uses algorithmic techniques designed to efficiently navigate a vast solution space and identify strong solutions within practical runtime limits.

## Impact

* Reduced field-team travel time by approximately **80%**
* Supported environmental research operations across the United States
* Solved routing problems involving up to **37 destinations**
* Featured on NASA-affiliated GLOBE.gov following recommendation from project mentors

## External Publication

This project was featured in a NASA-affiliated article on GLOBE.gov:

**Saif: SEES Earth System Explorer 2025**
https://www.globe.gov/web/mission-mosquito/overview/science-cafe-posts/-/blogs/saif-sees-earth-system-explorer-2025

The article discusses the development of the route optimization platform and its role in supporting environmental field operations during the NASA STEM Enhancement in Earth Science (SEES) program.

## What I Learned

This project fundamentally changed how I think about problem solving.

Many real-world problems cannot be solved through brute force. Instead, progress comes from understanding the structure of a problem, identifying useful approximations, and designing systems that make effective decisions under constraints.

Building the optimizer introduced me to ideas from algorithms, optimization, and large-scale search, areas that continue to shape how I approach technical problems today.

## Technologies

Python • JavaScript • Optimization Algorithms • Mapping APIs • Full-Stack Development
