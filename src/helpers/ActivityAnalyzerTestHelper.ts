import 'mocha';
import * as request from 'supertest';
import * as sinon from 'sinon';
import {expect} from 'chai';
import {ActivityAnalyzerPlugin} from '../mediarithmics';
import {core} from '../index';

type LogLevel = 'error' | 'warn' | 'info' | 'verbose' | 'debug' | 'silly'

const activityAnalyzer: core.ActivityAnalyzerResponse = {
  status: 'ok',
  data: {
    id: '1000',
    name: 'my analyzer',
    organisation_id: '1000',
    visit_analyzer_plugin_id: 1001,
    group_id: 'com.mediarithmics.visit-analyzer',
    artifact_id: 'default'
  }
};

const rpMockupGlobal: sinon.SinonStub = sinon.stub();
const mockApi = (uriPattern: RegExp): sinon.SinonStub => {
    return rpMockupGlobal
        .withArgs(sinon.match.has('uri', sinon.match((value: string) => value.match(uriPattern) !== null)))

};

mockApi(/\/v1\/activity_analyzers\/(.){1,10}/).returns(activityAnalyzer);

const itFactory = (
  plugin: ActivityAnalyzerPlugin,
  property: core.PluginPropertyResponse,
  logLevel: LogLevel = 'info'
) => (name: string, input: string, output: string) => {
  it(name, function (done) {
    mockApi(/\/v1\/activity_analyzers\/(.){1,10}\/properties/).returns(property);

    const runner = new core.TestingPluginRunner(plugin, rpMockupGlobal);

    request(runner.plugin.app)
      .put('/v1/log_level')
      .send({level: logLevel})
      .end((err, res) => {
        expect(res.status).to.equal(200);

        request(runner.plugin.app)
          .post('/v1/activity_analysis')
          .send(input)
          .end((err, res) => {
            expect(res.status).to.eq(200);
            expect(JSON.parse(res.text)).to.be.deep.equal(output);
            done();
          });
      });

    afterEach(function () {
      runner.plugin.pluginCache.clear();
    });
  });
};

export {
  itFactory,
  mockApi
};
