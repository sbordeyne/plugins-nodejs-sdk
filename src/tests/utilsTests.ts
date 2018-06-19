import {assert, expect} from 'chai';

import * as _ from 'lodash';
import 'mocha';
import {Index, obfuscateString} from '../mediarithmics/utils';
import {denormalize} from '../mediarithmics/utils/Normalizer';


interface Kv {
    k: string,
    v: string
}

describe('Denormalize', () => {

    const kv1 = {k: 'k1', v: 'v1'};
    const kv2 = {k: 'k2', v: 'v2'};
    const kv3 = {k: 'k3', v: 'v3'};

    const normalized: Index<Kv> =
        {
            'k1': kv1,
            'k2': kv2,
            'k3': kv3
        };

    it('*', done => {

        const keys = Object.keys(normalized);
        assert( _.find(keys, k => k === 'k1') );
        assert( _.find(keys, k => k === 'k2') );
        assert( _.find(keys, k => k === 'k3') );


        const denormalized = denormalize(normalized);

        assert( _.find(denormalized, kv => kv[0] === 'k1' && kv[1] === kv1 ));
        assert( _.find(denormalized, kv => kv[0] === 'k2' && kv[1] === kv2 ));
        assert( _.find(denormalized, kv => kv[0] === 'k3' && kv[1] === kv3 ));


        done();
    });


});

describe('Obfuscate string', () => {

    const secretString = "THE EARTH IS FLAT ..";

    it('*', done => {

        const obfuscated = obfuscateString(secretString);
        expect(obfuscated).to.be.eq("THE EAXXXXXXXXXXXXXX");
        done();
    });

});
