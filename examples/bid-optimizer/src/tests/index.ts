import { expect } from "chai";
import "mocha";
import { core } from "@mediarithmics/plugins-nodejs-sdk";
import * as request from "supertest";
import * as sinon from "sinon";
import * as rp from "request-promise-native";
import { MyBidOptimizerPlugin } from "../MyPluginImpl";

describe("Test Example BidOptimizer", function() {
    // We stub the Gateway calls
    const rpMockup: sinon.SinonStub = sinon.stub();
  
    // Activity Analyzer stub
    const bidOptimizer: core.BidOptimizerResponse = {
      status: "ok",
      data: {
        id: "1000",
        name: "my analyzer",
        organisation_id: "1000",
        engine_version_id: "123456",
        engine_group_id: "com.mediarithmics.visit-analyzer",
        engine_artifact_id: "default"
      },
      count: 1
    };
  
    rpMockup
      .withArgs(
        sinon.match.has(
          "uri",
          sinon.match(function(value: string) {
            return value.match(/\/v1\/bid_optimizers\/(.){1,10}/) !== null;
          })
        )
      )
      .returns(bidOptimizer);
  
    // Activity Analyzer properties stub
    const bidOptimizerProperties: core.PluginPropertyResponse = {
      count: 1,
      data: [
        {
          technical_name: "name",
          value: {
            value:
              "my bid optimizer"
          },
          property_type: "DATA_FILE",
          origin: "STRING",
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
              value.match(/\/v1\/bid_optimizers\/(.){1,10}\/properties/) !==
              null
            );
          })
        )
      )
      .returns(bidOptimizerProperties);
    
    const bidDecisionRequest: core.BidOptimizerRequest = JSON.parse(`
        {
            "bid_info":{
               "media_type":"WEB",
               "ad_ex_id":"goo",
               "display_network_id":"1014",
               "media_id":"site:web:9gag.com",
               "content_id":"unknown",
               "geo_info":{
                  "geo_name_id":2972315,
                  "iso_country":"FR",
                  "admin1":"B3",
                  "admin2":"31",
                  "postal_code":"31000",
                  "point_name":"Toulouse",
                  "latitude":48.5735,
                  "longitude":7.7559
               },
               "placements":[
                  {
                     "placement_id":"plt:goo:c3bd9d8b",
                     "format":"300x250",
                     "visibility":"ABOVE_THE_FOLD",
                     "viewability":[
                        "goo:10"
                     ],
                     "sales_conditions":[
                        {
                           "id":"4147",
                           "deal_id":null,
                           "floor_price":0.1899999976158142
                        }
                     ],
                     "creative_id":"2445"
                  },
                  {
                     "placement_id":"plt:goo:c3bd9d8b",
                     "format":"300x250",
                     "visibility":"ABOVE_THE_FOLD",
                     "viewability":[
                        "goo:10"
                     ],
                     "sales_conditions":[
                        {
                           "id":"4148",
                           "deal_id":null,
                           "floor_price":0.1899999976158142
                        }
                     ],
                     "creative_id":"1963"
                  }
               ]
            },
            "campaign_info":{
               "organisation_id":"1042",
               "campaign_id":"1231",
               "ad_group_id":"1246",
               "currency":"EUR",
               "date":"2016-11-15T17:01:43.625+01:00",
               "max_bid_price":0.5099999904632568,
               "bid_optimizer_id":"37",
               "objective_type":"CPA",
               "objective_value":1.0,
               "imp_count":null,
               "avg_win_rate":null,
               "avg_bid_price":null,
               "avg_winning_price":null,
               "avg_delivery_price":null
            },
            "user_info":{
               "global_first_view":null,
               "media_first_view":null,
               "user_agent_info":{
                  "form_factor":"PERSONAL_COMPUTER",
                  "os_family":"WINDOWS",
                  "browser_family":"IE",
                  "brand":null,
                  "model":null,
                  "os_version":null,
                  "carrier":null
               }
            },
            "user_campaign_data_bag":null,
            "data_feeds":[
         
            ]
         }`);
  
    it("Check behavior of dummy bid optimizer", function(done) {
      // All the magic is here
      const plugin = new MyBidOptimizerPlugin(true);
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
                .post("/v1/bid_decisions")
                .send(bidDecisionRequest)
                .end((err, res) => {
                  expect(res.status).to.eq(200);
  
                  expect((JSON.parse(res.text) as core.BidOptimizerPluginResponse).bids[0].bid_price).to.be.eq(bidDecisionRequest.campaign_info.max_bid_price);
                  done();
                });
            });
        });
    });
  });