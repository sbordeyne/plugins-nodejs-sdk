#!/bin/bash
set -eu

rm -rf node_modules
npm install
npm run prepublishOnly

export TS_NODE_TYPE_CHECK=1
mocha -r ts-node/register src/tests/*.ts

npm link

for ex in examples/*; do
    cd $ex
    if [ -f ./package.json ]; then
        rm -rf node_modules
        npm link @mediarithmics/plugins-nodejs-sdk
        npm i --no-package-lock
        #npm link @mediarithmics/plugins-nodejs-sdk #yes twice, needed for install but install remove link >_<
        npm run test
    fi
    cd -
done
