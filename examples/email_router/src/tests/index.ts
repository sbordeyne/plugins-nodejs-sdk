import { expect } from "chai";
import "mocha";
import { core } from "@mediarithmics/plugins-nodejs-sdk";
import * as request from "supertest";
import * as sinon from "sinon";
import * as rp from "request-promise-native";
import { MySimpleEmailRouter, MailjetSentResponse } from "../MyPluginImpl";

describe("Test Example Email Router", function() {

    function buildRpMockup() {
// We stub the Gateway calls
const rpMockup: sinon.SinonStub = sinon.stub();

  // Activity Analyzer stub
  const emailRouterProperties: core.ResponseListOfData<core.PluginProperty> = {
    status: "ok",
    data: [
      {
        technical_name: "authentication_token",
        value: {
          value: "asd"
        },
        property_type: "STRING",
        origin: "PLUGIN",
        writable: true,
        deletable: false
      }
    ],
    count: 1
  };

  rpMockup
    .withArgs(
      sinon.match.has(
        "uri",
        sinon.match(function(value: string) {
          return (
            value.match(/\/v1\/email_routers\/(.){1,10}\/properties/) !== null
          );
        })
      )
    )
    .returns(emailRouterProperties);

  

  return rpMockup;
    }
  

  it("Check behavior of dummy Email Router", function(done) {
    // All the magic is here
    const plugin = new MySimpleEmailRouter(false);
    const rpMockup = buildRpMockup();    
    const runner = new core.TestingPluginRunner(plugin, rpMockup);

    const emailRoutingRequest: core.EmailRoutingRequest = {
        email_router_id: "2",
        call_id: "ba568918-2f06-4f16-bd0e-f50e04b92d34",
        context: "LIVE",
        creative_id: "7197",
        campaign_id: "1896",
        blast_id: "1993",
        datamart_id: "1090",
        user_identifiers: [
          {
            type: "USER_POINT",
            user_point_id: "26340584-f777-404c-82c5-56220667464b"
          } as core.UserPointIdentifierInfo,
          {
            type: "USER_ACCOUNT",
            user_account_id: "914eb2aa50cef7f3a8705b6bb54e50bb",
            creation_ts: 123456
          } as core.UserAccountIdentifierInfo,
          {
            type: "USER_EMAIL",
            hash: "e2749f6f4d8104ec385a75490b587c86",
            email: "wow@hello.com",
            operator: undefined,
            creation_ts: 1493118667529,
            last_activity_ts: 1493127642622,
            providers: []
          } as core.UserEmailIdentifierInfo,
          {
            type: "USER_AGENT",
            vector_id: "vec:886742516",
            device: {
              form_factor: "PERSONAL_COMPUTER",
              os_family: "MAC_OS",
              browser_family: "CHROME",
              brand: null,
              model: null,
              os_version: null,
              carrier: null
            },
            creation_ts: 1493118667529,
            last_activity_ts: 1493126966889,
            providers: [],
            mappings: []
          } as core.UserAgentIdentifierInfo
        ],
        meta: {
          from_email: "news@info.velvetconsulting.paris",
          from_name: "Velvet Consulting",
          to_email: "hello@yolo.com",
          to_name: "Hello",
          reply_to: "no-reply@vlvt1.com",
          subject_line: "Engagez-vous assez vos shoppers avec votre marque ?"
        },
        content: {
          html: "<html><head></head><body><h1>Hello World!</h1></body></html>",
          text: "Hello World!"
        },
        data: "{}"
      };

    const mjResponse: MailjetSentResponse = {
      Sent: [
        {
          Email: "caroline_maier@bd.com",
          MessageID: 16888659454515816
        }
      ]
    };

    rpMockup
      .withArgs(
        sinon.match.has(
          "uri",
          sinon.match(function(value: string) {
            return (
              value.match(
                /\/v1\/external_services\/technical_name=(.){1,20}\/call/
              ) !== null
            );
          })
        )
      )
      .returns(mjResponse);

    // Plugin init
    request(runner.plugin.app)
      .post("/v1/init")
      .send({ authentication_token: "Manny", worker_id: "Calavera" })
      .end((err, res) => {
        expect(res.status).to.equal(200);

        // Plugin log level to debug
        request(runner.plugin.app)
          .put("/v1/log_level")
          .send({ level: "debug" })
          .end((err, res) => {
            expect(res.status).to.equal(200);

            // Activity to process
            request(runner.plugin.app)
              .post("/v1/email_routing")
              .send(emailRoutingRequest)
              .end((err, res) => {
                expect(res.status).to.eq(200);

                expect(
                  (JSON.parse(res.text) as core.EmailRoutingPluginResponse)
                    .result
                ).to.be.true;
                done();
              });
          });
      });
  });

  it("Check the Email Routeur retry", function(done) {

    this.timeout(50000);

    // All the magic is here
    const plugin = new MySimpleEmailRouter(false);
    const rpMockup = buildRpMockup();    
    const runner = new core.TestingPluginRunner(plugin, rpMockup);
    
    const emailRoutingRequest: core.EmailRoutingRequest = {
        email_router_id: "2",
        call_id: "ba568918-2f06-4f16-bd0e-f50e04b92d34",
        context: "LIVE",
        creative_id: "7197",
        campaign_id: "1896",
        blast_id: "1993",
        datamart_id: "1090",
        user_identifiers: [
          {
            type: "USER_POINT",
            user_point_id: "26340584-f777-404c-82c5-56220667464b"
          } as core.UserPointIdentifierInfo,
          {
            type: "USER_ACCOUNT",
            user_account_id: "914eb2aa50cef7f3a8705b6bb54e50bb",
            creation_ts: 123456
          } as core.UserAccountIdentifierInfo,
          {
            type: "USER_EMAIL",
            hash: "e2749f6f4d8104ec385a75490b587c86",
            email: "wow@hello.com",
            operator: undefined,
            creation_ts: 1493118667529,
            last_activity_ts: 1493127642622,
            providers: []
          } as core.UserEmailIdentifierInfo,
          {
            type: "USER_AGENT",
            vector_id: "vec:886742516",
            device: {
              form_factor: "PERSONAL_COMPUTER",
              os_family: "MAC_OS",
              browser_family: "CHROME",
              brand: null,
              model: null,
              os_version: null,
              carrier: null
            },
            creation_ts: 1493118667529,
            last_activity_ts: 1493126966889,
            providers: [],
            mappings: []
          } as core.UserAgentIdentifierInfo
        ],
        meta: {
          from_email: "news@info.velvetconsulting.paris",
          from_name: "Velvet Consulting",
          to_email: "hello@yolo.com",
          to_name: "Hello",
          reply_to: "no-reply@vlvt1.com",
          subject_line: "Engagez-vous assez vos shoppers avec votre marque ?"
        },
        content: {
          html: "<html><head></head><body><h1>Hello World!</h1></body></html>",
          text: "Hello World!"
        },
        data: "{}"
      };

    const mjResponse: MailjetSentResponse = {
      Sent: [
        {
          Email: "caroline_maier@bd.com",
          MessageID: 16888659454515816
        }
      ]
    };

    const mjMock = rpMockup.withArgs(
      sinon.match.has(
        "uri",
        sinon.match(function(value: string) {
          return (
            value.match(
              /\/v1\/external_services\/technical_name=(.){1,20}\/call/
            ) !== null
          );
        })
      )
    );

    mjMock.onCall(1).throws("FakeError");
    mjMock.onCall(2).returns({
      Sent: []
    });
    mjMock.onCall(3).returns(mjResponse);

    // Plugin init
    request(runner.plugin.app)
      .post("/v1/init")
      .send({ authentication_token: "Manny", worker_id: "Calavera" })
      .end((err, res) => {
        expect(res.status).to.equal(200);

        // Plugin log level to debug
        request(runner.plugin.app)
          .put("/v1/log_level")
          .send({ level: "debug" })
          .end((err, res) => {
            expect(res.status).to.equal(200);

            // Activity to process
            request(runner.plugin.app)
              .post("/v1/email_routing")
              .send(emailRoutingRequest)
              .end((err, res) => {
                expect(res.status).to.eq(200);

                expect(
                  (JSON.parse(res.text) as core.EmailRoutingPluginResponse)
                    .result
                ).to.be.true;
                done();
              });
          });
      });
  });
});
