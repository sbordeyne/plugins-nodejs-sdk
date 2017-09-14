import { expect } from "chai";
import "mocha";
import { core } from "@mediarithmics/plugins-nodejs-sdk";
import * as request from "supertest";
import * as sinon from "sinon";
import * as rp from "request-promise-native";
import { MyActivityAnalyzerPlugin } from "../MyPluginImpl";

describe("Test Example Activity Analyzer", function() {
  // We stub the Gateway calls
  const rpMockup: sinon.SinonStub = sinon.stub();

  // Activity Analyzer stub
  const activityAnalyzer: core.ActivityAnalyzerResponse = {
    status: "ok",
    data: {
      id: "1000",
      name: "my analyzer",
      organisation_id: "1000",
      visit_analyzer_plugin_id: 1001,
      group_id: "com.mediarithmics.visit-analyzer",
      artifact_id: "default"
    },
    count: 1
  };

  rpMockup
    .withArgs(
      sinon.match.has(
        "uri",
        sinon.match(function(value: string) {
          return value.match(/\/v1\/activity_analyzers\/(.){1,10}/) !== null;
        })
      )
    )
    .returns(activityAnalyzer);

  // Activity Analyzer properties stub
  const activityAnalyzerProperties: core.PluginPropertyResponse = {
    count: 1,
    data: [
      {
        technical_name: "analyzer_rules",
        value: {
          uri:
            "mics://data_file/tenants/10001/plugins_conf/activity_analyzer.conf"
        },
        property_type: "DATA_FILE",
        origin: "PLUGIN",
        writable: true,
        deletable: true
      }
    ],
    status: "ok"
  };

  rpMockup
    .withArgs(
      sinon.match.has(
        "uri",
        sinon.match(function(value: string) {
          return (
            value.match(/\/v1\/activity_analyzers\/(.){1,10}\/properties/) !==
            null
          );
        })
      )
    )
    .returns(activityAnalyzerProperties);

  // Fake Activity

  const activity = JSON.parse(`{
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
        },
        {
          "$event_name": "formulaire",
          "$properties": {
            "$referrer": "https://estcequecestbientotlapero.fr/",
            "$url": "https://estcequecestbientotlapero.fr/php/main_new_api.php?EXEC=CONTACT&STEP=1&ID_SESSION=tQ6GQojf&remb_soins=0&remb_optique=200&remb_dentaire=100&remb_hopital=0",
            "choix_dentaire": "100",
            "choix_hospitalisation": "0",
            "choix_optique": "200",
            "choix_soinscourants": "0",
            "produit": "SANTE",
            "session id": "tQ6GQojf",
            "taux remplissage": "0"
          },
          "$ts": 1479820777216
        }
      ],
      "$location": null,
      "$origin": {
        "$campaign_id": null,
        "$campaign_name": null,
        "$campaign_technical_name": null,
        "$channel": "referral",
        "$creative_id": null,
        "$creative_name": null,
        "$creative_technical_name": null,
        "$gclid": null,
        "$keywords": null,
        "$log_id": null,
        "$message_id": null,
        "$message_technical_name": null,
        "$referral_path": "https://www.google.fr/",
        "$social_network": null,
        "$source": "www.google.fr",
        "$sub_campaign_id": null,
        "$sub_campaign_technical_name": null,
        "$ts": 1479820606901
      },
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

  it("Check behavior of dummy activity analyzer", function(done) {
    // All the magic is here
    const plugin = new MyActivityAnalyzerPlugin();
    const runner = new core.TestingPluginRunner(plugin, rpMockup);

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
              .post("/v1/activity_analysis")
              .send(activity)
              .end((err, res) => {
                expect(res.status).to.eq(200);

                expect(JSON.parse(res.text).data.processed_by).to.be.eq(
                  `${activityAnalyzer.data.group_id}:${activityAnalyzer.data
                    .artifact_id} v.${activityAnalyzer.data
                    .visit_analyzer_plugin_id}`
                );
                done();
              });
          });
      });
  });
});
