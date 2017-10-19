import { expect } from "chai";
import "mocha";
import { core } from "../";
import * as request from "supertest";
import * as sinon from "sinon";
import * as mockery from "mockery";
import * as rp from "request-promise-native";

class MyFakeEmailRouteurPlugin extends core.EmailRouteurPlugin {
  protected onEmailRouting(
    request: core.EmailRoutingRequest,
    instanceContext: core.EmailRouteurBaseInstanceContext
  ) {
    const response: core.EmailRouteurPluginResponse = {
      result: true
    };

    return Promise.resolve(response);
  }

  protected onEmailCheck(
    request: core.CheckEmailsRequest,
    instanceContext: core.EmailRouteurBaseInstanceContext
  ): Promise<core.EmailRouteurPluginResponse> {
    const response: core.EmailRouteurPluginResponse = {
      result: true
    };

    return Promise.resolve(response);
  }
}

const rpMockup: sinon.SinonStub = sinon.stub().returns(
  new Promise((resolve, reject) => {
    resolve("Yolo");
  })
);

describe("Fetch Email Routeur API", () => {

  // All the magic is here
  const plugin = new MyFakeEmailRouteurPlugin();
  const runner = new core.TestingPluginRunner(plugin, rpMockup);

  it("Check that email_router_id is passed correctly in fetchEmailRouteurProperties", function(
    done
  ) {
    const fakeId = "42000000";

    // We try a call to the Gateway
    (runner.plugin as MyFakeEmailRouteurPlugin)
      .fetchEmailRouteurProperties(fakeId)
      .then(() => {
        expect(rpMockup.args[0][0].uri).to.be.eq(
          `${runner.plugin
            .outboundPlatformUrl}/v1/email_routers/${fakeId}/properties`
        );
        done();
      });
  });

});

describe("Email Routeur API test", function() {

  // All the magic is here
  const plugin = new MyFakeEmailRouteurPlugin();

  it("Check that the plugin is giving good results with a simple onEmailRouting handler", function(
    done
  ) {
    const rpMockup = sinon.stub();

    rpMockup.onCall(0).returns(
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
      "email_router_id": "2",
      "call_id": "ba568918-2f06-4f16-bd0e-f50e04b92d34",
      "context": "LIVE",
      "creative_id": "7197",
      "campaign_id": "1896",
      "datamart_id": "1090",
      "user_identifiers": [
        {
          "type": "USER_POINT",
          "user_point_id": "26340584-f777-404c-82c5-56220667464b"
        },
        {
          "type": "USER_ACCOUNT",
          "user_account_id": "914eb2aa50cef7f3a8705b6bb54e50bb",
          "creation_ts": null
        },
        {
          "type": "USER_EMAIL",
          "hash": "e2749f6f4d8104ec385a75490b587c86",
          "email": null,
          "operator": null,
          "creation_ts": 1493118667529,
          "last_activity_ts": 1493127642622,
          "providers": []
        },
        {
          "type": "USER_AGENT",
          "vector_id": "vec:886742516",
          "device": {
            "form_factor": "PERSONAL_COMPUTER",
            "os_family": "MAC_OS",
            "browser_family": "CHROME",
            "brand": null,
            "model": null,
            "os_version": null,
            "carrier": null
          },
          "creation_ts": 1493118667529,
          "last_activity_ts": 1493126966889,
          "providers": [],
          "mappings": []
        }
      ],
      "meta": {
        "from_email": "news@info.velvetconsulting.paris",
        "from_name": "Velvet Consulting",
        "to_email": null,
        "to_name": null,
        "reply_to": "no-reply@vlvt1.com",
        "subject_line": "Engagez-vous assez vos shoppers avec votre marque ?"
      },
      "content": {
        "html": "<html><head></head><body><h1>Hello World!</h1></body></html>",
        "text": "Hello World!"
      },
      "data": {}
    }`);

    request(runner.plugin.app)
    .post("/v1/email_router_check")
    .send(requestBody)
    .end(function(err, res) {
      expect(res.status).to.equal(200);

      expect(JSON.parse(res.text).result).to.be.true;

    });

    request(runner.plugin.app)
      .post("/v1/email_routing")
      .send(requestBody)
      .end(function(err, res) {
        expect(res.status).to.equal(200);

        expect(JSON.parse(res.text).result).to.be.true;

        done();
      });
  });
});
