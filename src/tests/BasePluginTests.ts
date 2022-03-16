import {expect} from 'chai';
import 'mocha';
import {core} from '../';
import * as request from 'supertest';
import * as sinon from 'sinon';

const PLUGIN_AUTHENTICATION_TOKEN = 'Manny';
const PLUGIN_WORKER_ID = 'Calavera';

// set by the plugin runner in production
process.env.PLUGIN_AUTHENTICATION_TOKEN = PLUGIN_AUTHENTICATION_TOKEN;
process.env.PLUGIN_WORKER_ID = PLUGIN_WORKER_ID;

describe('Plugin Status API Tests', function () {
  class MyFakePlugin extends core.BasePlugin {
  }

  it('should return plugin status (200) if the plugin is OK', function (done) {
    const plugin = new MyFakePlugin(false);
    const runner = new core.TestingPluginRunner(plugin);

    request(runner.plugin.app)
      .get('/v1/status')
      .end(function (err, res) {
        expect(res.status).to.equal(200);
        done();
      });
  });

});

describe('Plugin log level API tests', function () {
  class MyFakePlugin extends core.BasePlugin {
  }

  it('Log Level update should return 200', function (done) {
    const plugin = new MyFakePlugin(false);
    const runner = new core.TestingPluginRunner(plugin);

    const requestBody = {
      level: 'debug'
    };

    request(runner.plugin.app)
      .put('/v1/log_level')
      .send(requestBody)
      .end(function (err, res) {
        expect(res.status).to.equal(200);
        done();
      });
  });

  it('Malformed Log level update should return 400', function (done) {
    const plugin = new MyFakePlugin(false);
    const runner = new core.TestingPluginRunner(plugin);

    // Bad input format
    const requestBody = {
      hector: 'debug'
    };

    request(runner.plugin.app)
      .put('/v1/log_level')
      .send(requestBody)
      .end(function (err, res) {
        expect(res.status).to.equal(400);
        done();
      });
  });

  it('Should return WARN when getting Log Level', function (done) {
    const plugin = new MyFakePlugin(false);
    const runner = new core.TestingPluginRunner(plugin);

    const requestBody = {
      level: 'WARN'
    };

    request(runner.plugin.app)
      .put('/v1/log_level')
      .send(requestBody)
      .end(function (err, res) {
        expect(res.status).to.equal(200);
      });

    request(runner.plugin.app)
      .get('/v1/log_level')
      .end(function (err, res) {
        expect(res.status).to.equal(200);
        expect(res.body.level).to.equal(requestBody.level);
        done();
      });
  });
});

describe('Request Gateway helper API tests', function () {
  let rpMockup: sinon.SinonStub = sinon.stub().returns(Promise.resolve('YOLO'));

  class MyFakePlugin extends core.BasePlugin {
  }

  it('Check that uri is passed correctly', function (done) {
    const plugin = new MyFakePlugin(false);
    const runner = new core.TestingPluginRunner(plugin, rpMockup);

    const fakeUri = '/v1/easter_eggs/';
    const fakeMethod = 'GET';

    // We try a call to the Gateway
    runner.plugin.requestGatewayHelper('GET', fakeUri).then(() => {
      expect(rpMockup.args[0][0].method).to.be.eq(fakeMethod);
      expect(rpMockup.args[0][0].uri).to.be.eq(fakeUri);
      done();
    });
  });

  it('Authentification token should be passed from values passed in the env', function (
    done
  ) {
    const plugin = new MyFakePlugin(false);
    const runner = new core.TestingPluginRunner(plugin, rpMockup);

    // We try a call to the Gateway
    runner.plugin
      .requestGatewayHelper('GET', '/v1/easter_eggs/')
      .then(() => {
        expect(rpMockup.args[1][0].auth.pass).to.be.eq(PLUGIN_AUTHENTICATION_TOKEN);
        expect(rpMockup.args[1][0].auth.user).to.be.eq(PLUGIN_WORKER_ID);
        done();
      });
  });

  it('Check that body is passed correctly when set', function (done) {
    const plugin = new MyFakePlugin(false);
    const runner = new core.TestingPluginRunner(plugin, rpMockup);

    const fakeUri = '/v1/easter_eggs/';
    const fakeMethod = 'GET';
    const fakeBody = {sucess: true};

    // We try a call to the Gateway
    runner.plugin.requestGatewayHelper('GET', fakeUri, fakeBody).then(() => {
      expect(rpMockup.args[2][0].method).to.be.eq(fakeMethod);
      expect(rpMockup.args[2][0].uri).to.be.eq(fakeUri);
      expect(rpMockup.args[2][0].body).to.be.eq(fakeBody);
      done();
    });
  });
});

describe('Data File helper Tests', function () {
  class MyFakePlugin extends core.BasePlugin {
  }

  const fakeDataFile = Buffer.from('Hello');


  const rpMockup = sinon.stub().returns(Promise.resolve(fakeDataFile));

  const plugin = new MyFakePlugin(false);
  const runner = new core.TestingPluginRunner(plugin, rpMockup);

  it('DataFile: Should call the proper gateway URL', function (done) {

    const dataFileGatewayURI = '/v1/data_file/data';
    const method = 'GET';
    const fakeDataFileURI = 'mics://fake_dir/fake_file';

    // We try a call to the Gateway
    runner.plugin.fetchDataFile(fakeDataFileURI).then(file => {
      expect(rpMockup.args[0][0].method).to.be.eq(method);
      expect(rpMockup.args[0][0].uri).to.be.eq(`http://${runner.plugin.gatewayHost}:${runner.plugin.gatewayPort}${dataFileGatewayURI}`);
      expect(rpMockup.args[0][0].qs['uri']).to.be.eq(fakeDataFileURI);
      expect(file).to.be.eq(fakeDataFile);
      done();
    });
  });

  it('ConfigurationFile: Should call the proper gateway URL', function (
    done
  ) {

    const confFileName = 'toto';
    const method = 'GET';
    const confFileGatewayURI = `/v1/configuration/technical_name=${confFileName}`;

    // We try a call to the Gateway
    runner.plugin.fetchConfigurationFile(confFileName).then(file => {
      expect(rpMockup.args[1][0].method).to.be.eq(method);
      expect(rpMockup.args[1][0].uri).to.be.eq(`http://${runner.plugin.gatewayHost}:${runner.plugin.gatewayPort}${confFileGatewayURI}`);
      expect(file).to.be.eq(fakeDataFile);
      done();
    });
  });

});

describe('Instance Context Expiration Tests', function () {

  class MyFakePlugin extends core.BasePlugin {
  }

  it('InstanceContextExpiration: Check Instance Context variability: should be less than 10%', function (
    done
  ) {

    const plugin = new MyFakePlugin(false);

    const refreshInterval = plugin.getInstanceContextCacheExpiration();

    expect(refreshInterval).to.be.gte(plugin.INSTANCE_CONTEXT_CACHE_EXPIRATION);
    expect(refreshInterval).to.be.lte(plugin.INSTANCE_CONTEXT_CACHE_EXPIRATION * 1.1);
    done();
  });

});
