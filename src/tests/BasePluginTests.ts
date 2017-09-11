import { expect } from "chai";
import "mocha";
import { core } from "../";
import * as request from "supertest";
import * as sinon from "sinon";
import * as rp from "request-promise-native";

describe("Plugin Status API Tests", function() {
  class MyFakePlugin extends core.BasePlugin {}

  it("should return plugin status (200) if the plugin is OK", function(done) {
    const plugin = new MyFakePlugin();    
    const runner = new core.TestingPluginRunner(plugin);

    request(runner.plugin.app)
      .post("/v1/init")
      .send({ authentication_token: "Manny", worker_id: "Calavera" })
      .end((err, res) => {
        expect(res.status).to.equal(200);
      });

    request(runner.plugin.app)
      .get("/v1/status")
      .end(function(err, res) {
        expect(res.status).to.equal(200);
        done();
      });
  });

  it("should return (503) if the plugin is not initialized yet", function(
    done
  ) {
    const plugin = new MyFakePlugin();    
    const runner = new core.TestingPluginRunner(plugin);

    request(runner.plugin.app)
      .get("/v1/status")
      .end(function(err, res) {
        expect(res.status).to.equal(503);
        done();
      });
  });
});

describe("Plugin log level API tests", function() {
  class MyFakePlugin extends core.BasePlugin {}

  it("Log Level update should return 200", function(done) {
    const plugin = new MyFakePlugin();    
    const runner = new core.TestingPluginRunner(plugin);

    const requestBody = {
      level: "debug"
    };

    request(runner.plugin.app)
      .put("/v1/log_level")
      .send(requestBody)
      .end(function(err, res) {
        expect(res.status).to.equal(200);
        done();
      });
  });

  it("Malformed Log level update should return 400", function(done) {
    const plugin = new MyFakePlugin();    
    const runner = new core.TestingPluginRunner(plugin);

    // Bad input format
    const requestBody = {
      hector: "debug"
    };

    request(runner.plugin.app)
      .put("/v1/log_level")
      .send(requestBody)
      .end(function(err, res) {
        expect(res.status).to.equal(400);
        done();
      });
  });

  it("Should return WARN when getting Log Level", function(done) {
    const plugin = new MyFakePlugin();    
    const runner = new core.TestingPluginRunner(plugin);

    const requestBody = {
      level: "WARN"
    };

    request(runner.plugin.app)
      .put("/v1/log_level")
      .send(requestBody)
      .end(function(err, res) {
        expect(res.status).to.equal(200);
      });

    request(runner.plugin.app)
      .get("/v1/log_level")
      .end(function(err, res) {
        expect(res.status).to.equal(200);
        expect(res.body.level).to.equal(requestBody.level);
        done();
      });
  });
});

describe("Request Gateway helper API tests", function() {
  let rpMockup: sinon.SinonStub = sinon.stub().returns(Promise.resolve("YOLO"));

  class MyFakePlugin extends core.BasePlugin {}

  it("Check that uri is passed correctly", function(done) {
    const plugin = new MyFakePlugin();    
    const runner = new core.TestingPluginRunner(plugin, rpMockup);

    const fakeUri = "/v1/easter_eggs/";
    const fakeMethod = "GET";

    // We try a call to the Gateway
    runner.plugin.requestGatewayHelper("GET", fakeUri).then(() => {
      expect(rpMockup.args[0][0].method).to.be.eq(fakeMethod);
      expect(rpMockup.args[0][0].uri).to.be.eq(fakeUri);
      done();
    });
  });

  it("Authentification token should be passed from values passed in /v1/init", function(
    done
  ) {
    const plugin = new MyFakePlugin();    
    const runner = new core.TestingPluginRunner(plugin, rpMockup);

    const authenticationToken = "Manny";
    const workerId = "Calavera";

    // We init the plugin
    request(runner.plugin.app)
      .post("/v1/init")
      .send({ authentication_token: authenticationToken, worker_id: workerId })
      .end((err, res) => {
        expect(res.status).to.equal(200);

        // We try a call to the Gateway
        runner.plugin
          .requestGatewayHelper("GET", "/v1/easter_eggs/")
          .then(() => {
            expect(rpMockup.args[1][0].auth.pass).to.be.eq(authenticationToken);
            expect(rpMockup.args[1][0].auth.user).to.be.eq(workerId);
            done();
          });
      });
  });

  it("Check that body is passed correctly when set", function(done) {
    const plugin = new MyFakePlugin();    
    const runner = new core.TestingPluginRunner(plugin, rpMockup);

    const fakeUri = "/v1/easter_eggs/";
    const fakeMethod = "GET";
    const fakeBody = { sucess: true };

    // We try a call to the Gateway
    runner.plugin.requestGatewayHelper("GET", fakeUri, fakeBody).then(() => {
      expect(rpMockup.args[2][0].method).to.be.eq(fakeMethod);
      expect(rpMockup.args[2][0].uri).to.be.eq(fakeUri);
      expect(rpMockup.args[2][0].body).to.be.eq(fakeBody);
      done();
    });
  });
});
