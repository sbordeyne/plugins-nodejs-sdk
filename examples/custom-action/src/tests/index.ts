import { expect } from "chai";
import { core } from "@mediarithmics/plugins-nodejs-sdk";
import "mocha";
import * as request from "supertest";
import * as sinon from "sinon";
import { MyCustomActionPlugin } from "../MyPluginImpl";

describe.only("Test Custom Action example", function () {
  // All the magic is here
  const plugin = new MyCustomActionPlugin(false);
  let runner: core.TestingPluginRunner;

  it("Check the behavior of a dummy custom action", function (done) {
    const rpMockup: sinon.SinonStub = sinon.stub();

    const properties: core.DataListResponse<core.PluginProperty> = {
      status: "ok",
      count: 1,
      data: [
        {
          technical_name: "hello_world",
          value: {
            value: "Sacre Hubert",
          },
          property_type: "STRING",
          origin: "PLUGIN",
          writable: true,
          deletable: false,
        },
      ],
    };

    rpMockup
      .withArgs(
        sinon.match.has(
          "uri",
          sinon.match(function (value: string) {
            return (
              value.match(
                /\/v1\/scenario_custom_actions\/(.){1,10}\/properties/
              ) !== null
            );
          })
        )
      )
      .returns(properties);

    runner = new core.TestingPluginRunner(plugin, rpMockup);

    // We init the plugin
    request(runner.plugin.app)
      .post("/v1/init")
      .send({ authentication_token: "Manny", worker_id: "Calavera" })
      .end((err, res) => {
        expect(res.status).to.equal(200);
      });

    const customActionRequest: core.CustomActionRequest = {
      user_point_id: "26340584-f777-404c-82c5-56220667464b",
      custom_action_id: "62",
    };

    request(runner.plugin.app)
      .post("/v1/scenario_custom_actions")
      .send(customActionRequest)
      .end(function (err, res) {
        expect(res.status).to.equal(200);
        expect(JSON.parse(res.text).status).to.be.eq("ok");

        done();
      });
  });

  afterEach(() => {
    // We clear the cache so that we don't have any processing still running in the background
    runner.plugin.pluginCache.clear();
  });
});
