#!/bin/bash

for ex in examples/*; do
    cd $ex
    if [ -f ./package.json ]; then
        rm -rf node_modules/
        npm install
    fi
    cd -
done