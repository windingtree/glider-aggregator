#!/usr/bin/env bash

export TESTING=true

# Exit script as soon as a command fails.
set -o errexit

# Executes cleanup function at script exit.
trap cleanup EXIT

cleanup() {
    # cleanup logic
    rm -rf .nyc_output
    echo "Testing environment is cleaned"
}

# Build library before the testing
if [ -z "$@" ]; then
    testDir="./helpers/**/*.js"
else
    testDir="$@"
fi

if [ "$COVERAGE" = true ]; then
    echo "Running tests with coverage"
    npx nyc --reporter lcov mocha -r ./node_modules/dotenv/config --exit -R spec --timeout 70000 --recursive ./helpers/**/*.js

    if [ "$CONTINUOUS_INTEGRATION" = true ]; then
        cat coverage/lcov.info | npx coveralls
    fi

else
    echo "Running tests without coverage"

    if [ -z "$@" ]; then
        testDir="./helpers/**/*.js"
    else
        testDir="$@"
    fi

    npx mocha -r ./node_modules/dotenv/config --exit -R spec --timeout 70000 --recursive "$testDir"
fi
