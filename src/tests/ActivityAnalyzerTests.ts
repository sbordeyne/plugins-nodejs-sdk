import { expect } from "chai";
import "mocha";
import { core } from "../";
import * as request from "supertest";
import * as sinon from "sinon";
import * as mockery from "mockery";
import * as rp from "request-promise-native";

describe("Fetch analyzer API", () => {
  class MyFakeActivityAnalyzerPlugin extends core.ActivityAnalyzerPlugin {
    protected onActivityAnalysis(
      request: core.ActivityAnalyzerRequest,
      instanceContext: core.ActivityAnalyzerBaseInstanceContext
    ) {
      const updatedActivity = request.activity;

      // We add a field on the processed activitynégative
      updatedActivity.processed_by = `${instanceContext.activityAnalyzer
        .group_id}:${instanceContext.activityAnalyzer
        .artifact_id} v.${instanceContext.activityAnalyzer
        .visit_analyzer_plugin_id}`;

      const response: core.ActivityAnalyzerPluginResponse = {
        status: "ok",
        data: updatedActivity
      };

      return Promise.resolve(response);
    }
  }

  const rpMockup: sinon.SinonStub = sinon.stub().returns(
    new Promise((resolve, reject) => {
      resolve("Yolo");
    })
  );

  // All the magic is here
  const plugin = new MyFakeActivityAnalyzerPlugin(false);
  const runner = new core.TestingPluginRunner(plugin, rpMockup);

  it("Check that ActivityAnalyzerId is passed correctly in FetchActivityAnalyzer", function(
    done
  ) {
    const fakeActivityAnalyzerId = "42000000";

    // We try a call to the Gateway
    (runner.plugin as MyFakeActivityAnalyzerPlugin).fetchActivityAnalyzer(fakeActivityAnalyzerId).then(() => {
      expect(rpMockup.args[0][0].uri).to.be.eq(
        `${runner.plugin.outboundPlatformUrl}/v1/activity_analyzers/${fakeActivityAnalyzerId}`
      );
      done();
    });
  });

  it("Check that ActivityAnalyzerId is passed correctly in FetchActivityAnalyzerProperties", function(
    done
  ) {
    const fakeActivityAnalyzerId = "4255";

    // We try a call to the Gateway
    (runner.plugin as MyFakeActivityAnalyzerPlugin).fetchActivityAnalyzerProperties(fakeActivityAnalyzerId).then(() => {
      expect(rpMockup.args[1][0].uri).to.be.eq(
        `${plugin.outboundPlatformUrl}/v1/activity_analyzers/${fakeActivityAnalyzerId}/properties`
      );
      done();
    });
  });
});

describe("Activity Analysis API test", function() {

  class MyFakeSimpleActivityAnalyzerPlugin extends core.ActivityAnalyzerPlugin {
    protected onActivityAnalysis(
      request: core.ActivityAnalyzerRequest,
      instanceContext: core.ActivityAnalyzerBaseInstanceContext
    ) {
      const response: core.ActivityAnalyzerPluginResponse = {
        status: "ok",
        data: request.activity
      };
      return Promise.resolve(response);
    }
  }

  // All the magic is here
  const plugin = new MyFakeSimpleActivityAnalyzerPlugin(false);

  it("Check that the plugin is giving good results with a simple activityAnalysis handler", function(
    done
  ) {
    const rpMockup = sinon.stub();

    rpMockup.onCall(0).returns(
      new Promise((resolve, reject) => {
        const pluginInfo: core.ResponseData<core.ActivityAnalyzer> = {
          status: "ok",
          data: {
            id: "42",
            organisation_id: "1001",
            name: "Yolo",
            group_id: "5445",
            artifact_id: "5441",
            visit_analyzer_plugin_id: 555777
          }
        };
        resolve(pluginInfo);
      })
    );
    rpMockup.onCall(1).returns(
      new Promise((resolve, reject) => {
        const pluginInfo: core.PluginPropertyResponse = {
          status: "ok",
          count: 45,
          data: [
            {
              technical_name: "hello_world",
              value: {
                value: "Yay"
              },
              property_type: "STRING",
              origin: "PLUGIN",
              writable: true,
              deletable: false
            }
          ]
        };
        resolve(pluginInfo);
      })
    );

    const runner = new core.TestingPluginRunner(plugin, rpMockup);    

    // We init the plugin
    request(runner.plugin.app)
      .post("/v1/init")
      .send({ authentication_token: "Manny", worker_id: "Calavera" })
      .end((err, res) => {
        expect(res.status).to.equal(200);
      });

    const requestBody = JSON.parse(`{
      "activity_analyzer_id": 1923,
      "datamart_id": 1034,
      "channel_id": "1268",
      "activity": {
        "$email_hash": null,
        "$events": [
          {
            "$event_name": "page HP",
            "$properties": {
              "$referrer": "https://www.google.fr/",
              "$url": "https://estcequecestbientotlapero.fr/",
              "produit": "SANTE",
              "session id": "tQ6GQojf"
            },
            "$ts": 1479820606900
          }
        ],
        "$location": null,
        "$session_duration": 302,
        "$session_status": "CLOSED_SESSION",
        "$site_id": "1268",
        "$topics": {},
        "$ts": 1479820606901,
        "$ttl": 0,
        "$type": "SITE_VISIT",
        "$user_account_id": null,
        "$user_agent_id": "vec:289388396"
      }
    }`);

    request(runner.plugin.app)
      .post("/v1/activity_analysis")
      .send(requestBody)
      .end(function(err, res) {
        expect(res.status).to.equal(200);

        expect(JSON.parse(res.text).data).to.deep.eq(requestBody.activity);

        done();
      });
  });
});
