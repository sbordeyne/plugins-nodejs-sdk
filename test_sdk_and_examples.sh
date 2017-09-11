#!/bin/bash
set -eu 

mocha -r ts-node/register src/tests/*.ts

npm link 

for ex in examples/*; 
    do  cd $ex  
    npm link @mediarithmics/plugins-nodejs-sdk  
    npm i  
    npm run test
    cd -
done