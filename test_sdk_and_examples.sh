#!/bin/bash
set -eu 

rm -rf node_modules

npm run prepublishOnly

mocha -r ts-node/register src/tests/*.ts

npm link

for ex in examples/*; do  
    cd $ex
    if [ -f ./package.json ]; then
        rm -rf node_modules
        npm link @mediarithmics/plugins-nodejs-sdk
        npm i --no-package-lock
        npm run test
    fi
    cd -
done