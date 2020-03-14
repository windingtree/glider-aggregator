#!/usr/bin/env bash

export TESTING=true

# Exit script as soon as a command fails.
set -o errexit

# Executes cleanup function at script exit.
trap cleanup EXIT

cleanup() {
    # cleanup logic
    echo "Testing environment is cleaned"
}

# Build library before the testing
if [ -z "$@" ]; then
    testDir="./test/spec/**/*.js"
else
    testDir="$@"
fi

npx mocha --exit -R spec --timeout 70000 "$testDir"
