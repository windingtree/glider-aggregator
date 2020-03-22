#!/usr/bin/env bash

# Prepare directories
mkdir -p ~/mongoData
mkdir -p ~/redisData
mkdir -p ~/elasticSearch

docker-compose -f ./scripts/localservers/docker-compose.yml up 