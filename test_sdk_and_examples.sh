#!/bin/bash
set -eu

rm -rf node_modules
npm install
npm run prepublishOnly

export TS_NODE_TYPE_CHECK=1
for t in src/tests/*.ts; do
  echo "Testing $t..."
  mocha -r ts-node/register $t
done

npm link

for ex in examples/*; do
    echo "Testing $ex..."
    cd $ex
    if [ -f ./package.json ]; then
        rm -rf node_modules
        npm i --no-package-lock
        npm link @mediarithmics/plugins-nodejs-sdk
        npm run test
    fi
    cd -
done
