# NASA Route Optimizer

## Overview

Environmental field teams often need to visit dozens of geographically dispersed locations during a single data collection campaign (called an Area of Interest, in which there's a 6x6 grid of points around a center point, resulting in 37 total destinations). Issue: Existing navigation platforms such as Google Maps and Apple Maps can only support up 10 destinations, making them unsuitable for our use case of large-scale field operations. Without an optimal navigation route, this leaves researchers with unnecessary travel and unneeded guesswork.

To address this limitation, I developed a web-based route optimization platform during my NASA SEES internship that generates efficient routes for large destination sets and helps reduce travel time for environmental data collection teams.

## Problem

The route optimization problem becomes computationally intractable as the number of destinations increases.

For a 37-location route:

37! ≈ 1.38 × 10^43 possible route combinations

With more combinations than seconds since the Big Bang, exhaustively evaluating every route until you find the best is impossible in practice (even at a trillion routes per second, it would still take 400 billion years to cover them all), requiring optimization techniques capable of identifying high-quality solutions efficiently.

## Technical Approach

The platform integrates road-network APIs with custom route optimization algorithms to:

* Retrieve real-world travel distances and times
* Construct weighted route networks
* Generate near-optimal visitation sequences
* Visualize optimized routes through an interactive web interface

The system was designed to balance computational efficiency with route quality, enabling practical deployment for large field campaigns.

## Results

* Supported routing problems involving up to 37 destinations
* Reduced field data collection travel time by approximately 80%
* Enabled more efficient environmental data collection workflows
* Published on GLOBE.gov following recommendation from NASA mentors

## Technologies

Python, JavaScript, Route Optimization Algorithms, Mapping APIs, Web Development

## Recognition

The project was featured on GLOBE.gov and developed as part of the NASA STEM Enhancement in Earth Science (SEES) Program.
