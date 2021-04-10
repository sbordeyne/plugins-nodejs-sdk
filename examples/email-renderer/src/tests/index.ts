import { expect } from "chai";
import { core } from "@mediarithmics/plugins-nodejs-sdk";
import "mocha";
import * as request from "supertest";
import * as sinon from "sinon";
import { ExampleEmailRenderer } from "../ExampleEmailRenderer";

describe.only("Test Email Renderer example", function () {
  const plugin = new ExampleEmailRenderer(false);
  let runner: core.TestingPluginRunner;

  it("Check the behavior of a dummy email renderer", async() => {
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
        {
          technical_name: "mics_api_token",
          value: {
            value: "api:xxx",
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
                          /\/v1\/creatives\/(.){1,10}\/renderer_properties/
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

    const emailRenderRequest: core.EmailRenderRequest = {
      email_renderer_id: "54",
      call_id: "55",
      context: "LIVE",
      creative_id: "56",
      campaign_id: "57",
      user_identifiers: [
        {user_point_id: "xxxx", creation_ts: 1617981610740, type: 'USER_POINT'},
        {hash: "xxxx", email: "test@mediarithmics.com", creation_ts: 1617981610740, last_activity_ts: 1617981610740, providers: [], type: 'USER_EMAIL'}
      ],
      user_data_bag: null,
      click_urls: [],
      email_tracking_url: ""
    };

    request(runner.plugin.app)
        .post("/v1/email_contents")
        .send(emailRenderRequest)
        .expect(200);
  });

  afterEach(() => {
    // We clear the cache so that we don't have any processing still running in the background
    runner.plugin.pluginCache.clear();
  });
});
