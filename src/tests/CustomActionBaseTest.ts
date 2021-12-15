import { expect } from "chai";
import { core } from "../";
import "mocha";
import * as request from "supertest";
import * as sinon from "sinon";
import { CustomActionBaseInstanceContext } from "../mediarithmics/plugins/custom-action/CustomActionBasePlugin";
import { PropertiesWrapper } from "../mediarithmics";

class MyFakeCustomActionBasePlugin extends core.CustomActionBasePlugin {
  protected async instanceContextBuilder(
    customActionId: string
  ): Promise<CustomActionBaseInstanceContext> {
    const customActionProps = await this.fetchCustomActionProperties(
      customActionId
    );

    const customAction = await this.fetchCustomAction(customActionId);

    const context: CustomActionBaseInstanceContext = {
      customAction: customAction,
      properties: new PropertiesWrapper(customActionProps),
    };

    return context;
  }
  
  protected onCustomActionCall(
    request: core.CustomActionRequest,
    instanceContext: core.CustomActionBaseInstanceContext
  ): Promise<core.CustomActionPluginResponse> {
    const response: core.CustomActionPluginResponse = {
      status: "ok",
    };
    return Promise.resolve(response);
  }
}

const rpMockup: sinon.SinonStub = sinon.stub().returns(
  new Promise((resolve, reject) => {
    resolve("Yolo");
  })
);

describe("Fetch Scenario Custom Action Gateway API", () => {
  // All the magic is here
  const plugin = new MyFakeCustomActionBasePlugin(false);
  const runner = new core.TestingPluginRunner(plugin, rpMockup);

  it("Check that custom_action_id is passed correctly in fetchCustomActionProperties", function (done) {
    const fakeToken = "xxxx";
    const fakeId = "62";

    // We try to call the Gateway
    (runner.plugin as MyFakeCustomActionBasePlugin)
      .fetchCustomActionProperties(fakeId)
      .then(() => {
        expect(rpMockup.args[0][0].uri).to.be.eq(
          `${this.outboundPlatformUrl}/v1/scenario_custom_actions/${fakeId}/properties`
        );
        done();
      });
  });

  it("Check that custom_action_id is passed correctly in fetchCustomAction", function (done) {
    const fakeToken = "xxxx";
    const fakeId = "62";

    // We try to call the Gateway
    (runner.plugin as MyFakeCustomActionBasePlugin)
      .fetchCustomAction(fakeId)
      .then(() => {
        expect(rpMockup.args[0][0].uri).to.be.eq(
          `${this.outboundPlatformUrl}/v1/scenario_custom_actions/${fakeId}`
        );
        done();
      });
  });

  afterEach(() => {
    // We clear the cache so that we don't have any processing still running in the background
    runner.plugin.pluginCache.clear();
  });
});

describe.only("Custom Action API test", function () {
  // All the magic is here
  const plugin = new MyFakeCustomActionBasePlugin(false);
  let runner: core.TestingPluginRunner;

  it("Check that the plugin is giving good results with a simple handler", function (done) {
    const rpMockup: sinon.SinonStub = sinon.stub();

    const customAction: core.DataResponse<core.CustomAction> = {
      status: 'ok',
      data: {
        id: "1",
        name: "custom action",
        organisation_id: "1234",
        group_id: "com.test.custom-action",
        artifact_id: "test",
        creation_ts: 1234,
        created_by: "2",
        version_id: "3",
        version_value: "1.0.0"
      }
    };
    rpMockup
      .withArgs(
        sinon.match.has(
          "uri",
          sinon.match(function (value: string) {
            return (
              value.match(
                /\/v1\/scenario_custom_actions\/(.){1,10}$/
              ) !== null
            );
          })
        )
      )
      .returns(customAction);

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
