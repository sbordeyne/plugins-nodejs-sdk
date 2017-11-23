import { expect } from "chai";
import "mocha";
import { core } from "../";
import * as request from "supertest";
import * as sinon from "sinon";
import * as mockery from "mockery";
import * as rp from "request-promise-native";

class MyFakeEmailRendererPlugin extends core.EmailRendererPlugin {
  protected onEmailContents(
    request: core.EmailRenderRequest,
    instanceContext: core.EmailRendererBaseInstanceContext
  ): Promise<core.EmailRendererPluginResponse> {
    const response: core.EmailRendererPluginResponse = {
      content: {
        html: request.call_id
      },
      meta: {
        from_email: "hello@hello.com",
        from_name: "Hello",
        to_email: "hello@destination.com",
        to_name: "Destination",
        reply_to: "hello@hello.com",
        subject_line: "Hello You!"
      }
    };

    return Promise.resolve(response);
  }
}

const rpMockup: sinon.SinonStub = sinon.stub().returns(
  new Promise((resolve, reject) => {
    resolve("Yolo");
  })
);

describe("Fetch Email Renderer API", () => {
  // All the magic is here
  const plugin = new MyFakeEmailRendererPlugin();
  const runner = new core.TestingPluginRunner(plugin, rpMockup);

  it("Check that email_renderer_id is passed correctly in fetchCreative & fetchCreativeProperties", function(
    done
  ) {
    const fakeId = "42000000";

    // We try a call to the Gateway
    (runner.plugin as MyFakeEmailRendererPlugin)
      .fetchCreative(fakeId)
      .then(() => {
        expect(rpMockup.args[0][0].uri).to.be.eq(
          `${runner.plugin.outboundPlatformUrl}/v1/creatives/${fakeId}`
        );

        // We try a call to the Gateway
        (runner.plugin as MyFakeEmailRendererPlugin)
          .fetchCreativeProperties(fakeId)
          .then(() => {
            expect(rpMockup.args[1][0].uri).to.be.eq(
              `${runner.plugin
                .outboundPlatformUrl}/v1/creatives/${fakeId}/renderer_properties`
            );
            done();
          });
      });
  });
});

describe("Email Renderer API test", function() {
  // All the magic is here
  const plugin = new MyFakeEmailRendererPlugin();

  it("Check that the plugin is giving good results with a simple onEmailContents handler", function(
    done
  ) {
    const rpMockup = sinon.stub();

    rpMockup.onCall(0).returns(
      new Promise((resolve, reject) => {
        const creative: core.ResponseData<core.Creative> = {
          status: "ok",
          data: {
            type: "EMAIL_TEMPLATE",
            id: "8592",
            organisation_id: "1135",
            name: "Market Box",
            technical_name: "hello",
            archived: false,
            editor_version_id: "1020",
            editor_version_value: "1.0.0",
            editor_group_id: "com.mediarithmics.template.email",
            editor_artifact_id: "default-editor",
            editor_plugin_id: "1015",
            renderer_version_id: "1047",
            renderer_version_value: "1.0.1",
            renderer_group_id: "com.mediarithmics.email-renderer",
            renderer_artifact_id: "email-handlebars-template",
            renderer_plugin_id: "1034",
            creation_date: 1504533940679,
            subtype: "EMAIL_TEMPLATE"
          }
        };
        resolve(creative);
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
      "email_renderer_id": "1034",
      "call_id": "8e20e0fc-acb5-4bf3-8e36-f85a9ff25150",
      "context": "LIVE",
      "creative_id": "6475",
      "campaign_id": "1810",
      "campaign_technical_name": null,
      "user_identifiers": [
        {
          "type": "USER_POINT",
          "user_point_id": "62ce5f30-191d-40fb-bd6b-8ea6f39c80eb"
        },
        {
          "type": "USER_EMAIL",
          "hash": "8865501e69c464f42a5ae7bada6d342a",
          "email": "email_mics_152@yopmail.com",
          "operator": null,
          "creation_ts": 1489688728108,
          "last_activity_ts": 1489688728108,
          "providers": [
          ]
        }
      ],
      "user_data_bag": {
      },
      "click_urls": [
      ],
      "email_tracking_url": null
    }`);

    request(runner.plugin.app)
      .post("/v1/email_contents")
      .send(requestBody)
      .end(function(err, res) {
        expect(res.status).to.equal(200);

        expect(JSON.parse(res.text).content.html).to.be.eq(requestBody.call_id);
        done();
      });
  });
});
